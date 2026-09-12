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
    calculatorSlice.ts       – Rechner-Slice (Ausdruck, Ergebnis, Fehler)
    calculatorSlice.test.ts
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
- `calculatorMode: 'simple' | 'scientific'` (IRGENDWAST-25: einfaches vs.
  wissenschaftliches Tastenfeld), `setCalculatorMode`, `toggleCalculatorMode`
- `notificationsEnabled: boolean` (Default `true`, IRGENDWAST-46: Schalter für
  Gamification-Benachrichtigungen bei Level-Up/Achievement-Unlock),
  `setNotificationsEnabled` - siehe [notifications.md](./notifications.md)

Der Store ist über den Hook `useAppStore` aus `src/store` im Renderer nutzbar.

## Rechner-Slice

`calculatorSlice.ts` setzt die Anforderungen aus IRGENDWAST-24 um (Display
und Tastenfeld für Grundrechenarten):

- `expression: string`, `result: string | null`, `error: string | null`
- `input(token)` hängt ein Zeichen an den Ausdruck an; `clear()` leert
  Ausdruck/Ergebnis/Fehler; `backspace()` entfernt das letzte Zeichen;
  `evaluate()` ruft `evaluate()`/`formatResult()` aus `src/engine` auf und
  befüllt `result` bzw. `error`. Dabei wird `angleMode` aus dem
  `settingsSlice` als `EngineContext` mitgegeben, damit trigonometrische
  Funktionen (IRGENDWAST-25) den gewählten Winkelmodus berücksichtigen.
- `justEvaluated` merkt sich intern, ob `result` gerade durch `=` entstanden
  ist: Der nächste `input()`-Aufruf beginnt dann einen neuen Ausdruck (bei
  einem Operator wird mit dem vorigen Ergebnis weitergerechnet), statt den
  Text einfach an das Ergebnis anzuhängen.
- `loadExpression(expression)` übernimmt einen Ausdruck (z. B. aus dem
  Verlauf, siehe unten) ins Display und setzt `result`/`error` zurück.

Eine erfolgreiche `evaluate()` legt zusätzlich per `get().addVerlaufEintrag(...)`
einen Eintrag im `verlaufSlice` an (IRGENDWAST-26).

## Verlauf-Slice

`verlaufSlice.ts` setzt die Anforderungen aus IRGENDWAST-26 um (Berechnungsverlauf
mit Wiederverwendung):

- `verlauf: VerlaufEintrag[]` (`{ id, expression, result, timestamp }`), neueste
  Einträge zuerst.
- `addVerlaufEintrag(expression, result)` fügt vorne einen Eintrag an und kappt
  bei `MAX_VERLAUF_EINTRAEGE` (100).
- `clearVerlauf()` leert den Verlauf vollständig.

`src/pages/calculator/Verlauf.tsx` zeigt den Verlauf auf der Rechner-Seite: ein
Klick auf einen Eintrag ruft `loadExpression()` mit dessen Ausdruck auf, ist der
Verlauf leer erscheint ein erklärender Hinweistext. `verlauf` wird wie `theme`
und `angleMode` über `src/store/persistence.ts` persistiert, siehe
[persistence.md](./persistence.md).

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

## Favoriten-Slice

`favoritenSlice.ts` setzt den Favoriten-Teil aus IRGENDWAST-33 um (Formeln
als Favorit markieren):

- `favoritenIds: string[]` - die `id`s der als Favorit markierten Formeln
  aus `FORMULA_CATALOG` (siehe [formulas.md](./formulas.md)).
- `toggleFavorit(formulaId)` fügt die id hinzu bzw. entfernt sie, je
  nachdem, ob sie bereits enthalten ist.

`src/pages/FormulasPage.tsx` zeigt pro Formel einen Stern-Button, der
`toggleFavorit()` aufruft, sowie einen "Nur Favoriten"-Filter. `favoritenIds`
wird wie `verlauf` über `src/store/persistence.ts` persistiert, siehe
[persistence.md](./persistence.md).

## Gamification-Slice

`gamificationSlice.ts` setzt die Anforderungen aus IRGENDWAST-41
(Datenmodell und Store-Slice für das Spielerprofil), IRGENDWAST-42
(XP-Vergabe und Level-Kurve) sowie IRGENDWAST-43 (Tages-Streak) um.

- `gamification: GamificationProfile` mit `xp`, `level`,
  `restXpBisNaechstesLevel`, `streak`, `laengsterStreak` (der höchste je
  erreichte Streak, siehe unten), `letzterAktivitaetsTag` (lokales
  Kalenderdatum `YYYY-MM-DD` oder `null` vor dem ersten Event),
  `freigeschalteteAchievements` (IDs freigeschalteter Achievements, siehe
  [achievements.md](./achievements.md)), `achievementFreischaltDaten`
  (IRGENDWAST-48: ISO-Zeitstempel des Freischaltens je Achievement-`id`, für
  die Anzeige des Freischaltdatums auf der Trophäenseite), `anzahlBerechnungen`,
  `anzahlQuizRunden` und `xpEventsHeute` (Zähler je Event-Art am aktuellen
  Tag, Grundlage der Farming-Deckelung, siehe unten). Ein neues Profil
  startet mit den Defaults `level: 1`, `xp: 0`, `streak: 0`,
  `laengsterStreak: 0`.
- `recordEvent(event: GamificationEvent, jetzt?: Date)` ist der
  **einzige** Weg, das Profil zu verändern - es gibt keine weiteren
  `set...`-Actions auf dem Gamification-State. `jetzt` ist die injizierbare
  Zeitquelle für den Streak (Default: `new Date()`); Tests übergeben hier
  gezielte Zeitpunkte, statt die Systemzeit global zu mocken. `recordEvent`
  gibt `{ levelUp: boolean; level: number }` zurück, damit Aufrufer (z. B.
  künftig eine Level-Up-Animation) ein Level-Up direkt am Ergebnis erkennen
  können, ohne `gamification.level` vorher/nachher selbst zu vergleichen.
  Aktuell unterstützte Events, jeweils mit fest definierter XP-Belohnung
  (siehe `XP_BELOHNUNG` in `gamificationSlice.ts`):
  - `{ type: 'calculation_done' }` (5 XP) - eine erfolgreiche Berechnung im
    Rechner (erhöht `anzahlBerechnungen`). Ein triviales, beliebig oft
    wiederholbares Ereignis, daher über `XP_FARM_DECKEL` pro Kalendertag auf
    20 XP-vergebende Events begrenzt.
  - `{ type: 'quiz_round_finished' }` (20 XP) - eine abgeschlossene
    Quizrunde (erhöht `anzahlQuizRunden`). Erfordert pro Aufruf
    eigenständigen Aufwand und ist daher ungedeckelt.

  Ist für eine Event-Art an einem Tag der Deckel erreicht, zählt ein
  weiteres Event zwar weiterhin für die fachlichen Zähler
  (`anzahlBerechnungen`/`anzahlQuizRunden`) und den Streak, vergibt aber
  keine weitere XP. Der Zähler in `xpEventsHeute` setzt sich beim ersten
  Event eines neuen Kalendertags zurück.

  `level` und `restXpBisNaechstesLevel` werden deterministisch aus `xp`
  abgeleitet (`berechneLevelStand` in `gamificationSlice.ts`): die
  XP-Schwelle für Level `n` liegt kumulativ bei
  `XP_PRO_LEVEL_BASIS * (n - 1) * n / 2` (100 XP-Basis-Einheit) - die Kurve
  ist damit progressiv, jedes weitere Level braucht mehr XP als das
  vorherige (Level 1→2: 100 XP, 2→3: 200 XP, 3→4: 300 XP, ...).
  `restXpBisNaechstesLevel` ist die Differenz zwischen der Schwelle des
  nächsten Levels und `xp`.

  `streak` wird anhand von `letzterAktivitaetsTag` fortgeschrieben, wobei
  Kalendertage über die lokalen `Date`-Komponenten von `jetzt` bestimmt
  werden (nicht über `toISOString()`/UTC), damit der Streak den
  tatsächlichen Kalendertag am Aufenthaltsort abbildet und auch bei einem
  Zeitzonen- oder Uhrumstellung (z. B. Sommer-/Winterzeit) robust bleibt:
  ein Event am selben lokalen Tag lässt ihn unverändert, eines am lokalen
  Folgetag erhöht ihn um eins, ein größerer Abstand (oder das erste Event
  überhaupt) setzt ihn auf 1 zurück. Liegt der lokale Tag von `jetzt`
  dagegen _vor_ `letzterAktivitaetsTag` (z. B. Reise nach Westen über die
  Datumsgrenze oder eine manuelle Uhrkorrektur rückwärts), bleiben `streak`
  und `letzterAktivitaetsTag` unverändert - der bereits gezählte spätere Tag
  wird weder überschrieben noch entwertet. `laengsterStreak` wird bei jedem
  Event auf `Math.max(laengsterStreak, streak)` aktualisiert und damit
  unabhängig vom aktuellen `streak` gespeichert. Weitere Events (z. B. für
  zukünftige Formel-/Quiz-Typen) ergänzen `GamificationEvent` um eine
  weitere Variante, statt den State direkt zu setzen.

  Nach dem Fortschreiben von XP/Level/Streak/Zählern ruft `recordEvent`
  `ermittleNeueAchievements` (IRGENDWAST-44, siehe
  [achievements.md](./achievements.md)) mit dem so entstandenen Profil auf
  und trägt die ids der zurückgelieferten Achievements in
  `freigeschalteteAchievements` ein - ein Unlock wird dadurch innerhalb des
  Event-Flows genau einmal ausgelöst, ein erneutes Erfüllen derselben
  Bedingung löst wegen der bereits eingetragenen id keinen weiteren Unlock
  aus.

`gamification` wird wie `verlauf` und `favoritenIds` über
`src/store/persistence.ts` persistiert, siehe [persistence.md](./persistence.md).

## Quiz-Slice

`quizSlice.ts` setzt den Persistenz-Teil aus IRGENDWAST-38 um (Rundenergebnis
einer Quizrunde):

- `quizErgebnisse: QuizErgebnis[]` (`{ id, difficulty, anzahlAufgaben,
anzahlRichtig, dauerMs, timestamp }`), neueste Einträge zuerst.
- `addQuizErgebnis(ergebnis)` fügt vorne einen Eintrag an und kappt bei
  `MAX_QUIZ_ERGEBNISSE` (50).

`src/pages/QuizPage.tsx` setzt darauf die eigentliche Quiz-Ansicht um: Nutzer
wählen Schwierigkeitsstufe und Aufgabenanzahl, beantworten die über
`generateExercises`/`checkAnswer` (siehe [exercises.md](./exercises.md))
erzeugten Aufgaben mit direktem Richtig/Falsch-Feedback und sehen am Ende
eine Übersicht aus Anzahl richtiger Antworten und benötigter Zeit. Die aktive
Runde (aktuelle Aufgabe, Index, Zwischenstand) lebt ausschließlich als
lokaler Komponentenzustand der Seite, nicht im Store - ein Abbruch verwirft
diesen Zustand einfach, ohne den Store oder eine bereits persistierte Runde
zu berühren. Erst ein abgeschlossenes Rundenergebnis wird per
`addQuizErgebnis` in `quizErgebnisse` eingetragen und zusätzlich per
`recordEvent({ type: 'quiz_round_finished' })` an das Gamification-Profil
gemeldet (siehe oben). `quizErgebnisse` wird wie `verlauf` über
`src/store/persistence.ts` persistiert, siehe
[persistence.md](./persistence.md).

Die deklarative Achievement-Liste sowie die reine Auswertungsfunktion, die
aus `freigeschalteteAchievements` und dem restlichen Profil neu
freigeschaltete Erfolge ermittelt (IRGENDWAST-44), liegen unter
`src/achievements/`, siehe [achievements.md](./achievements.md).
