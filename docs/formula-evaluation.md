# Formel-Auswertung mit Variablenbindung

Dieses Dokument beschreibt `evaluateFormula()` unter `src/formulas/evaluate.ts`.
Es setzt die Anforderungen aus IRGENDWAST-32 um: eine Formel aus dem Katalog
(siehe `docs/formulas.md`, IRGENDWAST-30) mit konkreten Variablenwerten über
die Rechen-Engine (siehe `docs/engine.md`) auswerten, inklusive Validierung
fehlender oder unzulässiger Werte. Das Modul ist UI-unabhängig, ändert keine
Katalogdaten und baut ausschließlich auf den öffentlichen APIs von
`src/engine/` und `src/formulas/` auf.

## Voraussetzung: Variablenbindung in der Engine

`evaluate()` löst einen Bezeichner im Ausdruck zunächst gegen `CONSTANTS`
(`pi`/`e`) auf; ist er dort nicht enthalten, wird `context.variables`
konsultiert (siehe `docs/engine.md`). Damit hat `context.variables` - anders
als zuvor beschrieben - jetzt einen Einfluss auf das Ergebnis: `evaluate('pi*r^2',
{ variables: { r: 2 } })` liefert `{ ok: true, value: 12.566... }`.

## Öffentliche API

```ts
import { evaluateFormula } from '../formulas'

const result = evaluateFormula(kreisflaeche, { r: 2 })
// result: { ok: true, value: 12.566370614359172 }
```

```ts
function evaluateFormula(
  formula: Formula,
  values: Record<string, number>,
  context?: { angleMode?: AngleMode },
): FormulaEvaluationResult

type FormulaEvaluationResult =
  { ok: true; value: number } | { ok: false; error: FormulaEvaluationError }

interface FormulaEvaluationError {
  type:
    'missing-variable' | 'out-of-range' | 'syntax-error' | 'evaluation-error'
  message: string
  /** Betroffene Variable, nur bei "missing-variable" und "out-of-range". */
  variable?: string
}
```

`evaluateFormula()` wirft **nie** eine Exception, analog zu `evaluate()`.

## Validierung

Vor der Auswertung wird jede in `formula.variables` deklarierte Variable in
der dort definierten Reihenfolge geprüft:

- **Fehlender Wert**: Enthält `values` keinen Eintrag für den Variablennamen,
  liefert `evaluateFormula()` `{ ok: false, error: { type: 'missing-variable',
variable: '<name>', message: 'Fehlender Wert für Variable "<name>"' } }`.
- **Wertebereich**: Definiert die Variable einen `range` (siehe
  `docs/formulas.md`), wird der Wert gegen `min`/`max` (beide inklusiv)
  geprüft. Liegt er außerhalb, liefert `evaluateFormula()` `{ ok: false,
error: { type: 'out-of-range', variable: '<name>', message: '...' } }` -
  z. B. wird ein negativer Radius bei `{ range: { min: 0 } }` abgelehnt.

Die erste ungültige Variable wird gemeldet; die Prüfung bricht dort ab (kein
Sammeln aller Fehler wie beim Katalog-Loader, da hier ein einzelner
Auswertungsversuch mit einem einzelnen Ergebnis modelliert wird, analog zu
`evaluate()`).

Sind alle Variablen gültig, wird `formula.expression` mit `values` als
`context.variables` über `evaluate()` ausgewertet. Syntax- und
Auswertungsfehler der Engine (z. B. Division durch Null, siehe
`docs/engine.md`) werden unverändert als `{ ok: false, error: { type:
'syntax-error' | 'evaluation-error', message } }` durchgereicht.

## Beispiel

```ts
import { evaluateFormula } from '../formulas'

const kreisflaeche: Formula = {
  id: 'kreisflaeche',
  title: 'Kreisfläche',
  category: 'geometrie',
  description: 'Fläche eines Kreises aus dem Radius',
  latex: 'A = \\pi r^2',
  expression: 'pi*r^2',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  source: 'Schulbuch Mathematik Sek I',
}

evaluateFormula(kreisflaeche, { r: 2 })
// { ok: true, value: 12.566370614359172 }

evaluateFormula(kreisflaeche, {})
// { ok: false, error: { type: 'missing-variable', variable: 'r', message: 'Fehlender Wert für Variable "r"' } }

evaluateFormula(kreisflaeche, { r: -1 })
// { ok: false, error: { type: 'out-of-range', variable: 'r', message: '...' } }
```

Die Rundung für die Anzeige (`formatResult()`, siehe `docs/engine.md`) ist
nicht Teil von `evaluateFormula()` - der Rückgabewert bleibt der volle
`number`-Wert, analog zu `evaluate()`.

## Aufbau

```
src/formulas/
  evaluate.ts      – evaluateFormula(), FormulaEvaluationError, FormulaEvaluationResult
  evaluate.test.ts – Unit-Tests mit mindestens 5 unterschiedlichen Formeln
```

`evaluateFormula()` wird zusätzlich aus `src/formulas/index.ts` exportiert.
