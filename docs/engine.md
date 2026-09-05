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

## Aufbau

```
src/engine/
  index.ts       – öffentliche API: evaluate(), Re-Export der Typen
  types.ts        – Token, AstNode, EngineContext, EngineError, EngineResult
  errors.ts       – interne Fehlerklassen (EngineSyntaxError, EngineEvaluationError)
  tokenizer.ts    – tokenize(): string -> Token[]
  parser.ts       – parse(): Token[] -> AstNode (rekursiver Abstiegsparser)
  evaluator.ts    – evaluateAst(): AstNode -> number
```

Tokenizer und Parser werfen intern `EngineSyntaxError` (mit Zeichenposition),
der Evaluator wirft `EngineEvaluationError` (z. B. bei Division durch Null).
`evaluate()` fängt beide ab und übersetzt sie in das typisierte
`EngineResult` – das ist der einzige Ort, an dem diese Exceptions behandelt
werden. `tokenize`, `parse`, `evaluateAst` sowie die AST-/Token-Typen werden
zusätzlich aus `src/engine/index.ts` exportiert, damit künftige Engine-Items
(z. B. eine Formel-Auswertung mit Variablen) auf den Bausteinen aufbauen
können, ohne den Tokenizer/Parser neu zu implementieren.
