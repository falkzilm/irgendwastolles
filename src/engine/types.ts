export type TokenType = 'number' | 'operator' | 'lparen' | 'rparen'

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
  | { type: 'unary'; operator: UnaryOperator; operand: AstNode }
  | { type: 'binary'; operator: BinaryOperator; left: AstNode; right: AstNode }

/**
 * Kontext für die Auswertung eines Ausdrucks. Aktuell ohne Einfluss auf das
 * Ergebnis - der Platzhalter existiert, damit künftige Engine-Items
 * (Variablen, Winkelmodus für trigonometrische Funktionen, ...) die
 * öffentliche Signatur von `evaluate()` nicht mehr ändern müssen.
 */
export interface EngineContext {
  variables?: Record<string, number>
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
