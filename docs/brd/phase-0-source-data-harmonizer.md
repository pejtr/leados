# Phase 0 Source Data Harmonizer — BRD v1

## Verdikt

Phase 0 musí řešit auditovatelnost dat dřív než automatizaci.

## Business Purpose

Source Data Harmonizer vytvoří Source of Truth pro data, leady, signály a obchodní atribuci.

## MVP Scope

- Normalizace vstupních dat.
- Ruční atribuce zdrojů.
- Evidence data provenance.
- Přehled, odkud přišel obchodní signál.
- Základ pro pozdější automatizaci.

## Required Data Provenance Fields

- source_id
- provider_name
- source_type
- collected_at
- collected_by
- ingestion_method
- license_status
- redistribution_allowed
- confidence_score
- last_verified_at
- raw_reference
- normalized_reference
- client_visible_status
- internal_only_status

## Manual Attribution Tracker

Cíl: umožnit ruční přiřazení obchodní hodnoty ke zdroji.

Příklad:

- lead přišel z Google Search
- konverze vznikla přes formulář
- následná obchodní hodnota byla potvrzena ručně
- systém uloží source trail

## Acceptance Criteria

- Každý záznam má dohledatelný původ.
- Každý výstup má Source of Truth.
- Nejasné zdroje jsou označeny jako low confidence.
- Data bez licence nejsou určena pro veřejnou publikaci.

## Out of Scope

- Automatické napojení 65+ providerů.
- Právní garance compliance.
- Plně autonomní rozhodování.
