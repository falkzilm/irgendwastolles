# Achievements

Dieses Dokument beschreibt die Achievement-Definitionen und die
Unlock-Auswertung unter `src/achievements/`. Es setzt die Anforderungen aus
IRGENDWAST-44 um und baut auf dem `GamificationProfile` aus
[state.md](./state.md) (IRGENDWAST-41) auf.

## Schema

```ts
interface Achievement {
  id: string
  title: string
  description: string
  icon: string // Icon-Referenz (Emoji-Platzhalter), austauschbar gegen ein Icon-Asset
  ziel: number // Zielwert der Kennzahl aus `fortschritt`
  fortschritt: (profil: GamificationProfile) => number // liest die relevante Kennzahl aus dem Profil
}
```

Bedingung und Fortschritt sind dieselbe Kennzahl: eine Achievement gilt als
erfüllt, sobald `fortschritt(profil) >= ziel`. Das hält Freischalten und
Fortschrittsanzeige zwangsläufig konsistent, statt beides getrennt zu
pflegen.

## Katalog

`src/achievements/definitions.ts` enthält `ACHIEVEMENTS: Achievement[]`,
mindestens 12 kuratierte Achievements auf Basis der Zähler aus
`GamificationProfile` (`anzahlBerechnungen`, `anzahlQuizRunden`, `streak`,
`level`, `xp`), z. B. "100 Berechnungen" oder "7-Tage-Streak". Weitere
Achievements (z. B. "Quiz ohne Fehler" oder "alle Formelkategorien genutzt")
brauchen zusätzliche, aktuell nicht im Profil erfasste Zähler und sind daher
bewusst nicht Teil dieses Katalogs, bis ein Event dafür existiert - neue
Achievements werden hier einfach ergänzt, ohne die Auswertung anzufassen.

## Auswertung

`src/achievements/evaluate.ts`:

```ts
function ermittleNeueAchievements(profil: GamificationProfile): Achievement[]
function ermittleFortschritt(
  profil: GamificationProfile,
): AchievementFortschritt[]
// AchievementFortschritt: { achievement, aktuell, ziel, erreicht }
```

- `ermittleNeueAchievements(profil)` ist eine reine Funktion: sie liefert
  alle Achievements aus `ACHIEVEMENTS`, deren Bedingung im übergebenen
  Profil erfüllt ist und deren id **nicht** bereits in
  `profil.freigeschalteteAchievements` enthalten ist. Das Profil wird dabei
  nicht verändert. Der Aufruf ist so gedacht, dass er mit dem Profil
  **nach** Anwendung eines Events erfolgt (siehe `recordEvent` in
  `gamificationSlice.ts`) - jede erfüllte Bedingung liefert dadurch genau
  einmal ein Unlock-Ergebnis, ein erneuter Aufruf mit unverändertem Profil
  liefert dieselben Achievements erneut (Reinheit), ein Aufruf nach dem
  Eintragen der ids in `freigeschalteteAchievements` liefert sie dagegen
  nicht mehr.
- `ermittleFortschritt(profil)` liefert für **jede** Achievement aus
  `ACHIEVEMENTS` den aktuellen Stand, z. B. `{ aktuell: 42, ziel: 100,
erreicht: false }`. `aktuell` ist auf `ziel` gedeckelt, damit Kennzahlen,
  die über das Ziel hinauswachsen, keine Werte über 100 % ergeben.

Beide Funktionen sind reine Funktionen ohne Seiteneffekt und unit-getestet
(`definitions.test.ts`, `evaluate.test.ts`); sie greifen nicht selbst auf den
Store zu und lösen `freigeschalteteAchievements` nicht selbst aus - das
Fortschreiben des Profils nach einem Unlock ist Aufgabe des Aufrufers.
`recordEvent` in `gamificationSlice.ts` ist dieser Aufrufer: es wendet das
Event zunächst auf XP/Level/Streak/Zähler an, ruft anschließend
`ermittleNeueAchievements` mit diesem fortgeschriebenen Profil auf und trägt
die ids der zurückgelieferten Achievements in einem Zug in
`freigeschalteteAchievements` ein (siehe [state.md](./state.md)).

## Aufbau

```
src/achievements/
  types.ts          – Achievement
  definitions.ts     – ACHIEVEMENTS: Achievement[]
  evaluate.ts         – ermittleNeueAchievements(), ermittleFortschritt(), AchievementFortschritt
  index.ts            – öffentliche API, Re-Export der Typen
```
