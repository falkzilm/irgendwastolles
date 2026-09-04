# irgendwastolles

Renderer-Grundstruktur auf Basis von Vite + React + TypeScript (nur Renderer-Seite, ohne Electron).

## Setup

```bash
npm install
npm run dev
```

Der Dev-Server startet unter der im Terminal angezeigten URL (standardmäßig http://localhost:5173/) und zeigt die Platzhalterseite.

## npm-Scripts

| Script              | Beschreibung                                              |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Startet den Vite-Dev-Server mit HMR                        |
| `npm run build`     | Prüft die Typen und erzeugt ein Produktions-Bundle in `dist/` |
| `npm run typecheck` | Führt die TypeScript-Typprüfung ohne Ausgabe von Dateien aus |
| `npm run lint`      | Führt Oxlint über den Quellcode aus                        |
| `npm run preview`   | Startet einen lokalen Server für das gebaute `dist/`-Bundle |
