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

Im Produktions-Build (kein `VITE_DEV_SERVER_URL` gesetzt) ruft `electron/main.ts`
`applyContentSecurityPolicy(session.defaultSession.webRequest)` aus
`electron/security.ts` auf. Diese Funktion registriert einen
`onHeadersReceived`-Handler, der jeder Antwort folgenden Header hinzufügt:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'none'; frame-src 'none'
```

Im Dev-Modus (`npm run dev:electron`) bleibt der Header deaktiviert, da Vites
HMR-Client u.a. `'unsafe-eval'` und eine WebSocket-Verbindung zum Dev-Server
benötigt, die mit der restriktiven Policy nicht kompatibel sind.

## Navigation und neue Fenster

- `win.webContents.setWindowOpenHandler(denyWindowOpen)` (`denyWindowOpen` aus
  `electron/security.ts`) unterbindet `window.open()` sowie Links mit
  `target="_blank"` vollständig – es werden keine neuen Fenster oder Tabs
  geöffnet.
- `win.webContents.on('will-navigate', blockNavigation)` (`blockNavigation` aus
  `electron/security.ts`) bricht jeden Navigationsversuch aus der Seite heraus
  (Linkklicks, `window.location`-Änderungen) mit `event.preventDefault()` ab.
  Das betrifft sowohl externe URLs als auch Navigation innerhalb der
  WebContents; die programmatischen `loadURL`-/`loadFile`-Aufrufe beim
  Fenster-Start lösen `will-navigate` nicht aus und sind davon nicht betroffen.

**Offene Frage:** Ob externe Links (z. B. Quellenangaben zu Formeln) im
System-Browser geöffnet werden dürfen, ist noch nicht geklärt. Bis zur Klärung
werden solche Navigationsversuche vollständig blockiert statt z. B. per
`shell.openExternal` im System-Browser geöffnet zu werden.

## Automatisierte Absicherung

`electron/main.security.test.ts` prüft die Härtungsmaßnahmen auf zwei Wegen:

- Die CSP-, Fenster- und Navigations-Logik liegt in `electron/security.ts` als
  von der Electron-Runtime entkoppelte, reine Funktionen
  (`applyContentSecurityPolicy`, `denyWindowOpen`, `blockNavigation`). Der Test
  importiert diese Funktionen direkt und ruft sie mit Fake-Objekten auf, um das
  tatsächliche Verhalten zu prüfen – z. B. dass `applyContentSecurityPolicy`
  wirklich einen `onHeadersReceived`-Handler registriert, der den korrekten
  `Content-Security-Policy`-Header setzt, und dass `blockNavigation` das
  Navigationsevent tatsächlich abbricht. Wird die Registrierung oder der
  Header entfernt, schlägt der Test fehl.
- `contextIsolation`, `nodeIntegration`, `sandbox` sowie die Verdrahtung dieser
  Funktionen in `electron/main.ts` (dass sie tatsächlich aufgerufen bzw. als
  Handler registriert werden) werden ergänzend anhand des Quellcodes geprüft,
  da `electron/main.ts` außerhalb der Electron-Runtime nicht importiert werden
  kann.

Der Test läuft über `npm test` (Node-eigener Test-Runner, `node --test`) und
schlägt fehl, sobald eine dieser Einstellungen entfernt oder verändert wird.
