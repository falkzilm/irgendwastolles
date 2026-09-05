# Rechen-Engine

Dieses Dokument beschreibt die öffentliche API des Rechen-Moduls unter
`src/engine/`. Es setzt die Anforderungen aus IRGENDWAST-20 und IRGENDWAST-21
um.

## Öffentliche API

```ts
import { evaluate } from '../engine'

const result = evaluate('2+3*4')
// result: { ok: true, value: 14 }
```

`evaluate(expression, context?)` ist der einzige Einstiegspunkt, auf dem
weitere Engine-Items (z. B. Variablen, Winkelmodus, Funktionen) aufbauen:

- `expression: string` – der auszuwertende Ausdruck.
- `context?: EngineContext`:
  - `angleMode?: 'deg' | 'rad'` – Winkelmodus für `sin`/`cos`/`tan`/`asin`/
    `acos`/`atan`. Wird pro Aufruf übergeben statt global gesetzt (fehlt er,
    wird `'rad'` angenommen).
  - `variables?: Record<string, number>` – weiterhin ein Platzhalter ohne
    Einfluss auf das Ergebnis, Teil der Signatur, damit künftige Engine-Items
    (z. B. Variablen aus der Formelbibliothek) die öffentliche API nicht mehr
    ändern müssen.
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
- Wissenschaftliche Ein-Argument-Funktionen: `sin` `cos` `tan` `asin` `acos`
  `atan` `log` (Logarithmus zur Basis 10) `ln` (natürlicher Logarithmus)
  `exp` `sqrt` `abs` `fact` (Fakultät, nur für nicht-negative ganze Zahlen),
  z. B. `sin(90)`, `sqrt(16)`
- Konstanten `pi` und `e` als bloße Bezeichner (ohne Klammern), z. B. `sin(pi/2)`

**Präzedenz** (niedrig zu hoch): `+`/`-` < `*`/`/`/`%` < unäres Vorzeichen
< `^`. `^` ist rechtsassoziativ, unäres Vorzeichen bindet schwächer als
`^` (`-2^2` ergibt `-4`, analog zu Python), im Exponenten ist wiederum ein
Vorzeichen erlaubt (`2^-2`). Funktionsaufrufe und Konstanten binden wie
Zahlen/Klammerausdrücke (primäre Ausdrücke).

`/` und `%` durch `0` liefern einen `evaluation-error` (`Division durch
Null`) statt `Infinity`/`NaN`. Ein unbekannter Funktionsname (z. B. `foo(1)`)
oder eine unbekannte Konstante liefert einen `syntax-error` mit der Position
des Bezeichners im Ausdruck.

## Aufbau

```
src/engine/
  index.ts       – öffentliche API: evaluate(), Re-Export der Typen
  types.ts        – Token, AstNode, EngineContext, EngineError, EngineResult
  errors.ts       – interne Fehlerklassen (EngineSyntaxError, EngineEvaluationError)
  tokenizer.ts    – tokenize(): string -> Token[]
  parser.ts       – parse(): Token[] -> AstNode (rekursiver Abstiegsparser)
  evaluator.ts    – evaluateAst(): AstNode -> number
  functions.ts    – CONSTANTS (pi/e) und FUNCTIONS (sin/cos/.../fact), inkl. Winkelmodus-Konvertierung
```

Tokenizer und Parser werfen intern `EngineSyntaxError` (mit Zeichenposition,
auch bei unbekannten Funktionsnamen/Konstanten), der Evaluator wirft
`EngineEvaluationError` (z. B. bei Division durch Null oder `fact()` mit
ungültigem Argument). `evaluate()` fängt beide ab und übersetzt sie in das
typisierte `EngineResult` – das ist der einzige Ort, an dem diese Exceptions
behandelt werden. `tokenize`, `parse`, `evaluateAst` sowie die AST-/Token-Typen
werden zusätzlich aus `src/engine/index.ts` exportiert, damit künftige
Engine-Items (z. B. eine Formel-Auswertung mit Variablen) auf den Bausteinen
aufbauen können, ohne den Tokenizer/Parser neu zu implementieren.
