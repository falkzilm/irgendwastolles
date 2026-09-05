import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import './DemoPage.css'
import { Modal } from './Modal'
import { useTheme } from './theme'
import { useToast } from './Toast'

export function DemoPage() {
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="ui-demo">
      <header className="ui-demo__header">
        <h2>UI-Bausteine</h2>
        <p>Basiskomponenten mit Design-Tokens und Light-/Dark-Theming.</p>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren'}
        </Button>
      </header>

      <section className="ui-demo__section">
        <h3>Buttons</h3>
        <div className="ui-demo__row">
          <Button variant="primary">Primär</Button>
          <Button variant="secondary">Sekundär</Button>
          <Button variant="danger">Gefahr</Button>
          <Button variant="primary" disabled>
            Deaktiviert
          </Button>
        </div>
      </section>

      <section className="ui-demo__section">
        <h3>Card</h3>
        <Card>
          <h4>Kartentitel</h4>
          <p>Beispieltext innerhalb einer Card-Komponente.</p>
        </Card>
      </section>

      <section className="ui-demo__section">
        <h3>Modal</h3>
        <Button onClick={() => setModalOpen(true)}>Modal öffnen</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Beispiel-Modal"
        >
          <p>Inhalt des Modals.</p>
        </Modal>
      </section>

      <section className="ui-demo__section">
        <h3>Toast</h3>
        <div className="ui-demo__row">
          <Button onClick={() => showToast('Vorgang erfolgreich.', 'success')}>
            Erfolgs-Toast anzeigen
          </Button>
          <Button
            variant="danger"
            onClick={() => showToast('Ein Fehler ist aufgetreten.', 'danger')}
          >
            Fehler-Toast anzeigen
          </Button>
        </div>
      </section>
    </section>
  )
}
