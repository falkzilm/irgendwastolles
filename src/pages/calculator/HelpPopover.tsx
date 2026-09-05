import { Modal } from '../../ui/Modal'
import './HelpPopover.css'

interface HelpPopoverProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: '0–9', description: 'Ziffer eingeben' },
  { keys: '+ − * /', description: 'Operator eingeben' },
  { keys: '( )', description: 'Klammer eingeben' },
  { keys: ', oder .', description: 'Dezimaltrennzeichen eingeben' },
  { keys: 'Enter', description: 'Ergebnis berechnen' },
  { keys: 'Escape', description: 'Eingabe löschen' },
  { keys: 'Backspace', description: 'Letztes Zeichen löschen' },
]

/**
 * Dokumentiert die Tastenkürzel der physischen Tastatur (IRGENDWAST-27) in
 * einem Hilfe-Popover.
 */
export function HelpPopover({ open, onClose }: HelpPopoverProps) {
  return (
    <Modal open={open} onClose={onClose} title="Tastenkürzel">
      <dl className="calculator-help__list">
        {SHORTCUTS.map((shortcut) => (
          <div className="calculator-help__row" key={shortcut.keys}>
            <dt className="calculator-help__keys">{shortcut.keys}</dt>
            <dd className="calculator-help__description">
              {shortcut.description}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
