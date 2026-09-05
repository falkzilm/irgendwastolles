import { useState } from 'react'
import './AppShell.css'
import { CalculatorPage } from '../pages/CalculatorPage'
import { FormulasPage } from '../pages/FormulasPage'
import { ProgressPage } from '../pages/ProgressPage'

type NavKey = 'calculator' | 'formulas' | 'progress'

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'calculator', label: 'Rechner' },
  { key: 'formulas', label: 'Formeln' },
  { key: 'progress', label: 'Fortschritt' },
]

export function AppShell() {
  const [activeView, setActiveView] = useState<NavKey>('calculator')

  return (
    <div className="app-shell">
      <nav className="app-shell__nav" aria-label="Hauptnavigation">
        <ul className="app-shell__nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`app-shell__nav-item${
                  activeView === item.key ? ' app-shell__nav-item--active' : ''
                }`}
                aria-current={activeView === item.key ? 'page' : undefined}
                onClick={() => setActiveView(item.key)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="app-shell__content">
        {activeView === 'calculator' && <CalculatorPage />}
        {activeView === 'formulas' && <FormulasPage />}
        {activeView === 'progress' && <ProgressPage />}
      </main>
    </div>
  )
}
