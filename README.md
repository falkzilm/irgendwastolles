# irgendwastolles

Vite + React + TypeScript Renderer mit Electron-Hülle (Main-/Preload-Prozess und typisierter IPC-Basis).

## Setup

```bash
npm install
npm run dev
```

Der Dev-Server startet unter der im Terminal angezeigten URL (standardmäßig http://localhost:5173/) und zeigt die Platzhalterseite im Browser.

Um die App als Electron-Desktopfenster zu starten:

```bash
npm run dev:electron
```

## Electron

- `electron/main.ts` erstellt das Browser-Fenster. Im Dev-Modus (`npm run dev:electron`) lädt es den Vite-Dev-Server, im Produktions-Build lädt es `dist/index.html` per `loadFile` – ohne laufenden Dev-Server.
- `electron/preload.ts` exponiert über `contextBridge` eine typisierte `window.api` an den Renderer (`contextIsolation` aktiv, kein `nodeIntegration`).
- `shared/ipc.ts` definiert Kanalnamen und Payload-Typen (u.a. den Testkanal `app:ping` sowie Platzhalter für künftige Persistenz-Kanäle) und wird sowohl von Main- als auch von Renderer-Code importiert, damit beide Seiten synchron bleiben.

Die sicherheitsrelevanten Standardeinstellungen (Sandbox, Context Isolation, CSP,
Blockieren von Navigation/`window.open`) sind in [`docs/security.md`](docs/security.md)
dokumentiert.

## npm-Scripts

| Script                  | Beschreibung                                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| `npm run dev`           | Startet den Vite-Dev-Server mit HMR (Browser, ohne Electron)                |
| `npm run dev:electron`  | Startet Vite-Dev-Server und öffnet die App im Electron-Fenster              |
| `npm run build`         | Prüft die Typen und baut Renderer (`dist/`) und Electron (`dist-electron/`) |
| `npm run start`         | Startet die gebaute App per Electron ohne laufenden Dev-Server              |
| `npm run typecheck`     | Führt die TypeScript-Typprüfung ohne Ausgabe von Dateien aus                |
| `npm run lint`          | Führt ESLint über alle `.ts`/`.tsx`-Dateien aus                             |
| `npm run format`        | Formatiert den Code mit Prettier                                            |
| `npm run format:check`  | Prüft, ob der Code dem Prettier-Format entspricht                           |
| `npm test`              | Führt die Vitest-Testsuite einmalig aus                                     |
| `npm run test:coverage` | Führt die Tests aus und erzeugt einen Coverage-Bericht                      |
| `npm run preview`       | Startet einen lokalen Server für das gebaute `dist/`-Bundle                 |
