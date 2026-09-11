/**
 * OPTIHUB EDGE - trusted proxy / client address model.
 *
 * The security authority of a request must never come from a header the client
 * can set. Forwarding headers are only consulted when the TCP peer is a
 * configured trusted proxy; otherwise the socket address is used and every
 * `X-Forwarded-*` header is ignored.
 *
 * `resolveClientIp` defaults to taking the first address from the right of the
 * forwarding chain that is not itself a trusted proxy - i.e. the closest thing
 * to a real client. Spoofed entries to the left of a trusted proxy are ignored.
 *
 * Some platforms (Railway) do not append to an inbound `X-Forwarded-For`; they
 * replace it with their own `"<client>, <transport hop>"` chain. There the real
 * client is the left-most entry. That is only safe because the ingress discards
 * client-supplied values, so it must be selected explicitly via
 * {@link TrustedProxyChainMode} `platform_replaced_xff`; the default `last_hop`
 * keeps the append semantics (and stays fail-closed from the right).
 */

import type { Request } from "express";

export function parseTrustedProxies(value: string | undefined | null): readonly string[] {
  if (value === undefined || value === null) return [];
  return value
    .split(",")
    .map(entry => entry.trim())
    .filter(entry => entry !== "");
}

/**
 * How the forwarding chain is interpreted once the socket peer is a trusted
 * proxy.
 *
 * - `last_hop` (default): append semantics - walk from the right and take the
 *   first hop that is not a trusted proxy. Inbound entries the client prepended
 *   are ignored.
 * - `platform_replaced_xff`: the ingress discards client input and writes its own
 *   `"<client>, <hop>"` chain, so the left-most entry is the client. Select this
 *   only where that replace (not append) behaviour has been verified.
 */
export type TrustedProxyChainMode = "last_hop" | "platform_replaced_xff";

export function parseTrustedProxyChainMode(value: string | undefined | null): TrustedProxyChainMode {
  return value === "platform_replaced_xff" ? "platform_replaced_xff" : "last_hop";
}

export function normalizeIp(raw: string | undefined | null): string {
  if (raw === undefined || raw === null) return "";
  let ip = raw.trim().toLowerCase();
  const zone = ip.indexOf("%");
  if (zone !== -1) ip = ip.slice(0, zone);
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  return ip;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

function ipv4InCidr(ip: string, network: string, bits: number): boolean {
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const value = ipv4ToInt(ip);
  const base = ipv4ToInt(network);
  if (value === null || base === null) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (base & mask);
}

/** Accepts compressed IPv6, embedded IPv4 (`::ffff:a.b.c.d`) and zone ids. */
function ipv6ToBigInt(raw: string): bigint | null {
  const ip = normalizeIp(raw);
  if (!ip.includes(":")) return null;
  const sections = ip.split("::");
  if (sections.length > 2) return null;
  const parse = (part: string): number[] | null => {
    if (part === "") return [];
    const groups: number[] = [];
    for (const group of part.split(":")) {
      if (group.includes(".")) {
        const embedded = ipv4ToInt(group);
        if (embedded === null) return null;
        groups.push((embedded >>> 16) & 0xffff, embedded & 0xffff);
      } else {
        if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
        groups.push(Number.parseInt(group, 16));
      }
    }
    return groups;
  };
  const head = parse(sections[0] ?? "");
  const tail = sections.length === 2 ? parse(sections[1] ?? "") : [];
  if (head === null || tail === null) return null;
  const groups =
    sections.length === 2
      ? [...head, ...new Array<number>(8 - head.length - tail.length).fill(0), ...tail]
      : head;
  if (groups.length !== 8) return null;
  return groups.reduce<bigint>((value, group) => (value << BigInt(16)) | BigInt(group), BigInt(0));
}

function ipv6InCidr(ip: string, network: string, bits: number): boolean {
  if (!Number.isInteger(bits) || bits < 0 || bits > 128) return false;
  const value = ipv6ToBigInt(ip);
  const base = ipv6ToBigInt(network);
  if (value === null || base === null) return false;
  if (bits === 0) return true;
  const shift = BigInt(128 - bits);
  return (value >> shift) === (base >> shift);
}

export function isTrustedProxy(ip: string | undefined | null, trustedProxies: readonly string[]): boolean {
  const normalized = normalizeIp(ip);
  if (normalized === "") return false;
  for (const entry of trustedProxies) {
    const candidate = entry.trim().toLowerCase();
    if (candidate === "") continue;
    const slash = candidate.indexOf("/");
    if (slash !== -1) {
      const network = candidate.slice(0, slash);
      const bits = Number(candidate.slice(slash + 1));
      if (network.includes(".") ? ipv4InCidr(normalized, network, bits) : ipv6InCidr(normalized, network, bits)) {
        return true;
      }
      if (normalizeIp(network) === normalized) return true;
      continue;
    }
    if (normalizeIp(candidate) === normalized) return true;
  }
  return false;
}

/** Node/Express may present a duplicated header as a single comma-joined string. */
export function readForwardedChain(header: unknown): readonly string[] {
  const values = Array.isArray(header) ? header : [header];
  const hops: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    for (const part of value.split(",")) {
      const trimmed = part.trim();
      if (trimmed !== "") hops.push(normalizeIp(trimmed));
    }
  }
  return hops;
}

/**
 * The client address used for pre-auth abuse limiting and audit hashing.
 * @param trustedProxies configured proxy peers; empty means "no proxy in front".
 * @param chainMode how to read the chain; see {@link TrustedProxyChainMode}.
 */
export function resolveClientIp(
  req: Request,
  trustedProxies: readonly string[],
  chainMode: TrustedProxyChainMode = "last_hop",
): string {
  const socketIp = normalizeIp(req.socket?.remoteAddress);
  if (trustedProxies.length === 0) return socketIp;
  if (!isTrustedProxy(socketIp, trustedProxies)) return socketIp;

  const forwarded = readForwardedChain(req.headers["x-forwarded-for"]);

  if (chainMode === "platform_replaced_xff") {
    // The ingress overwrote the inbound chain, so every entry is platform
    // generated and the left-most one is the original client.
    return forwarded[0] ?? socketIp;
  }

  const chain = [...forwarded, socketIp];
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const hop = chain[index];
    if (hop !== undefined && hop !== "" && !isTrustedProxy(hop, trustedProxies)) return hop;
  }
  // Every hop is a trusted proxy; fall back to the left-most observed address.
  return chain[0] ?? socketIp;
}

/**
 * Reads the Cloudflare-injected `CF-Connecting-IP` header. This is only safe to
 * call after origin authentication has established that the request really came
 * through Cloudflare (which overwrites any client-supplied value and rejects
 * client attempts to set the header). It falls back to the socket peer when the
 * header is absent or malformed, so identity never comes from an empty value.
 */
export function resolveCloudflareClientIp(req: Request): string {
  const header = req.headers["cf-connecting-ip"];
  const value = Array.isArray(header) ? header[0] : header;
  const ip = normalizeIp(typeof value === "string" ? value : "");
  return ip !== "" ? ip : normalizeIp(req.socket?.remoteAddress);
}
