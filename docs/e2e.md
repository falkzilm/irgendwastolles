# E2E-Tests mit Playwright

Dieses Dokument beschreibt das Ende-zu-Ende-Testsetup für die Electron-App. Es
setzt die Anforderungen aus IRGENDWAST-16 um.

## npm-Script

```bash
npm run test:e2e
```

Führt zunächst `npm run build` aus (Typprüfung, Renderer-Build nach `dist/`,
Electron-Build nach `dist-electron/`) und startet anschließend
[Playwright](https://playwright.dev/docs/api/class-electron) gegen genau
dieses gebaute Ergebnis – nicht gegen den Vite-Dev-Server. Der E2E-Test prüft
damit den Einstiegspunkt, der auch von `npm run start` und den
`electron-builder`-Artefakten (siehe [`docs/packaging.md`](packaging.md))
verwendet wird.

## Smoke-Test

`e2e/app.spec.ts` startet die Electron-App über `_electron.launch()` mit dem
Repo-Root als Argument (Electron liest `main` aus `package.json`, aktuell
`dist-electron/main.js`) und prüft:

- dass genau ein Fenster geöffnet wird,
- dass die Hauptnavigation (`aria-label="Hauptnavigation"`) gerendert ist,
- dass die Startansicht (Rechner, siehe `AppShell.tsx`) aktiv und sichtbar ist
  (Überschrift „Rechner“ sowie das Ausdrucks-Feld der Anzeige).

## Headless/CI-Fähigkeit

Electron benötigt zum Rendern eines `BrowserWindow` normalerweise ein Display.
Damit der Test auch auf Runnern ohne X-Server (kein Xvfb) läuft, setzt
`electron/main.ts` beim Start mit `E2E_HEADLESS=1` (so gesetzt von
`e2e/app.spec.ts`) Chromiums neuen Headless-Modus:

```ts
if (process.env.E2E_HEADLESS === '1') {
  app.commandLine.appendSwitch('headless', 'new')
  app.commandLine.appendSwitch('disable-gpu')
}
```

Das betrifft ausschließlich Läufe mit dieser Umgebungsvariable; das reguläre
Start- und Sicherheitsverhalten der App (`npm run start`, `npm run dev:electron`,
gepackte Artefakte) bleibt unverändert. Playwright startet den Prozess davon
unabhängig bereits mit `--no-sandbox`, wie es auch andere Electron-E2E-Setups
in Containern/CI benötigen.

Chromium selbst benötigt zur Laufzeit weiterhin die üblichen
Betriebssystem-Bibliotheken (u. a. `glib`, `nss`, `gtk`), die auf gängigen
CI-Images (z. B. `ubuntu-latest`) vorhanden sind. Fehlen sie auf einem
schlanken Host, lassen sie sich z. B. per `npx playwright install-deps`
nachinstallieren.

## Artefakte bei Fehlschlägen

`playwright.config.ts` konfiguriert:

- `screenshot: 'only-on-failure'`
- `trace: 'retain-on-failure'`

Schlägt ein Test fehl, liegen Screenshot und Trace anschließend unter
`test-results/` (via `npx playwright show-trace <pfad>/trace.zip` einsehbar).
Beide Verzeichnisse (`test-results/`, `playwright-report/`) sind wie `dist/`
und `dist-electron/` in `.gitignore` ausgeschlossen.
