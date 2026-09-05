import { useState } from 'react'
import './CalculatorPage.css'
import { Display } from './calculator/Display'
import { HelpPopover } from './calculator/HelpPopover'
import { Keypad } from './calculator/Keypad'
import { useCalculatorKeyboard } from './calculator/useCalculatorKeyboard'
import { Button } from '../ui/Button'
import { ModeToggle } from './calculator/ModeToggle'
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
  const calculatorMode = useAppStore((state) => state.calculatorMode)
  const toggleCalculatorMode = useAppStore(
    (state) => state.toggleCalculatorMode,
  )
  const angleMode = useAppStore((state) => state.angleMode)
  const setAngleMode = useAppStore((state) => state.setAngleMode)

  const [helpOpen, setHelpOpen] = useState(false)

  const activeKeyId = useCalculatorKeyboard({
    enabled: !helpOpen,
    onInput: input,
    onClear: clear,
    onBackspace: backspace,
    onEvaluate: evaluate,
  })

  return (
    <div className="page">
      <div className="calculator-page__header">
        <h1>Rechner</h1>
        <Button
          variant="secondary"
          aria-label="Tastenkürzel anzeigen"
          onClick={() => setHelpOpen(true)}
        >
          ?
        </Button>
      </div>
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
        activeKeyId={activeKeyId}
      />
      <HelpPopover open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Verlauf
        verlauf={verlauf}
        onSelect={loadExpression}
        onClear={clearVerlauf}
      />
    </div>
  )
}
