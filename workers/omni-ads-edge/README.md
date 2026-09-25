# OMNI ADS Edge Worker

Cloudflare edge runtime for the LEAD OS → OMNI ADS network.

## Public surface

- `GET /omni-ads/runtime.js`
- `GET /omni-ads/v1/config/:siteKey`
- `POST /omni-ads/v1/event`

## Control surface

Protected by `OMNI_ADS_ADMIN_TOKEN`:

- `GET /omni-ads/v1/admin/sites`
- `POST /omni-ads/v1/admin/sites/:siteKey`
- `GET|POST /omni-ads/v1/admin/creatives`
- `GET /omni-ads/v1/admin/stats`

KV is the low-latency config truth layer. D1 stores non-PII impression/click evidence.

The Worker is routed only for `api.optihub.cz/omni-ads/*`, leaving the existing OPTIHUB Railway origin untouched for all other paths.
