import { Display } from './calculator/Display'
import { Keypad } from './calculator/Keypad'
import { Verlauf } from './calculator/Verlauf'
import { useAppStore } from '../store'

export function CalculatorPage() {
  const expression = useAppStore((state) => state.expression)
  const result = useAppStore((state) => state.result)
  const error = useAppStore((state) => state.error)
  const input = useAppStore((state) => state.input)
  const clear = useAppStore((state) => state.clear)
  const backspace = useAppStore((state) => state.backspace)
  const evaluate = useAppStore((state) => state.evaluate)
  const loadExpression = useAppStore((state) => state.loadExpression)
  const verlauf = useAppStore((state) => state.verlauf)
  const clearVerlauf = useAppStore((state) => state.clearVerlauf)

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
      <Verlauf
        verlauf={verlauf}
        onSelect={loadExpression}
        onClear={clearVerlauf}
      />
    </div>
  )
}
