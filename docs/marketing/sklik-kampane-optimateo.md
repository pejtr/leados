# Sklik kampane OPTIMATEO

Priprava pro spusteni placene navstevnosti na OPTIMATEO web. Cil je ziskat meritelne poptavky z B2B firem, zivnostniku a oborovych lokalnich sluzeb.

## 1. Merici nastaveni

Pred spustenim kampani nastav ve frontendu tyto verejne env promenne:

- `VITE_SEZNAM_SEM_ID` - aktualni SEM ID ze Sklik Spravy mereni.
- `VITE_SKLIK_RETARGETING_ID` - retargetingove ID ze Skliku.
- `VITE_SKLIK_CONVERSION_ID` - ID konverze "Odeslana poptavka".

Web odesila:

- SEM `PageView` na verejnych routach, `Lead` po skutecnem odeslani poptavky a `Purchase` az po serverove potvrzene platbe.
- Legacy retargetingovy hit a konverzi pres `rc.js` po dobu soubezne migrace.
- Konverzni hit po souhlasu a uspesnem odeslani formularu na homepage, `/web`, `/dotaznik`, `/audit-zdarma` a `/crm-lead-system`.
- Segment do URL landing page: `/lp/zivnostnici`, `/lp/b2b`, `/lp/remeslnici`, `/lp/restaurace`, `/lp/salony`, `/lp/ecommerce`.

Cookie lista pri souhlasu se Sklikem ulozi `sklik_consent=1`. Bez souhlasu se `sul.js` ani `rc.js` nenacita a zadny hit se neposila. Prechod na SEM lze podle oficialni dokumentace provozovat soubezne se starym merenim: https://napoveda.sklik.cz/merici-skripty/seznam-event-measurement/zaciname-se-sem/

## 2. URL a UTM sablony

Zakladni final URL (vzdy vcetne domeny `https://www.optimateo.com`):

- Zivnostnici: `/lp/zivnostnici?utm_source=sklik&utm_medium=cpc&utm_campaign=search_zivnostnici&utm_content={creative}&utm_term={keyword}`
- B2B: `/lp/b2b?utm_source=sklik&utm_medium=cpc&utm_campaign=search_b2b_leadgen&utm_content={creative}&utm_term={keyword}`
- Remeslnici: `/lp/remeslnici?utm_source=sklik&utm_medium=cpc&utm_campaign=search_remeslnici&utm_content={creative}&utm_term={keyword}`
- Restaurace: `/lp/restaurace?utm_source=sklik&utm_medium=cpc&utm_campaign=search_gastro&utm_content={creative}&utm_term={keyword}`
- Salony: `/lp/salony?utm_source=sklik&utm_medium=cpc&utm_campaign=search_salony&utm_content={creative}&utm_term={keyword}`
- E-commerce: `/lp/ecommerce?utm_source=sklik&utm_medium=cpc&utm_campaign=search_ecommerce&utm_content={creative}&utm_term={keyword}`

## 3. Kampanove portfolio

### SKLIK | Search | Zivnostnici | Web

Cil: OSVC a male firmy, ktere potrebuji rychle spustit poptavkovy web.

Sestavy:

- Web pro zivnostniky
- Levny web pro podnikani
- Web pro lokalni sluzby

Klicova slova:

- "web pro zivnostniky"
- "tvorba webu pro zivnostniky"
- "levny web pro podnikani"
- "web pro male firmy"
- "jednostrankovy web cena"
- "rychla tvorba webu"
- "webove stranky pro osvc"

Reklamy:

- Nadpis 1: Web pro zivnostniky
- Nadpis 2: Hotovo do 1-2 tydnu
- Nadpis 3: Od 3 490 Kc
- Popis: Postavime web, ktery vysvetli nabidku, ziska duveru a meri poptavky ze Skliku.

- Nadpis 1: Ziskejte vice poptavek
- Nadpis 2: Web bez sloziteho projektu
- Nadpis 3: Navrh zdarma
- Popis: Rychly web pro OSVC a male firmy vcetne textu, formulare a konverzniho mereni.

### SKLIK | Search | B2B | Lead Gen

Cil: firmy prodavajici sluzby, technologie, vyrobu nebo komplexni reseni.

Sestavy:

- B2B lead generation
- Firemni web
- Landing page pro kampane

Klicova slova:

- "b2b lead generation"
- "lead generation agentura"
- "tvorba firemniho webu"
- "landing page pro kampan"
- "vykonnostni landing page"
- "ziskavani b2b poptavek"
- "web pro b2b firmu"

Reklamy:

- Nadpis 1: B2B web pro poptavky
- Nadpis 2: Landing page + mereni
- Nadpis 3: OPTIMATEO
- Popis: Pripravime stranku, argumentaci a tracking pro kampane, ktere maji nosit obchodni leady.

- Nadpis 1: Mate malo B2B leadu?
- Nadpis 2: Zlepsete web i kampane
- Nadpis 3: Nezavazny navrh
- Popis: Jasna nabidka, segmentova landing page a konverzni funnel pro obchodni tym.

### SKLIK | Search | Obory | Remeslnici

Klicova slova:

- "web pro remeslnika"
- "web pro elektrikare"
- "web pro instalatera"
- "web pro stavebni firmu"
- "web pro truhlare"
- "tvorba webu remeslnici"

Reklama:

- Nadpis 1: Web pro remeslniky
- Nadpis 2: Vice lokalnich zakazek
- Nadpis 3: Rychle spusteni
- Popis: Sluzby, lokality, reference a rychly kontakt na jednom webu. Merime poptavky z kampani.

### SKLIK | Search | Obory | Restaurace

Klicova slova:

- "web pro restauraci"
- "web pro kavarnu"
- "rezervacni web restaurace"
- "tvorba webu restaurace"
- "online menu web"

Reklama:

- Nadpis 1: Web pro restaurace
- Nadpis 2: Menu a rezervace
- Nadpis 3: Od 4 999 Kc
- Popis: Prehledne menu, fotky, rezervacni vyzva a mereni kampani pro gastro provozy.

### SKLIK | Search | Obory | Salony

Klicova slova:

- "web pro salon"
- "web pro kadernictvi"
- "web pro kosmeticky salon"
- "online objednavky salon"
- "tvorba webu beauty"

Reklama:

- Nadpis 1: Web pro salony
- Nadpis 2: Vice objednanych terminu
- Nadpis 3: Navrh zdarma
- Popis: Sluzby, cenik, galerie, recenze a rychle objednani. Vhodne pro beauty a wellness.

### SKLIK | Search | E-commerce | Landing Pages

Klicova slova:

- "produktova landing page"
- "landing page pro eshop"
- "prodejni landing page"
- "kampan pro eshop"
- "zvyseni konverzi eshop"

Reklama:

- Nadpis 1: Landing page pro e-shop
- Nadpis 2: Vice objednavek z reklam
- Nadpis 3: Mereni konverzi
- Popis: Prodejni struktura pro produkt, kategorii nebo akci vcetne retargetingu a argumentu ke koupi.

### SKLIK | Brand | OPTIMATEO

Klicova slova:

- "optimateo"
- "optimateo digital agency"
- "optimateo web"

Reklama:

- Nadpis 1: OPTIMATEO
- Nadpis 2: Weby, automatizace, rust
- Nadpis 3: Digital Agency
- Popis: Oficialni web OPTIMATEO. Domluvte si nezavazny navrh webu nebo kampane.

## 4. Retargeting

### SKLIK | RTG | All Visitors 30d

Publikum: vsichni navstevnici webu za 30 dni.

Sdeleni:

- Dokoncete poptavku webu
- Navrh webu zdarma do 24 hodin
- Web s merenim kampani od OPTIMATEO

### SKLIK | RTG | LP Visitors No Lead 14d

Publikum: navstevnici `/lp/*`, kteri neodeslali poptavku.

Sdeleni:

- Mate kampan, ale web nemeri leady?
- Spustime web pripraveny pro Sklik
- Vyplnte kratky dotaznik, ozveme se do 24 hodin

### Vylouceni publik

- z akvizicniho retargetingu vyloucit odeslane leady;
- z nabidkoveho retargetingu vyloucit `deposit_paid`;
- klienty a administratory vyloucit podle prihlaseneho publika nebo interniho seznamu;
- B2B a male zivnostniky drzet v oddelenych publikach i kreative.

## 5. Vylucujici slova

Pouzit napric search kampanemi:

- zdarma
- sablona zdarma
- navod
- kurz
- prace
- brigada
- zamestnani
- wordpress zdarma
- wix
- webnode
- stahnout
- torrent
- logo zdarma
- grafika zdarma
- diplomka
- skola

## 6. Startovni rozpocty

Konzervativni start na prvnich 10-14 dni:

- Search Zivnostnici: 350 Kc/den
- Search B2B Lead Gen: 500 Kc/den
- Search Obory dohromady: 450 Kc/den
- Search E-commerce: 250 Kc/den
- Brand: 50 Kc/den
- Retargeting: 150 Kc/den

Po prvnich 30-50 proklicich na sestavu vyhodnotit CTR, cenu leadu, kvalitu poptavek a dotazy v search terms.

## 7. Rozsireni reklam a struktura uctu

Odkazy:

- Audit webu zdarma -> `/audit-zdarma`
- Ceny a rozsah -> `/pricing`
- CRM pro poptavky -> `/crm-lead-system`
- Web pro firmy -> `/web`

Popisky:

- Cesky dodavatel
- Cena a rozsah predem
- Mereni poptavek
- Odezva do 24 hodin

Struktura nazvu:

- kampan: `CZ | Search | Segment | Cil`
- sestava: `Problem | Sluzba | Shoda`
- reklama: `Nabidka | Varianta`

Na start pouzit presnou a frazovou shodu. Volnou shodu zapnout az ve chvili, kdy ma ucet dostatek kvalitnich lead konverzi a pravidelne se kontroluji vyhledavaci dotazy.

## 8. Vyhodnocení podle tržeb

Kazdy tyden sledovat:

- cenu za odeslany lead;
- podil leadu s `lead_qualified`;
- podil `call_booked`;
- podil `proposal_sent`;
- cenu za `deposit_paid`;
- skutecnou hodnotu a segment zaplacene zakazky.

Kampan neoptimalizovat pouze na formular. Rozhodujici je kvalifikovany lead a zaplacena zakazka.

## 9. QA checklist pred spustenim

- SEM ID je nastavene a `PageView` odchazi na kazde verejne SPA route po souhlasu.
- Legacy Sklik ID jsou nastavena jen po dobu soubezne migrace.
- Sklik konverzni ID je nastavene a konverze odchazi po uspesnem odeslani leadu.
- Cookie lista umi nastavit `sklik_consent=1` po marketingovem souhlasu.
- Po odmitnuti se nenacte `sul.js` ani `rc.js`.
- Vsechny landing pages vraci HTTP 200: `/lp/zivnostnici`, `/lp/b2b`, `/lp/remeslnici`, `/lp/restaurace`, `/lp/salony`, `/lp/ecommerce`.
- Final URL v reklamach obsahuje UTM parametry.
- Dotaznik prijima parametr `segment` a poptavky maji ve zdroji rozliseni Sklik kampane.
- Retargetingove publikum vylucuje uzivatele, kteri uz odeslali lead, pokud to Sklik nastaveni uctu umoznuje.
- Testovaci `Purchase` ma skutecne `order_id`, menu `CZK` a skutecnou zaplacenou hodnotu.
