import { Display } from './calculator/Display'
import { Keypad } from './calculator/Keypad'
import { useAppStore } from '../store'

export function CalculatorPage() {
  const expression = useAppStore((state) => state.expression)
  const result = useAppStore((state) => state.result)
  const error = useAppStore((state) => state.error)
  const input = useAppStore((state) => state.input)
  const clear = useAppStore((state) => state.clear)
  const backspace = useAppStore((state) => state.backspace)
  const evaluate = useAppStore((state) => state.evaluate)

  return (
    <div className="page">
      <h1>Rechner</h1>
      <Display expression={expression} result={result} error={error} />
      <Keypad
        onInput={input}
        onClear={clear}
        onBackspace={backspace}
        onEquals={evaluate}
      />
    </div>
  )
}
