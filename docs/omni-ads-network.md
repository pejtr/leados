# OMNI ADS Network — canonical runtime contract

OMNI ADS is a LEAD OS module. OPTIHUB is the cockpit/entry layer; advertising logic lives in LEAD OS.

## Runtime flow

```text
OPTIHUB
  -> LEAD OS
    -> OMNI ADS control plane
      -> site config
        -> CustomStream
        -> MainStream fallback
        -> frequency cap / cooldown
        -> impression + click evidence
```

All sites are fail-closed. A site with an installed slot renders nothing until `omni_ad_sites.enabled = true`.

## Canonical site integration

Add one zero-layout slot near the end of `body`:

```html
<div data-omni-ads-slot="content-tail"></div>
<script
  defer
  src="https://api.optihub.cz/omni-ads/runtime.js"
  data-omni-site="example.cz"></script>
```

No project may embed its own copy of the selection/frequency logic.

## Selection policy

1. Filter disabled/ineligible creatives.
2. Prefer eligible `custom` creatives targeted to the site.
3. When CustomStream is empty or frequency-exhausted, use `mainstream`.
4. Respect per-creative frequency cap and minimum repeat interval.
5. If nothing is eligible, render nothing and keep the slot at zero height.

The browser history used for fatigue protection is intentionally first-party per site. We do **not**
create a cross-domain visitor identifier or fingerprint. Therefore exact visitor-level frequency capping
across unrelated domains is not guaranteed; network-wide fatigue is reduced by creative inventory,
rotation and site-level caps.

## Public runtime

- `GET /omni-ads/runtime.js`
- `GET /omni-ads/v1/config/:siteKey`
- `POST /omni-ads/v1/event`

Events contain site, creative, placement and page path only. OMNI ADS does not require a third-party
advertising cookie.

## Control plane

LEAD OS admin → **OMNI ADS**:

- site ON/OFF
- creative ON/OFF
- CustomStream/MainStream status
- impressions and clicks

## Initial rollout

- katastr-online.cz
- do-italie.cz
- bezmasajidla.cz
- flightscanner24
- humandesignmapa.cz
- xmlvalidatoronline.com
- akcni-letenky.com
- lastminutedovolene.cz

Seeded sites start OFF. Enable only after the central runtime has been deployed and smoke-tested.
