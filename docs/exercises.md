# Aufgabengenerator

Dieses Dokument beschreibt den Aufgabengenerator unter `src/exercises/`. Es
setzt die Anforderungen aus IRGENDWAST-37 um: ein reines, UI-unabhängiges
Modul, das Rechenaufgaben mit Schwierigkeitsstufen und deterministischem
Seed erzeugt und Antworten prüft.

**Offene Frage:** Welche Altersgruppe/Niveaustufen genau abgedeckt werden
sollen, ist nicht abschließend geklärt. Die drei Schwierigkeitsstufen
`leicht`/`mittel`/`schwer` orientieren sich an typischen Sek-I-Anforderungen
(ähnlich der offenen Frage zur Zielgruppe in [formulas.md](./formulas.md));
die Zahlenbereiche pro Stufe lassen sich in `generator.ts` anpassen, ohne die
öffentliche API zu ändern.

## Schema

```ts
type Difficulty = 'leicht' | 'mittel' | 'schwer'
type ExerciseCategory = 'grundrechenarten' | 'prozent' | 'formel'

interface Exercise {
  id: string
  category: ExerciseCategory
  difficulty: Difficulty
  prompt: string // Aufgabentext, z. B. "7 + 3 = ?"
  answer: number // korrekte Lösung
  tolerance: number // erlaubte Abweichung bei der Antwortprüfung (siehe checkAnswer())
}
```

## Generator

```ts
import { generateExercises } from '../exercises'

const exercises = generateExercises({
  seed: 42,
  count: 10,
  difficulty: 'mittel',
  categories: ['grundrechenarten', 'prozent', 'formel'], // optional, Standard: alle
})
```

`generateExercises(options): Exercise[]` zieht sämtlichen Zufall (Kategorie
je Aufgabe, Operanden, Operator, Prozentsatz, Formel) aus einem seedbasierten
Zufallsgenerator (`rng.ts`, mulberry32) - bei identischem `seed` (und
identischen übrigen Optionen) liefert der Generator reproduzierbar dieselbe
Aufgabenfolge, unabhängig von Plattform oder Laufzeit.

Kategorien:

- **`grundrechenarten`**: Grundrechenarten `+ - * /`. Der Operatorpool wächst
  mit der Schwierigkeit (`leicht`: `+ -`, `mittel`: zusätzlich `*`, `schwer`:
  zusätzlich `/`). Subtraktion liefert nie ein negatives Ergebnis, Division
  geht immer restlos auf - beide Aufgaben bleiben dadurch ohne Dezimalzahlen
  lösbar. `tolerance: 0`.
- **`prozent`**: "Wie viel sind p% von b?" (alle Stufen) bzw. - ab `mittel`
  zufällig statt dessen - eine Erhöhung um p% von b. `tolerance: 0.01` deckt
  die Rundung auf 2 Nachkommastellen ab.
- **`formel`**: Flächenberechnung für Rechteck (`A = a·b`, exakt,
  `tolerance: 0`), Kreis (`A = π·r²`) oder Dreieck (`A = g·h/2`), jeweils mit
  auf 2 Nachkommastellen gerundetem Ergebnis bei Kreis/Dreieck
  (`tolerance: 0.01`).

Der Zahlenbereich (Operanden, Grundwert, Seitenlängen) wächst mit der
Schwierigkeitsstufe.

## Antwortprüfung

```ts
import { checkAnswer } from '../exercises'

checkAnswer(exercise, 12.565) // true, wenn innerhalb exercise.tolerance
```

`checkAnswer(exercise, given, toleranceOverride?): boolean` akzeptiert einen
Wert, dessen absolute Abweichung von `exercise.answer` `exercise.tolerance`
nicht überschreitet (inklusiv); nicht-endliche Werte (`NaN`, `Infinity`)
werden immer abgelehnt. `toleranceOverride` erlaubt es, testweise oder für
eine großzügigere UI eine abweichende Toleranz zu verwenden, statt die aus
`exercise.tolerance`.

## Aufbau

```
src/exercises/
  types.ts          – Difficulty, ExerciseCategory, Exercise
  rng.ts            – createRng(), randomInt(), pickOne() (deterministischer Zufall)
  generator.ts      – generateExercises()
  checkAnswer.ts    – checkAnswer()
  index.ts          – öffentliche API, Re-Export der Typen
```

Das Modul hat keine Abhängigkeit auf React, den Store oder eine UI-Komponente
und wird unverändert von der Quiz-/Übungsseite (`src/pages/QuizPage.tsx`,
IRGENDWAST-38, siehe [state.md](./state.md)) verwendet.
