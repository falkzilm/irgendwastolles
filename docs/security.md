# Electron-Härtung

Dieses Dokument beschreibt die sicherheitsrelevanten Standardeinstellungen für
`BrowserWindow` und Renderer sowie die Maßnahmen gegen unerwünschte Navigation.
Es setzt die Anforderungen aus IRGENDWAST-6 um.

## BrowserWindow-Konfiguration

`electron/main.ts` erzeugt jedes `BrowserWindow` mit folgenden `webPreferences`:

- `contextIsolation: true` – der Renderer-Kontext ist vom Kontext des Preload-Skripts
  getrennt; `window.api` wird ausschließlich über `contextBridge` (siehe
  `electron/preload.ts`) exponiert.
- `nodeIntegration: false` – der Renderer hat keinen direkten Zugriff auf Node.js-APIs.
- `sandbox: true` – der Renderer-Prozess läuft im Chromium-Sandbox-Prozess mit
  eingeschränkten OS-Rechten.

## Content-Security-Policy

Im Produktions-Build (kein `VITE_DEV_SERVER_URL` gesetzt) registriert
`applyContentSecurityPolicy()` in `electron/main.ts` einen
`session.defaultSession.webRequest.onHeadersReceived`-Handler, der jeder Antwort
folgenden Header hinzufügt:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'none'; frame-src 'none'
```

Im Dev-Modus (`npm run dev:electron`) bleibt der Header deaktiviert, da Vites
HMR-Client u.a. `'unsafe-eval'` und eine WebSocket-Verbindung zum Dev-Server
benötigt, die mit der restriktiven Policy nicht kompatibel sind.

## Navigation und neue Fenster

- `win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))` unterbindet
  `window.open()` sowie Links mit `target="_blank"` vollständig – es werden keine
  neuen Fenster oder Tabs geöffnet.
- `win.webContents.on('will-navigate', ...)` bricht jeden Navigationsversuch aus
  der Seite heraus (Linkklicks, `window.location`-Änderungen) mit
  `event.preventDefault()` ab. Das betrifft sowohl externe URLs als auch
  Navigation innerhalb der WebContents; die programmatischen `loadURL`-/
  `loadFile`-Aufrufe beim Fenster-Start lösen `will-navigate` nicht aus und sind
  davon nicht betroffen.

**Offene Frage:** Ob externe Links (z. B. Quellenangaben zu Formeln) im
System-Browser geöffnet werden dürfen, ist noch nicht geklärt. Bis zur Klärung
werden solche Navigationsversuche vollständig blockiert statt z. B. per
`shell.openExternal` im System-Browser geöffnet zu werden.

## Automatisierte Absicherung

`electron/main.security.test.ts` prüft anhand des Quellcodes von
`electron/main.ts`, dass `contextIsolation`, `nodeIntegration`, `sandbox`, die
CSP sowie die Handler für `setWindowOpenHandler` und `will-navigate` vorhanden
sind. Der Test läuft über `npm test` (Node-eigener Test-Runner, `node --test`)
und schlägt fehl, sobald eine dieser Einstellungen entfernt oder verändert wird.
