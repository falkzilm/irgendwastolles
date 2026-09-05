export type TokenType =
  'number' | 'operator' | 'lparen' | 'rparen' | 'identifier'

export interface Token {
  type: TokenType
  value: string
  /** Zeichenposition im Ausdruck, für Fehlermeldungen. */
  position: number
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '^'
export type UnaryOperator = '+' | '-'

export type AstNode =
  | { type: 'number'; value: number }
  | { type: 'identifier'; name: string; position: number }
  | { type: 'call'; name: string; args: AstNode[]; position: number }
  | { type: 'unary'; operator: UnaryOperator; operand: AstNode }
  | { type: 'binary'; operator: BinaryOperator; left: AstNode; right: AstNode }

/** Winkelmodus für trigonometrische Funktionen (sin/cos/tan/asin/acos/atan). */
export type AngleMode = 'deg' | 'rad'

/**
 * Kontext für die Auswertung eines Ausdrucks.
 *
 * `angleMode` bestimmt, ob trigonometrische Funktionen Winkel in Grad oder
 * Radiant interpretieren bzw. zurückgeben - er wird pro Aufruf übergeben statt
 * global gesetzt, damit `evaluate()` unabhängig von einem UI-/App-State bleibt.
 * Fehlt er, wird Radiant (`'rad'`) angenommen.
 *
 * `variables` ist weiterhin ein Platzhalter ohne Einfluss auf das Ergebnis,
 * damit künftige Engine-Items (z. B. Variablen aus der Formelbibliothek) die
 * öffentliche Signatur von `evaluate()` nicht mehr ändern müssen.
 */
export interface EngineContext {
  variables?: Record<string, number>
  angleMode?: AngleMode
}

export type EngineErrorType = 'syntax-error' | 'evaluation-error'

export interface EngineError {
  type: EngineErrorType
  message: string
  /** Zeichenposition im Ausdruck, sofern bekannt (nur bei `syntax-error`). */
  position?: number
}

export type EngineResult =
  { ok: true; value: number } | { ok: false; error: EngineError }
