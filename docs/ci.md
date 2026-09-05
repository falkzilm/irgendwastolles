# CI-Pipeline

Dieses Dokument beschreibt die GitHub-Actions-Pipeline aus
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Sie setzt die
Anforderungen aus IRGENDWAST-17 um.

## Trigger

Die Pipeline läuft automatisch bei jedem `push` und bei jedem `pull_request`.
Ein `concurrency`-Guard bricht veraltete Läufe auf demselben Branch ab, sobald
ein neuer Push denselben Branch betrifft.

## Schritte

Der Job `ci` führt auf `ubuntu-latest` folgende Schritte einzeln sichtbar aus:

1. **Lint** (`npm run lint`) – ESLint über alle `.ts`/`.tsx`-Dateien.
2. **Typecheck** (`npm run typecheck`) – `tsc -b` ohne Ausgabe von Dateien.
3. **Unit tests** (`npm test`) – Vitest-Suite (`src/**/*.test.ts(x)`).
4. **Build** (`npm run build`) – Renderer-Build nach `dist/` und
   Electron-Build nach `dist-electron/` (siehe [`docs/packaging.md`](packaging.md)).
5. **E2E tests** (`npx playwright test`) – Playwright-Smoke-Test gegen die im
   vorherigen Schritt gebaute App (siehe [`docs/e2e.md`](e2e.md)). Ein
   vorgelagerter Schritt installiert den benötigten Chromium-Browser
   inklusive Systembibliotheken (`npx playwright install --with-deps
   chromium`).

Jeder Schritt bricht den Job bei einem Fehler ab (Standardverhalten von GitHub
Actions), sodass ein absichtlich eingebauter Lint- oder Testfehler die
Pipeline zuverlässig rot werden lässt und alle nachfolgenden Schritte
(inklusive Artefakt-Upload) übersprungen werden.

## Build-Artefakt

Nach einem erfolgreichen Lauf (alle vorherigen Schritte grün) lädt der letzte
Schritt `dist/` und `dist-electron/` per `actions/upload-artifact` als
Artefakt `build-output` hoch (14 Tage Aufbewahrung).

## Laufzeit

Lokal gemessene Laufzeiten der einzelnen Schritte (ohne Node-Setup/Checkout):

| Schritt    | Dauer   |
| ---------- | ------- |
| `npm ci`   | ~10s    |
| Lint       | ~4s     |
| Typecheck  | ~3s     |
| Unit tests | ~26s    |
| Build      | ~5s     |
| E2E tests  | ~15-20s |

In Summe liegt ein vollständiger Lauf damit deutlich unter 15 Minuten (grobe
Schätzung inkl. Checkout, Node-Setup mit npm-Cache und Artefakt-Upload:
1-2 Minuten). Aktuell besteht daher kein Optimierungsbedarf; sollte die
Laufzeit durch wachsende Test-Suiten künftig relevant steigen, sind
naheliegende Hebel das Parallelisieren von Lint/Typecheck/Unit-Tests in
separaten Jobs sowie das Aktivieren von Vitests `vmThreads`-Pool (siehe
Hinweis in der `npm test`-Ausgabe zur `jsdom`-Umgebung).
