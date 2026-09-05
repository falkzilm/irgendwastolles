# Persistenz des Stores

Dieses Dokument beschreibt, wie der persistierbare Anteil des zentralen
Stores (siehe [state.md](./state.md)) über IPC geladen und gespeichert wird.
Es setzt die Anforderungen aus IRGENDWAST-13 um.

Offene Frage aus dem Ticket: Ist die App rein offline gedacht oder wird
später Cloud-Sync/Account benötigt? Bis zur Klärung wird ausschließlich
lokal-only persistiert (JSON-Datei im `userData`-Verzeichnis).

## Ablauf

- **Main-Prozess** (`electron/persistence.ts`): liest/schreibt eine JSON-Datei
  (`store.json` im `userData`-Verzeichnis, verdrahtet in `electron/main.ts`)
  der Form `{ version: number, data: unknown }`. Der Main-Prozess kennt die
  Form von `data` nicht - er reicht sie nur durch.
- **IPC** (`shared/ipc.ts`): `persistence:get`/`persistence:set`-Kanäle.
  `persistence:get` bekommt die Renderer-Defaults mitgeschickt, damit eine
  beschädigte Datei direkt durch sie ersetzt werden kann.
- **Renderer** (`src/store/persistence.ts`): `hydratePersistedState()` lädt
  beim App-Start (`src/main.tsx`, vor dem ersten Render) die gespeicherten
  Werte und übernimmt sie validiert in den Store; `subscribeToPersistState()`
  speichert bei jeder Änderung. Ohne `window.api` (reiner Browser-Dev-Server
  via `npm run dev`) bleiben beide Funktionen wirkungslos, der Store nutzt
  seine Defaults.

## Schema-Version und Migration

`CURRENT_SCHEMA_VERSION` in `electron/persistence.ts` markiert die aktuelle
Form von `data`. Ein künftiger Versionssprung ergänzt lediglich einen
Eintrag in der `MIGRATIONS`-Map (`migrations[v]` hebt `data` von Version `v`
auf `v + 1` an); `migrateData` wendet passende Migrationen automatisch
nacheinander bis zur aktuellen Version an.

Fälle ohne verwertbare Daten liefern die übergebenen Defaults statt eines
Fehlers:

- keine Datei vorhanden (erster App-Start),
- Schema-Version ist neuer als bekannt oder es fehlt eine Migration - die
  Datei selbst bleibt dabei unverändert, falls sie von einer neueren
  App-Version stammt,
- Datei ist kein valides JSON bzw. hat nicht die Form `{ version, data }` -
  zusätzlich wird sie als `store.json.bak` gesichert und durch die Defaults
  ersetzt.

## Was wird persistiert?

`src/store/persistence.ts` wählt bewusst nur einzelne Felder aus (aktuell
`theme`, `angleMode` aus `settingsSlice`), keine Actions. Neue fachliche
Slices, die persistiert werden sollen, ergänzen ihre Felder in
`PersistableState`/`selectPersistableState` sowie in der
Validierung `isPersistableState`.

`theme` wird zusätzlich weiterhin über `localStorage` durch `ThemeProvider`
(siehe state.md) gespiegelt. Da `hydratePersistedState()` bereits vor dem
ersten Render abgeschlossen ist, initialisiert `ThemeProvider` beim Mount nur
noch dann aus `localStorage`/Systempräferenz, wenn kein `window.api`
existiert (reiner Browser-Dev-Server) - mit Electron-IPC bleibt der
hydrierte Wert maßgeblich und wird nicht überschrieben.
