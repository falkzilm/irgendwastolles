import { Display } from './calculator/Display'
import { Keypad } from './calculator/Keypad'
import { ModeToggle } from './calculator/ModeToggle'
import { useAppStore } from '../store'

export function CalculatorPage() {
  const expression = useAppStore((state) => state.expression)
  const result = useAppStore((state) => state.result)
  const error = useAppStore((state) => state.error)
  const input = useAppStore((state) => state.input)
  const clear = useAppStore((state) => state.clear)
  const backspace = useAppStore((state) => state.backspace)
  const evaluate = useAppStore((state) => state.evaluate)
  const calculatorMode = useAppStore((state) => state.calculatorMode)
  const toggleCalculatorMode = useAppStore(
    (state) => state.toggleCalculatorMode,
  )
  const angleMode = useAppStore((state) => state.angleMode)
  const setAngleMode = useAppStore((state) => state.setAngleMode)

  return (
    <div className="page">
      <h1>Rechner</h1>
      <ModeToggle
        mode={calculatorMode}
        angleMode={angleMode}
        onToggleMode={toggleCalculatorMode}
        onSetAngleMode={setAngleMode}
      />
      <Display expression={expression} result={result} error={error} />
      <Keypad
        mode={calculatorMode}
        onInput={input}
        onClear={clear}
        onBackspace={backspace}
        onEquals={evaluate}
      />
    </div>
  )
}
