# Prisma: Datenbank-Schema und Abhaengigkeiten

Diese Datei dokumentiert das aktuelle Prisma-Setup fuer das Projekt `paddlesport-launchspot-manager`.

## Ueberblick

- Datenbank: SQLite-Datei unter `data/database.sqlite`
- Prisma-Schema: `prisma/schema.prisma`
- Prisma-Konfiguration: `prisma.config.ts`
- Migrationen: `prisma/migrations`
- Generator: `prisma-client-js`

Die Datenquelle wird in `prisma.config.ts` auf eine lokale Datei gesetzt:

- `file:${projectRoot}/data/database.sqlite`

## Wichtige Abhaengigkeiten

Aus `package.json`:

- `prisma`: CLI und Schema-Management
- `@prisma/client`: generierter DB-Client fuer TypeScript/Node
- `@prisma/adapter-libsql`: Adapter fuer libSQL/Turso-kompatiblen Zugriff
- `@libsql/client`: Client-Bibliothek fuer libSQL
- `tsx`: Ausfuehrung von TS-Skripten wie Seed/Reset

## Datenmodell (Schema)

### Kernmodelle

- `User`
  - Nutzerkonto mit `email`, `username`, `password`, `isAdmin`
  - 1:n zu `LaunchPoint` ueber `createdBy`

- `Point`
  - Georeferenz (`name`, `latitude`, `longitude`)
  - 1:1 optional zu `LaunchPoint`
  - 1:1 optional zu `PublicTransportPoint`

- `LaunchPoint`
  - Fachliche Daten fuer Einstiegspunkte (z. B. `isOfficial`, `hints`, `openingHours`)
  - Pflicht-Relation zu `Point` via `pointId` (`@unique`)
  - Pflicht-Relation zu `User` via `createdById`
  - 1:n zu `PublicTransportStation`
  - n:m zu `Category` via Join-Tabelle `LaunchPointCategory`

- `Category`
  - Kategorien fuer LaunchPoints (`name_en`, `name_de`)
  - n:m mit `LaunchPoint` ueber `LaunchPointCategory`

### ÖPNV-Modelle

- `PublicTransportPoint`
  - Georeferenzierter ÖPNV-Punkt, 1:1 zu `Point`
  - optionale Linieninfo (`lines`)
  - 1:n zu `PublicTransportPointType`

- `PublicTransportPointType`
  - Typisierung eines ÖPNV-Punkts mit Enum `PublicTransportType`
  - Eindeutigkeit ueber `@@unique([publicTransportPointId, type])`

- `PublicTransportStation`
  - Stationen in der Naehe eines `LaunchPoint`
  - Distanzfeld `distanceMeters`

## Beziehungen und Loeschverhalten

- Mehrere Relationen nutzen `onDelete: Cascade`.
- Beim Loeschen von `Point` werden verbundene `LaunchPoint`/`PublicTransportPoint`-Datensaetze mitgeloescht.
- Join-Datensaetze (`LaunchPointCategory`, `PublicTransportPointType`) werden bei Cascade ebenfalls entfernt.

## Typische Prisma-Befehle

- `npm run db:generate` - Prisma Client neu generieren
- `npm run db:push` - Schema in DB uebertragen
- `npm run db:push:force` - DB mit Datenverlust zuruecksetzen und Schema pushen
- `npm run db:seed` - Seed-Skript ausfuehren (`prisma/seed.ts`)
- `npm run db:reset` - Daten sichern, DB resetten, Daten wiederherstellen (`prisma/reset-and-restore.ts`)
- `npm run db:studio` - Prisma Studio starten
- `npm run db:setup` - Generate + Push + Seed in einem Schritt

## Hinweise fuer Aenderungen am Schema

1. `prisma/schema.prisma` anpassen.
2. `npm run db:generate` ausfuehren.
3. `npm run db:push` (oder migrationsbasiert arbeiten, falls gewuenscht).
4. Bei relevanten Struktur-Aenderungen Seed/Restore-Skripte in `prisma/` mitpruefen.
