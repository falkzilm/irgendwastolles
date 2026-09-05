# Client-State (Zustand)

Dieses Dokument beschreibt den zentralen Client-Store und die Konvention für
neue Slices. Es setzt die Anforderungen aus IRGENDWAST-12 um.

## Aufbau

Der Store liegt unter `src/store/` und wird mit [Zustand](https://github.com/pmndrs/zustand)
nach dem "Slices"-Muster zusammengesetzt:

```
src/store/
  index.ts                  – erzeugt den Store, exportiert den Hook `useAppStore`
  types.ts                  – `AppState`: Intersection-Typ aller Slices
  slices/
    settingsSlice.ts         – Referenz-Slice (Theme, Winkelmodus)
    settingsSlice.test.ts
```

`index.ts` kombiniert alle Slices zu einem einzigen Store:

```ts
export const useAppStore = create<AppState>()((...args) => ({
  ...createSettingsSlice(...args),
  // ...createNeuerFachSlice(...args),
}))
```

## Konvention für neue Slices

**Dateiablage:** Jeder Slice bekommt eine eigene Datei unter
`src/store/slices/<name>Slice.ts` sowie eine `<name>Slice.test.ts` daneben.
Fachliche Slices aus den Epics kommen ebenfalls hierher – nicht in die
Feature-/Seiten-Ordner.

**Namensschema:**

- Datei: `camelCaseSlice.ts` (z. B. `settingsSlice.ts`, `verlaufSlice.ts`)
- State-Interface: `PascalCaseSlice` (z. B. `SettingsSlice`)
- Erzeugerfunktion: `createPascalCaseSlice` (z. B. `createSettingsSlice`),
  vom Typ `StateCreator<AppState, [], [], XyzSlice>`
- Actions liegen im selben Interface wie ihr State und heißen `set...`,
  `toggle...` bzw. beschreiben die fachliche Aktion (z. B. `addVerlaufEintrag`)

Jeder neue Slice wird in `src/store/types.ts` per Intersection zu `AppState`
hinzugefügt und in `src/store/index.ts` beim Erzeugen des Stores eingebunden.

**Selektoren:** Komponenten lesen den Store immer über einen Selektor, nie
über den kompletten State, damit sie nur bei relevanten Änderungen neu
rendern:

```ts
const theme = useAppStore((state) => state.theme)
const setTheme = useAppStore((state) => state.setTheme)
```

Werden mehrere Werte aus einem Slice benötigt, die eng zusammengehören, kann
eine kleine Selector-Funktion neben dem Slice exportiert werden
(`selectSettings(state) => ({ theme: state.theme, angleMode: state.angleMode })`),
statt in Komponenten mehrere Einzel-Selektoren zu wiederholen.

Außerhalb von React (z. B. in Utility-Funktionen) wird der State über
`useAppStore.getState()` gelesen bzw. über `useAppStore.setState(...)`
oder die Actions im State geändert – nicht direkt mutiert.

## Referenz-Slice: Einstellungen

`settingsSlice.ts` enthält als Referenz für neue Slices:

- `theme: 'light' | 'dark'`, `setTheme`, `toggleTheme`
- `angleMode: 'deg' | 'rad'` (Winkelmodus für den Rechner), `setAngleMode`

Der Store ist über den Hook `useAppStore` aus `src/store` im Renderer nutzbar.

`src/ui/theme.tsx` ist die einzige Quelle für DOM-/localStorage-Seiteneffekte
des Themes: `ThemeProvider` spiegelt `theme` aus dem Store in das
`data-theme`-Attribut sowie `localStorage`. Ohne `window.api` (reiner
Browser-Dev-Server, siehe [persistence.md](./persistence.md)) liest es beim
Mount zusätzlich die gespeicherte bzw. bevorzugte Einstellung aus
`localStorage`/Systempräferenz und schreibt sie in den Store; mit
Electron-IPC ist stattdessen der bereits vor dem ersten Render hydrierte Wert
maßgeblich. Der Theme-Wert selbst lebt ausschließlich im `settingsSlice`;
`useTheme()` ist ein dünner Wrapper um `useAppStore`-Selektoren, es gibt
keinen separaten React-Context mehr für das Theme.
