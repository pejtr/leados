# World Monitor Data Governance — BRD v1

## Verdikt

World Monitor není Phase 0 MVP. Je to Enterprise Risk Intelligence add-on.

## Business Purpose

Použít geopolitická, infrastrukturní a riziková data pouze tam, kde je jasná licence, spolehlivost a audit trail.

## Data Categories Needed

- outages
- cyber threats
- cables
- datacenters
- natural risks
- geopolitical events
- infrastructure dependencies

## API Due Diligence Checklist

- Jaké endpointy jsou oficiálně dostupné?
- Jaká je licence dat?
- Je povolena redistribuce?
- Je povoleno veřejné publikování?
- Jsou data real-time, near-real-time, nebo historická?
- Jaké jsou limity API?
- Jaká je odpovědnost za interpretaci?

## Source Reliability Scoring

Každý zdroj musí mít:

- provider_name
- update_frequency
- confidence_score
- license_status
- redistribution_allowed
- last_verified_at
- internal_only_status

## Allowed Use Cases

### Internal Intelligence

Povoleno jako interní rozhodovací signál.

### Client Dashboard

Povoleno pouze při jasné licenci a správném označení zdroje.

### Public Publishing

Pouze pokud licence explicitně dovoluje redistribuci a publikaci.

## Red Flags

- nejasná licence
- chybějící source attribution
- nemožnost ověřit původ dat
- snaha publikovat data bez právního ověření
- zaměňování interní intelligence za veřejnou zprávu

## Approval Gates

Před použitím ve veřejném produktu:

1. API licence review.
2. Data provenance review.
3. Legal/commercial approval.
4. Client-facing disclaimer.
5. Monitoring reliability.
