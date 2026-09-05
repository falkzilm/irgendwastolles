import { useState } from 'react'
import './CalculatorPage.css'
import { Display } from './calculator/Display'
import { HelpPopover } from './calculator/HelpPopover'
import { Keypad } from './calculator/Keypad'
import { useCalculatorKeyboard } from './calculator/useCalculatorKeyboard'
import { Button } from '../ui/Button'
import { useAppStore } from '../store'

export function CalculatorPage() {
  const expression = useAppStore((state) => state.expression)
  const result = useAppStore((state) => state.result)
  const error = useAppStore((state) => state.error)
  const input = useAppStore((state) => state.input)
  const clear = useAppStore((state) => state.clear)
  const backspace = useAppStore((state) => state.backspace)
  const evaluate = useAppStore((state) => state.evaluate)

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
      <Display expression={expression} result={result} error={error} />
      <Keypad
        onInput={input}
        onClear={clear}
        onBackspace={backspace}
        onEquals={evaluate}
        activeKeyId={activeKeyId}
      />
      <HelpPopover open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
