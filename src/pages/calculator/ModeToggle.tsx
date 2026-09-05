import { Button } from '../../ui/Button'
import './ModeToggle.css'
import type {
  AngleMode,
  CalculatorMode,
} from '../../store/slices/settingsSlice'

interface ModeToggleProps {
  mode: CalculatorMode
  angleMode: AngleMode
  onToggleMode: () => void
  onSetAngleMode: (mode: AngleMode) => void
}

/**
 * Umschalter zwischen einfachem und wissenschaftlichem Tastenfeld sowie, nur
 * im wissenschaftlichen Modus, ein DEG/RAD-Umschalter für den Winkelmodus
 * (IRGENDWAST-25) - der Winkelmodus wirkt sich nur auf die dort verfügbaren
 * trigonometrischen Funktionen aus.
 */
export function ModeToggle({
  mode,
  angleMode,
  onToggleMode,
  onSetAngleMode,
}: ModeToggleProps) {
  return (
    <div className="calculator-mode-toggle">
      <Button
        variant="secondary"
        aria-pressed={mode === 'scientific'}
        onClick={onToggleMode}
      >
        {mode === 'scientific' ? 'Wissenschaftlich' : 'Einfach'}
      </Button>
      {mode === 'scientific' && (
        <div
          className="calculator-mode-toggle__angle"
          role="group"
          aria-label="Winkeleinheit"
        >
          <Button
            variant="secondary"
            aria-pressed={angleMode === 'deg'}
            onClick={() => onSetAngleMode('deg')}
          >
            DEG
          </Button>
          <Button
            variant="secondary"
            aria-pressed={angleMode === 'rad'}
            onClick={() => onSetAngleMode('rad')}
          >
            RAD
          </Button>
        </div>
      )}
    </div>
  )
}
