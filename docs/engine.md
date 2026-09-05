# Rechen-Engine

Dieses Dokument beschreibt die öffentliche API des Rechen-Moduls unter
`src/engine/`. Es setzt die Anforderungen aus IRGENDWAST-20 um.

## Öffentliche API

```ts
import { evaluate } from '../engine'

const result = evaluate('2+3*4')
// result: { ok: true, value: 14 }
```

`evaluate(expression, context?)` ist der einzige Einstiegspunkt, auf dem
weitere Engine-Items (z. B. Variablen, Winkelmodus, Funktionen) aufbauen:

- `expression: string` – der auszuwertende Ausdruck.
- `context?: EngineContext` – optional, aktuell ohne Einfluss auf das
  Ergebnis. Der Parameter ist bewusst Teil der Signatur, damit künftige
  Engine-Items (z. B. Variablen aus der Formelbibliothek) die öffentliche
  API nicht mehr ändern müssen.
- Rückgabewert `EngineResult`:
  ```ts
  type EngineResult =
    { ok: true; value: number } | { ok: false; error: EngineError }

  interface EngineError {
    type: 'syntax-error' | 'evaluation-error'
    message: string
    position?: number // Zeichenposition im Ausdruck, nur bei syntax-error
  }
  ```
  `evaluate()` wirft **nie** eine Exception – ungültige Ausdrücke (z. B.
  `'2++'` oder `'(1+2'`) liefern stattdessen `{ ok: false, error }`.

## Unterstützte Syntax

- Grundrechenarten: `+ - * / %` sowie Potenzierung `^`
- Klammern `(` `)`
- Vorzeichen (unäres `+`/`-`), z. B. `-2.5*4`
- Dezimalzahlen mit `.` als Trennzeichen, z. B. `2.5`

**Präzedenz** (niedrig zu hoch): `+`/`-` < `*`/`/`/`%` < unäres Vorzeichen
< `^`. `^` ist rechtsassoziativ, unäres Vorzeichen bindet schwächer als
`^` (`-2^2` ergibt `-4`, analog zu Python), im Exponenten ist wiederum ein
Vorzeichen erlaubt (`2^-2`).

`/` und `%` durch `0` liefern einen `evaluation-error` (`Division durch
Null`) statt `Infinity`/`NaN`.

## Fehlerbehandlung: Division durch Null, Overflow, NaN

`evaluate()` liefert nie `Infinity` oder `NaN` als Ergebnis, sondern immer
ein `{ ok: false, error }`:

- **Division/Modulo durch Null** (`1/0`, `1%0`) wird bereits im Evaluator
  erkannt und wirft einen `EngineEvaluationError` mit der Meldung
  `Division durch Null`.
- **Overflow** (z. B. `10^400`, Ergebnis wird `Infinity`) und **NaN**
  (z. B. `(-8)^0.5`, Wurzel aus einer negativen Zahl) werden zentral in
  `evaluate()` über `Number.isFinite(value)` abgefangen und als
  `evaluation-error` mit der Meldung `Ergebnis ist keine endliche Zahl.`
  gemeldet.

## Genauigkeit und Formatierung

**Offene Frage (IRGENDWAST-22):** Reicht IEEE-Double mit Rundung oder ist
eine Decimal-Bibliothek nötig? Entscheidung bis zur weiteren Klärung:
**Double + Rundung auf 12 signifikante Stellen.** IEEE-Double-Arithmetik
bleibt für die Grundrechenarten intern unverändert; die Rundung passiert
ausschließlich in der Anzeige-Formatierung (`formatResult()`), nicht im
Rechenergebnis selbst (`evaluate()` liefert weiterhin den vollen
`number`-Wert). Das behebt sichtbare Fließkomma-Artefakte wie `0.1+0.2`
(intern `0.30000000000000004`), ohne die interne Genauigkeit zu verändern.
Sollte sich diese Genauigkeit als unzureichend erweisen (z. B. für
Finanzrechnungen mit exakten Dezimalstellen), ist der Wechsel auf eine
Decimal-Bibliothek als eigenständiges Engine-Item nachzuziehen.

Die Formatierung ist in einem eigenen Modul `src/engine/format.ts`
gekapselt und dort separat unit-getestet
(`src/engine/format.test.ts`):

```ts
import { formatResult } from '../engine'

formatResult(0.1 + 0.2) // '0.3'
formatResult(1e12) // '1e12'
formatResult(0.0000001234) // '1.234e-7'
```

`formatResult(value: number): string`:

- rundet auf 12 signifikante Stellen (`toPrecision(12)`) und entfernt
  dabei überflüssige Nachkommanullen,
- gibt sehr große (Betrag >= 1e12) und sehr kleine (Betrag < 1e-6, außer
  `0`) Ergebnisse in Exponentialschreibweise aus (z. B. `1e12`, `1.234e-7`)
  – die Schwelle ergibt sich direkt aus den 12 signifikanten Stellen: mehr
  als 12 Stellen vor dem Komma bzw. mehr als 6 führende Nullen nach dem
  Komma lassen sich damit nicht mehr sinnvoll darstellen,
- gibt `0` sowohl für `0` als auch für `-0` aus.

## Aufbau

```
src/engine/
  index.ts       – öffentliche API: evaluate(), formatResult(), Re-Export der Typen
  types.ts        – Token, AstNode, EngineContext, EngineError, EngineResult
  errors.ts       – interne Fehlerklassen (EngineSyntaxError, EngineEvaluationError)
  tokenizer.ts    – tokenize(): string -> Token[]
  parser.ts       – parse(): Token[] -> AstNode (rekursiver Abstiegsparser)
  evaluator.ts    – evaluateAst(): AstNode -> number
  format.ts       – formatResult(): number -> string (Rundung, Exponentialschreibweise)
```

Tokenizer und Parser werfen intern `EngineSyntaxError` (mit Zeichenposition),
der Evaluator wirft `EngineEvaluationError` (z. B. bei Division durch Null).
`evaluate()` fängt beide ab und übersetzt sie in das typisierte
`EngineResult` – das ist der einzige Ort, an dem diese Exceptions behandelt
werden. `tokenize`, `parse`, `evaluateAst` sowie die AST-/Token-Typen werden
zusätzlich aus `src/engine/index.ts` exportiert, damit künftige Engine-Items
(z. B. eine Formel-Auswertung mit Variablen) auf den Bausteinen aufbauen
können, ohne den Tokenizer/Parser neu zu implementieren.
