import { Button } from '../../ui/Button'
import './Keypad.css'
import type { CalculatorMode } from '../../store/slices/settingsSlice'

interface KeypadProps {
  mode: CalculatorMode
  onInput: (token: string) => void
  onClear: () => void
  onBackspace: () => void
  onEquals: () => void
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
 * Wissenschaftliche Zusatztasten (IRGENDWAST-25): Funktionen fügen ihre
 * öffnende Klammer gleich mit ein (z. B. `sin(`), `pi`/`e` sind Konstanten
 * ohne Klammern, `x^y` fügt den Potenz-Operator `^` ein.
 */
const SCIENTIFIC_KEYS: KeyDef[] = [
  { kind: 'input', label: 'sin', value: 'sin(', ariaLabel: 'Sinus' },
  { kind: 'input', label: 'cos', value: 'cos(', ariaLabel: 'Kosinus' },
  { kind: 'input', label: 'tan', value: 'tan(', ariaLabel: 'Tangens' },
  {
    kind: 'input',
    label: 'log',
    value: 'log(',
    ariaLabel: 'Logarithmus zur Basis 10',
  },
  {
    kind: 'input',
    label: 'ln',
    value: 'ln(',
    ariaLabel: 'Natürlicher Logarithmus',
  },
  { kind: 'input', label: '√', value: 'sqrt(', ariaLabel: 'Quadratwurzel' },
  { kind: 'input', label: 'xʸ', value: '^', ariaLabel: 'Potenz' },
  { kind: 'input', label: 'π', value: 'pi', ariaLabel: 'Pi' },
  { kind: 'input', label: 'e', value: 'e', ariaLabel: 'Eulersche Zahl' },
  { kind: 'input', label: 'x!', value: 'fact(', ariaLabel: 'Fakultät' },
]

/**
 * Tastenfeld für die Grundrechenarten (IRGENDWAST-24) sowie, im
 * wissenschaftlichen Modus, ein zusätzliches Feld mit erweiterten Tasten
 * (IRGENDWAST-25). Beide Felder sind eigenständige CSS-Grids statt eines
 * umbrechenden Flex-Layouts, damit sich bei schmalem Fenster die Spalten
 * verkleinern statt in neue Zeilen umzubrechen.
 */
export function Keypad({
  mode,
  onInput,
  onClear,
  onBackspace,
  onEquals,
}: KeypadProps) {
  function renderKey(key: KeyDef) {
    if (key.kind === 'clear') {
      return (
        <Button
          key={key.label}
          variant="danger"
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
          aria-label={key.ariaLabel}
          onClick={onBackspace}
        >
          {key.label}
        </Button>
      )
    }
    if (key.kind === 'equals') {
      return (
        <Button key={key.label} variant="primary" onClick={onEquals}>
          {key.label}
        </Button>
      )
    }
    return (
      <Button
        key={key.label}
        variant="secondary"
        aria-label={key.ariaLabel}
        onClick={() => onInput(key.value)}
      >
        {key.label}
      </Button>
    )
  }

  return (
    <div className="calculator-keypad-wrapper">
      {mode === 'scientific' && (
        <div
          className="calculator-keypad calculator-keypad--scientific"
          role="group"
          aria-label="Wissenschaftliche Funktionen"
        >
          {SCIENTIFIC_KEYS.map(renderKey)}
        </div>
      )}
      <div className="calculator-keypad" role="group" aria-label="Tastenfeld">
        {KEYS.map(renderKey)}
      </div>
    </div>
  )
}
