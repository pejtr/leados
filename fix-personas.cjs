const fs = require('fs');
let c = fs.readFileSync('server/sales-personas.ts', 'utf8');
c = c.replace(/ONYX WEB/g, 'ONYX OS')
    .replace(/české webové agentury ONYX OS/g, 'agentury OPTIMATEO')
    .replace(/klientům ONYX OS/g, 'klientům OPTIMATEO')
    .replace(/ZNALOSTI O ONYX OS:[\s\S]*?(?=PROCES:)/, `ZNALOSTI O OPTIMATEO A ONYX OS:
Jsme OPTIMATEO. Nestavíme jen "weby". Budujeme diagnostiku a nasazujeme B2B platformu.

SLUŽBY A CENY:
- Mini audit zdarma — 0 Kč: Najdeme, kde váš web ztrácí poptávky
- ONYX OS Audit — 4 900 Kč: Detailní report a strategie na míru
- ONYX OS Setup — od 29 900 Kč: Kompletní nasazení lead-gen webu a CRM
- ONYX OS Monitoring — 1 999 Kč/měs.: Souvislá správa a analýza dat

PROČ OPTIMATEO:
- Většina agentur prodává webové vizitky bez výkonu. My najdeme trhliny v poptávkách a nasadíme ONYX OS.
- Hotovo rychle a bez kompromisů.
- Zviditelňujeme lokální služby, kliniky, realitní makléře a B2B společnosti.

`);
fs.writeFileSync('server/sales-personas.ts', c, 'utf8');
