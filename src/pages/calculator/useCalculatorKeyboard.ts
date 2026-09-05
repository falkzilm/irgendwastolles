import { useEffect, useRef, useState } from 'react'
import { actionKeyId, mapKeyboardEvent } from './keyboard'

interface UseCalculatorKeyboardOptions {
  /** Solange `false` (z. B. während das Hilfe-Popover offen ist), wird nicht gelauscht. */
  enabled: boolean
  onInput: (token: string) => void
  onClear: () => void
  onBackspace: () => void
  onEvaluate: () => void
}

const HIGHLIGHT_DURATION_MS = 150

/**
 * Bedient den Rechner über die physische Tastatur (IRGENDWAST-27): Ziffern
 * und Operatoren landen im Display, Enter berechnet, Escape löscht,
 * Backspace entfernt ein Zeichen. Der Listener hängt am `document`, damit
 * die Eingabe unabhängig vom fokussierten Element funktioniert, solange die
 * Rechner-Seite aktiv ist. Gibt die Kennung der zuletzt gedrückten Taste
 * zurück, damit `Keypad` sie kurz optisch hervorheben kann.
 */
export function useCalculatorKeyboard({
  enabled,
  onInput,
  onClear,
  onBackspace,
  onEvaluate,
}: UseCalculatorKeyboardOptions): string | null {
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      const action = mapKeyboardEvent(event)
      if (!action) return

      event.preventDefault()

      if (action.type === 'input') onInput(action.value)
      else if (action.type === 'clear') onClear()
      else if (action.type === 'backspace') onBackspace()
      else onEvaluate()

      setActiveKeyId(actionKeyId(action))
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(
        () => setActiveKeyId(null),
        HIGHLIGHT_DURATION_MS,
      )
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeoutRef.current)
    }
  }, [enabled, onInput, onClear, onBackspace, onEvaluate])

  return activeKeyId
}
