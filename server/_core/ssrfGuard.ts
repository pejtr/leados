/**
 * SSRF Guard — ochrana proti Server-Side Request Forgery.
 *
 * Uživatelé mohou zadávat cílové URL pro webhooky (a další odchozí požadavky).
 * Bez ochrany by útočník mohl nasměrovat požadavek na interní službu nebo na
 * cloud metadata endpoint (169.254.169.254) a vytáhnout instanční credentials.
 *
 * Strategie (defense-in-depth):
 *  1. Povolit jen http/https schémata a standardní webové porty.
 *  2. Při zápisu (vytvoření/úprava webhooku) i při samotném fetchi přeložit
 *     hostname přes DNS a každou vrácenou IP ověřit proti blokovaným rozsahům
 *     (loopback, link-local, RFC1918, CGNAT, multicast, reserved).
 *
 * Pozn. k DNS rebindingu: nativní fetch v Node neumožňuje snadno připnout
 * vyřešenou IP, takže kontrolujeme až těsně před požadavkem. To pokrývá běžné
 * SSRF; plně rebinding-proof řešení by vyžadovalo vlastní agent s pinnigem IP.
 */

import dns from "node:dns/promises";
import net from "node:net";

/** Porty, na které smí odchozí webhook mířit. */
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

// ─── IPv4 ────────────────────────────────────────────────────────────────────

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n;
  }
  return value >>> 0;
}

/** [start, end] inclusive ranges (jako uint32) které blokujeme. */
const BLOCKED_V4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // RFC1918
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (vč. 169.254.169.254 metadata)
  ["172.16.0.0", 12], // RFC1918
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // RFC1918
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved / 255.255.255.255
];

function isBlockedIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return true; // nevalidní → blokovat
  for (const [base, bits] of BLOCKED_V4_RANGES) {
    const baseInt = ipv4ToInt(base);
    if (baseInt === null) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((value & mask) === (baseInt & mask)) return true;
  }
  return false;
}

// ─── IPv6 ────────────────────────────────────────────────────────────────────

function expandIpv6ToBytes(ip: string): number[] | null {
  // Odstranit zone index (fe80::1%eth0)
  const clean = ip.split("%")[0];

  // IPv4-mapped / -embedded: ::ffff:1.2.3.4 nebo ::1.2.3.4
  const v4Match = clean.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  let head = clean;
  let tailV4: number[] | null = null;
  if (v4Match) {
    const v4 = ipv4ToInt(v4Match[1]);
    if (v4 === null) return null;
    tailV4 = [(v4 >>> 24) & 0xff, (v4 >>> 16) & 0xff, (v4 >>> 8) & 0xff, v4 & 0xff];
    head = clean.slice(0, clean.length - v4Match[1].length).replace(/:$/, ":");
  }

  const sides = head.split("::");
  if (sides.length > 2) return null;

  const parseGroups = (s: string): number[] | null => {
    if (!s) return [];
    const groups = s.split(":").filter(g => g.length > 0);
    const bytes: number[] = [];
    for (const g of groups) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
      const n = parseInt(g, 16);
      bytes.push((n >>> 8) & 0xff, n & 0xff);
    }
    return bytes;
  };

  const left = parseGroups(sides[0]);
  if (left === null) return null;
  const right = sides.length === 2 ? parseGroups(sides[1]) : [];
  if (right === null) return null;

  const v4Bytes = tailV4 ?? [];
  const total = left.length + right.length + v4Bytes.length;
  if (sides.length === 1) {
    if (total !== 16) return null;
    return [...left, ...v4Bytes];
  }
  // "::" doplní nuly uprostřed
  const fill = 16 - total;
  if (fill < 0) return null;
  return [...left, ...new Array(fill).fill(0), ...right, ...v4Bytes];
}

function isBlockedIpv6(ip: string): boolean {
  const bytes = expandIpv6ToBytes(ip);
  if (!bytes || bytes.length !== 16) return true;

  // ::1 loopback nebo :: unspecified
  const allZeroExceptLast = bytes.slice(0, 15).every(b => b === 0);
  if (allZeroExceptLast && (bytes[15] === 1 || bytes[15] === 0)) return true;

  // IPv4-mapped ::ffff:a.b.c.d → ověřit jako IPv4
  const isV4Mapped =
    bytes.slice(0, 10).every(b => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  if (isV4Mapped) {
    const v4 = `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
    return isBlockedIpv4(v4);
  }

  // fc00::/7 ULA
  if ((bytes[0] & 0xfe) === 0xfc) return true;
  // fe80::/10 link-local
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true;
  // ff00::/8 multicast
  if (bytes[0] === 0xff) return true;

  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isBlockedIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return isBlockedIpv4(ip);
  if (kind === 6) return isBlockedIpv6(ip);
  return true; // ne-IP řetězec → blokovat
}

/**
 * Ověří, že URL je veřejná http(s) adresa bezpečná pro odchozí požadavek.
 * Vyhazuje {@link SsrfError} při porušení. Provádí DNS rezoluci hostname.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfError("Neplatná URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError(`Nepovolené schéma: ${url.protocol} (povoleno jen http/https).`);
  }

  if (url.username || url.password) {
    throw new SsrfError("URL nesmí obsahovat přihlašovací údaje.");
  }

  if (url.port && !ALLOWED_PORTS.has(Number(url.port))) {
    throw new SsrfError(`Nepovolený port: ${url.port}.`);
  }

  const host = url.hostname.replace(/^\[|\]$/g, ""); // odstranit [] u IPv6 literálů

  // Blokovat zjevně interní hostname
  if (
    host.length === 0 ||
    host.toLowerCase() === "localhost" ||
    host.toLowerCase().endsWith(".localhost") ||
    host.toLowerCase().endsWith(".local") ||
    host.toLowerCase().endsWith(".internal")
  ) {
    throw new SsrfError(`Nepovolený host: ${host}.`);
  }

  // Hostname je IP literál?
  if (net.isIP(host)) {
    if (isBlockedIp(host)) {
      throw new SsrfError(`Cílová IP je v privátním/rezervovaném rozsahu: ${host}.`);
    }
    return;
  }

  // Jinak přeložit přes DNS a ověřit VŠECHNY vrácené adresy
  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new SsrfError(`DNS rezoluce selhala pro host: ${host}.`);
  }

  if (addresses.length === 0) {
    throw new SsrfError(`Host se nepodařilo přeložit: ${host}.`);
  }

  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new SsrfError(
        `Host ${host} se překládá na privátní/rezervovanou IP (${address}).`
      );
    }
  }
}

/**
 * Bezpečná varianta fetch — před požadavkem ověří, že cíl není interní.
 * Drop-in náhrada za `fetch` pro uživatelem zadané URL.
 */
export async function safeFetch(
  rawUrl: string,
  init?: RequestInit
): Promise<Response> {
  await assertPublicHttpUrl(rawUrl);
  return fetch(rawUrl, {
    ...init,
    redirect: "manual", // nesledovat redirecty automaticky (mohly by obejít kontrolu)
  });
}
