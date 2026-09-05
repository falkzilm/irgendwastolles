# Packaging mit electron-builder

Dieses Dokument beschreibt, wie aus dem Electron-Projekt installierbare
Desktop-Artefakte gebaut werden. Es setzt die Anforderungen aus IRGENDWAST-15
um.

## npm-Script

```bash
npm run package
```

Führt zunächst `npm run build` aus (Typprüfung, Renderer-Build nach `dist/`,
Electron-Build nach `dist-electron/`) und baut anschließend mit
[electron-builder](https://www.electron.build/) ein Linux-Artefakt
(`AppImage`) nach `release/`. Das AppImage bündelt die Electron-Runtime
vollständig – auf dem Zielsystem müssen weder Node.js noch Electron
installiert sein.

Für einen Windows-Build steht zusätzlich `npm run package:win` zur Verfügung.
Ein NSIS-Installer für Windows lässt sich nur auf einem Windows-Host oder auf
einem Linux-Host mit installiertem Wine erzeugen (electron-builder nutzt
Wine, um Icon/Versionsinformationen in die `.exe` einzubetten); in dieser
Entwicklungsumgebung ohne Wine schlägt `package:win` fehl. In CI sollte dieses
Script daher auf einem `windows-latest`-Runner laufen.

## Zentrale Konfiguration

App-Name und Version werden von electron-builder standardmäßig aus
`package.json` (`name`, `version`) übernommen – es gibt keine doppelte
Pflege dieser Werte in einer separaten Builder-Konfiguration. Das Icon
(`build/icon.png`, aus `public/favicon.svg` gerendert) ist ebenfalls einmalig
in `package.json` (`build.icon`) referenziert; electron-builder erzeugt
daraus automatisch die plattformspezifischen Icon-Formate (`.ico` für
Windows).

## Build-Ausgabe

electron-builder schreibt nach `release/` (`build.directories.output` in
`package.json`), getrennt von den bereits vorhandenen `dist/`- und
`dist-electron/`-Ausgabeverzeichnissen von Vite. `release/` ist wie diese in
`.gitignore` ausgeschlossen.

## Offene Frage: Zielplattformen und Code-Signing

Laut Ticket ist bis zur Klärung der verbindlichen Zielplattformen und des
Signing-/Notarisierungs-Scopes wie folgt vorzugehen: Es werden **unsignierte
Artefakte für Windows und Linux** gebaut (`npm run package` für Linux,
`npm run package:win` für Windows). macOS ist damit vorerst **nicht** im
Scope dieses Tickets.

Als Folgeticket zu klären, sobald die Anforderungen feststehen:

- Wird ein macOS-Build (`.dmg`/`.pkg`) benötigt?
- Ist Code-Signing (Windows Authenticode, macOS Developer ID) und – für
  macOS zwingend erforderlich – Notarisierung im Scope? Beides setzt
  Zertifikate/Apple-Developer-Account voraus, die aktuell nicht vorliegen.
- Falls Signing verbindlich wird: Ablage der Signing-Secrets in der
  CI-Umgebung statt im Repository.
