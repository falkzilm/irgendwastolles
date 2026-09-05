import { Button } from '../../ui/Button'
import { keyId } from './keyboard'
import './Keypad.css'

interface KeypadProps {
  onInput: (token: string) => void
  onClear: () => void
  onBackspace: () => void
  onEquals: () => void
  /** Kennung der aktuell hervorzuhebenden Taste, siehe `useCalculatorKeyboard`. */
  activeKeyId?: string | null
}

type KeyDef =
  | { kind: 'input'; label: string; value: string; ariaLabel?: string }
  | { kind: 'clear'; label: string; ariaLabel: string }
  | { kind: 'backspace'; label: string; ariaLabel: string }
  | { kind: 'equals'; label: string }

const KEYS: KeyDef[] = [
  { kind: 'clear', label: 'AC', ariaLabel: 'Alles löschen' },
  { kind: 'input', label: '(', value: '(' },
  { kind: 'input', label: ')', value: ')' },
  { kind: 'backspace', label: '⌫', ariaLabel: 'Letztes Zeichen löschen' },
  { kind: 'input', label: '7', value: '7' },
  { kind: 'input', label: '8', value: '8' },
  { kind: 'input', label: '9', value: '9' },
  { kind: 'input', label: '÷', value: '/', ariaLabel: 'Geteilt durch' },
  { kind: 'input', label: '4', value: '4' },
  { kind: 'input', label: '5', value: '5' },
  { kind: 'input', label: '6', value: '6' },
  { kind: 'input', label: '×', value: '*', ariaLabel: 'Mal' },
  { kind: 'input', label: '1', value: '1' },
  { kind: 'input', label: '2', value: '2' },
  { kind: 'input', label: '3', value: '3' },
  { kind: 'input', label: '−', value: '-', ariaLabel: 'Minus' },
  { kind: 'input', label: '0', value: '0' },
  { kind: 'input', label: ',', value: '.', ariaLabel: 'Komma' },
  { kind: 'equals', label: '=' },
  { kind: 'input', label: '+', value: '+', ariaLabel: 'Plus' },
]

/**
 * Tastenfeld für die Grundrechenarten (IRGENDWAST-24): Ziffern, Komma,
 * Operatoren, Klammern, AC, Backspace und =. Weitere Engine-Items (z. B.
 * wissenschaftliche Funktionen) bauen auf diesem Layout auf.
 *
 * `activeKeyId` (IRGENDWAST-27) hebt die Taste hervor, die gerade über die
 * physische Tastatur ausgelöst wurde, siehe `useCalculatorKeyboard`.
 */
export function Keypad({
  onInput,
  onClear,
  onBackspace,
  onEquals,
  activeKeyId = null,
}: KeypadProps) {
  return (
    <div className="calculator-keypad" role="group" aria-label="Tastenfeld">
      {KEYS.map((key) => {
        const id = keyId(key.kind, key.kind === 'input' ? key.value : undefined)
        const className =
          id === activeKeyId ? 'calculator-keypad__button--active' : undefined

        if (key.kind === 'clear') {
          return (
            <Button
              key={key.label}
              variant="danger"
              className={className}
              aria-label={key.ariaLabel}
              onClick={onClear}
            >
              {key.label}
            </Button>
          )
        }
        if (key.kind === 'backspace') {
          return (
            <Button
              key={key.label}
              variant="secondary"
              className={className}
              aria-label={key.ariaLabel}
              onClick={onBackspace}
            >
              {key.label}
            </Button>
          )
        }
        if (key.kind === 'equals') {
          return (
            <Button
              key={key.label}
              variant="primary"
              className={className}
              onClick={onEquals}
            >
              {key.label}
            </Button>
          )
        }
        return (
          <Button
            key={key.label}
            variant="secondary"
            className={className}
            aria-label={key.ariaLabel}
            onClick={() => onInput(key.value)}
          >
            {key.label}
          </Button>
        )
      })}
    </div>
  )
}
