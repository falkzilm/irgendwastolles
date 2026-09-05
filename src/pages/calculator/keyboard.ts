export type KeyboardAction =
  | { type: 'input'; value: string }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'evaluate' }

const DIGIT_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
const OPERATOR_KEYS = new Set(['+', '-', '*', '/'])
const BRACKET_KEYS = new Set(['(', ')'])

/**
 * Übersetzt ein natives `keydown`-Event in eine Rechner-Aktion (IRGENDWAST-27).
 * Kombinationen mit Ctrl/Alt/Meta werden ignoriert, damit Browser-/OS-Shortcuts
 * (z. B. Strg+R) nicht überschrieben werden.
 */
export function mapKeyboardEvent(event: KeyboardEvent): KeyboardAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null

  const { key } = event

  if (key === 'Enter') return { type: 'evaluate' }
  if (key === 'Escape') return { type: 'clear' }
  if (key === 'Backspace') return { type: 'backspace' }
  if (key === '.' || key === ',') return { type: 'input', value: '.' }
  if (DIGIT_KEYS.has(key) || OPERATOR_KEYS.has(key) || BRACKET_KEYS.has(key)) {
    return { type: 'input', value: key }
  }

  return null
}

/** Eindeutige Kennung einer Keypad-Taste, siehe `Keypad.tsx`. */
export function keyId(
  kind: 'input' | 'clear' | 'backspace' | 'equals',
  value?: string,
): string {
  return kind === 'input' ? `input:${value}` : kind
}

/** Kennung der Keypad-Taste, die eine Tastatur-Aktion optisch spiegelt. */
export function actionKeyId(action: KeyboardAction): string {
  if (action.type === 'input') return keyId('input', action.value)
  if (action.type === 'evaluate') return keyId('equals')
  return keyId(action.type)
}
