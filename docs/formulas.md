# Formel-Katalog

Dieses Dokument beschreibt das Formel-Schema und den Katalog-Loader unter
`src/formulas/`. Es setzt die Anforderungen aus IRGENDWAST-30 um und ist die
gemeinsame Grundlage aller weiteren Items des Formelbibliothek-Features.

## Schema

```ts
import type { Formula, FormulaCategory, FormulaVariable } from '../formulas'

interface Formula {
  id: string
  title: string
  category: FormulaCategory
  description: string
  latex: string // LaTeX-Darstellung, z. B. "A = \\pi r^2"
  expression: string // Ausdruck in der Syntax der Rechen-Engine, siehe docs/engine.md
  variables: FormulaVariable[]
  examples: FormulaExample[] // mindestens ein Rechenbeispiel mit erwartetem Ergebnis
  source: string // Quelle/Herkunft der Formel
  example?: Record<string, number> // Beispielwerte je Variablenname, für die Detailansicht (IRGENDWAST-34)
}

interface FormulaVariable {
  name: string // Bezeichner im expression, z. B. "r"
  unit: string // Einheit, z. B. "m"; Leerstring für einheitenlose Größen
  range?: { min?: number; max?: number } // optional, beide Grenzen inklusiv
}

interface FormulaExample {
  values: Record<string, number> // Wert je Variable aus `variables`, indiziert nach Name
  expected: number // erwartetes Ergebnis von `expression` bei dieser Belegung
}
```

`FormulaCategory` ist eine feste Aufzählung, exportiert als `FORMULA_CATEGORIES`:

```ts
const FORMULA_CATEGORIES = [
  'algebra',
  'geometrie',
  'trigonometrie',
  'analysis',
  'physik',
  'stochastik',
  'sonstiges',
] as const
```

**Offene Frage:** Zielgruppe/Niveau (Sek I, Sek II, Studium?) ist noch nicht
geklärt. Ein Schwierigkeitsgrad-Feld ist daher bewusst **nicht** Teil des
Schemas, bis diese Frage entschieden ist - ein nachträglich ergänztes
optionales Feld ändert die bestehende API nicht.

## Beispielformel

```json
{
  "id": "kreisflaeche",
  "title": "Kreisfläche",
  "category": "geometrie",
  "description": "Fläche eines Kreises aus dem Radius",
  "latex": "A = \\pi r^2",
  "expression": "pi*r^2",
  "variables": [{ "name": "r", "unit": "m", "range": { "min": 0 } }],
  "examples": [{ "values": { "r": 2 }, "expected": 12.566370614359172 }],
  "source": "Schulbuch Mathematik Sek I"
}
```

## Loader

```ts
import { loadCatalog } from '../formulas'

const result = loadCatalog(rawData)
// result: { ok: true, formulas: Formula[] } | { ok: false, errors: CatalogError[] }
```

`loadCatalog(data: unknown): CatalogLoadResult` validiert rohe (z. B. per
JSON eingelesene) Katalogdaten, ohne eine Exception zu werfen:

- `data` muss ein Array sein, sonst liefert der Loader einen einzelnen Fehler.
- Jede Formel muss alle Pflichtfelder aus dem Schema mit dem korrekten Typ
  enthalten (nicht-leere Strings für `id`/`title`/`description`/`latex`/
  `expression`/`source`, `category` aus `FORMULA_CATEGORIES`, `variables` als
  Array gültiger Variablen mit nicht-leerem `name`, String-`unit` und
  optionalem `range` mit `min <= max`).
- `examples` muss ein nicht-leeres Array sein. Jedes Beispiel braucht ein
  `values`-Objekt mit genau einem Zahlenwert pro Variable aus `variables`
  (weder fehlend noch überzählig) sowie ein numerisches `expected`-Feld.
- Das optionale Feld `example` darf nur Variablennamen aus `variables` als
  Schlüssel und Zahlen als Werte enthalten, sonst meldet der Loader einen
  Fehler.
- Fehlende oder ungültige Felder werden als `CatalogError` gesammelt:
  ```ts
  interface CatalogError {
    id: string // Formel-id, oder "#<index>", falls die id selbst fehlt/ungültig ist
    message: string
  }
  ```
  Der Loader bricht nicht beim ersten Fehler ab, sondern sammelt alle Fehler
  über den gesamten Katalog, damit ein Katalogeintrag in einem Durchlauf
  korrigiert werden kann.
- **Doppelte Formel-ids** werden als eigener Fehler pro betroffenem Eintrag
  gemeldet (`Doppelte Formel-id "<id>"`), zusätzlich zu etwaigen
  Feldfehlern desselben Eintrags.
- Gibt es mindestens einen Fehler, liefert `loadCatalog()` `{ ok: false,
errors }` und **keine** teilweise befüllte `formulas`-Liste - erst ein
  vollständig valider Katalog liefert `{ ok: true, formulas }`.

## Startkatalog

`src/formulas/catalog.json` enthält den kuratierten Startkatalog (IRGENDWAST-31):
mindestens 30 Formeln in den Kategorien `algebra`, `geometrie`,
`trigonometrie`, `analysis`, `physik` und `stochastik`, mit deutschen
Erklärtexten und je mindestens einem Rechenbeispiel. `src/formulas/catalog.ts`
lädt diese Daten beim Modulstart über `loadCatalog()` und exportiert das
Ergebnis als `FORMULA_CATALOG: Formula[]` – bei ungültigen Katalogdaten wirft
das Modul beim Import eine Exception, damit ein fehlerhafter Katalog nicht
unbemerkt in die Anwendung gelangt.

`src/formulas/catalog.test.ts` validiert `catalog.json` mit `loadCatalog()`
und wertet für jede Formel jedes Beispiel über die Rechen-Engine
(`evaluate()`, siehe `docs/engine.md`) aus: die Variablennamen aus `values`
werden im `expression` ersetzt, das Ergebnis wird gegen `expected` geprüft.

## Rendering (`FormulaLatex`)

`FormulaLatex` (`src/formulas/FormulaLatex.tsx`) rendert das `latex`-Feld
einer Formel per [KaTeX](https://katex.org/):

```tsx
import { FormulaLatex } from '../formulas'

;<FormulaLatex latex="A = \pi r^2" />
```

- **Gültiges LaTeX** wird per `katex.renderToString` (`throwOnError: true`,
  `trust: false`) zu HTML/MathML gerendert.
- **Ungültiges LaTeX** (z. B. unvollständige Befehle) lässt `katex.renderToString`
  werfen; die Komponente fängt jeden Fehler ab und zeigt stattdessen den
  rohen LaTeX-Quelltext als Klartext (Klasse `formula-latex--fallback`) an,
  statt abzustürzen.
- **Offline/CSP:** KaTeX wird als npm-Paket (`katex`) importiert, nicht per
  CDN eingebunden. `katex/dist/katex.min.css` referenziert die benötigten
  Schriftarten relativ; Vite bündelt sie beim Build als lokale, gehashte
  Assets unter `dist/assets/`. Formeln rendern damit ohne Internetverbindung,
  und die in [`docs/security.md`](security.md) beschriebene CSP
  (`script-src 'self'`, `font-src 'self'`) muss dafür nicht gelockert werden.

## Aufbau

```
src/formulas/
  index.ts         – öffentliche API: loadCatalog(), FORMULA_CATALOG, FormulaLatex, Re-Export der Typen
  types.ts         – Formula, FormulaCategory, FormulaVariable, FormulaVariableRange, FormulaExample
  loader.ts        – loadCatalog(), CatalogError, CatalogLoadResult
  catalog.json     – kuratierter Startkatalog (Rohdaten)
  catalog.ts       – lädt catalog.json über loadCatalog() und exportiert FORMULA_CATALOG
  search.ts        – matchesQuery(), filterFormulas() für den Formelbrowser
  FormulaLatex.tsx – KaTeX-Rendering mit Klartext-Fallback
```

## Formelbrowser (IRGENDWAST-33)

`src/pages/FormulasPage.tsx` zeigt `FORMULA_CATALOG`, nach
`FORMULA_CATEGORIES` gruppiert:

- Die Textsuche (`matchesQuery()`/`filterFormulas()` aus `search.ts`)
  filtert nach Titel und Beschreibung (Groß-/Kleinschreibung wird
  ignoriert) und läuft synchron ohne Debounce, da ein reiner
  Array-`filter()` über den Katalog auch bei 30 Einträgen deutlich unter
  200 ms bleibt (siehe `search.test.ts`).
- Ein Stern-Button pro Formel markiert sie als Favorit bzw. entfernt sie
  wieder (`favoritenSlice`, siehe [state.md](./state.md)); "Nur Favoriten"
  filtert die Ansicht zusätzlich auf markierte Formeln.
- Ergibt die Suche bzw. der Favoriten-Filter keine Treffer, erscheint statt
  leerer Kategorien ein erklärender Hinweistext.
- Ein "Details anzeigen"-Button pro Formel öffnet die Detailansicht (siehe
  unten).

## Formel-Detailansicht (IRGENDWAST-34)

`src/pages/formulas/FormulaDetail.tsx` zeigt eine einzelne Formel in einem
`Modal` (`src/ui/Modal.tsx`): Titel, Beschreibung, LaTeX-Darstellung und ein
Eingabefeld je Eintrag aus `formula.variables`.

- Eingaben werden pro Feld validiert (`validateField()`): eine leere Eingabe
  erzeugt noch keinen Fehler, eine nicht-numerische Eingabe oder ein Wert
  außerhalb von `variable.range` zeigt eine feldbezogene Fehlermeldung.
  Dezimalzahlen akzeptieren sowohl `,` als auch `.` als Trennzeichen.
- Erst wenn alle Variablen ausgefüllt und gültig sind, wertet
  `evaluateFormula()` (siehe oben) die Formel aus und das Ergebnis wird
  angezeigt.
- "Beispielwerte einsetzen" übernimmt `formula.example` in die Eingabefelder,
  sofern die Formel einen Beispielwertsatz definiert.
- "In den Rechner übernehmen" ruft `loadExpression()` aus dem
  `calculatorSlice` (siehe [state.md](./state.md)) mit dem formatierten
  Ergebnis auf und schließt die Detailansicht. `formatResult()` gibt sehr
  große/kleine Ergebnisse in Exponentialschreibweise aus (z. B. `1e12`), die
  der Rechner-Tokenizer nicht versteht; `toCalculatorExpression()`
  (`src/engine/format.ts`) übersetzt das `e<exponent>`-Suffix daher in
  `*10^<exponent>`, bevor der Ausdruck an `loadExpression()` geht. Derselbe
  Klick zählt außerdem per `recordFormelNutzung(formula.id)`
  (`formelNutzungSlice`) als Formel-Nutzung - Grundlage der meistgenutzten
  Formeln im Statistik-Dashboard (IRGENDWAST-49, siehe
  [statistik.md](./statistik.md)).
