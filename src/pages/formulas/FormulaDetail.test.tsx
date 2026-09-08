import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FormulaDetail } from './FormulaDetail'
import { ToastProvider } from '../../ui/Toast'
import { useAppStore } from '../../store'
import type { Formula } from '../../formulas'

const initialState = useAppStore.getState()

const kreisflaeche: Formula = {
  id: 'kreisflaeche',
  title: 'Kreisfläche',
  category: 'geometrie',
  description: 'Fläche eines Kreises aus dem Radius',
  latex: 'A = \\pi r^2',
  expression: 'pi*r^2',
  variables: [{ name: 'r', unit: 'm', range: { min: 0 } }],
  source: 'Schulbuch Mathematik Sek I',
  example: { r: 3 },
}

const rechteckflaeche: Formula = {
  id: 'rechteckflaeche',
  title: 'Rechteckfläche',
  category: 'geometrie',
  description: 'Fläche eines Rechtecks aus den Seitenlängen',
  latex: 'A = a \\cdot b',
  expression: 'a*b',
  variables: [
    { name: 'a', unit: 'm', range: { min: 0 } },
    { name: 'b', unit: 'm', range: { min: 0 } },
  ],
  source: 'Schulbuch Mathematik Sek I',
  example: { a: 4, b: 5 },
}

const grossesProdukt: Formula = {
  id: 'grosses-produkt',
  title: 'Großes Produkt',
  category: 'algebra',
  description: 'Produkt zweier Zahlen',
  latex: 'p = a \\cdot b',
  expression: 'a*b',
  variables: [
    { name: 'a', unit: '' },
    { name: 'b', unit: '' },
  ],
  source: 'Schulbuch Mathematik Sek I',
}

function renderDetail(formula: Formula, onClose = vi.fn()) {
  render(
    <ToastProvider>
      <FormulaDetail formula={formula} onClose={onClose} />
    </ToastProvider>,
  )
  return onClose
}

describe('FormulaDetail', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt Titel, Erklärtext, Formeldarstellung und ein Eingabefeld je Variable', () => {
    renderDetail(rechteckflaeche)

    expect(
      screen.getByRole('heading', { name: 'Rechteckfläche' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Fläche eines Rechtecks aus den Seitenlängen'),
    ).toBeInTheDocument()
    expect(screen.getByText('A = a \\cdot b')).toBeInTheDocument()
    expect(screen.getByLabelText('a (m)')).toBeInTheDocument()
    expect(screen.getByLabelText('b (m)')).toBeInTheDocument()
  })

  it('zeigt nach Eingabe aller Werte das Ergebnis an', () => {
    renderDetail(rechteckflaeche)

    fireEvent.change(screen.getByLabelText('a (m)'), {
      target: { value: '4' },
    })
    expect(screen.queryByText(/Ergebnis:/)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('b (m)'), {
      target: { value: '5' },
    })

    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('zeigt bei ungültiger Eingabe eine feldbezogene Fehlermeldung und kein Ergebnis', () => {
    renderDetail(kreisflaeche)

    fireEvent.change(screen.getByLabelText('r (m)'), {
      target: { value: 'abc' },
    })

    expect(
      screen.getByText('Bitte eine gültige Zahl eingeben.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Ergebnis:/)).not.toBeInTheDocument()
  })

  it('zeigt bei einem Wert außerhalb des Wertebereichs eine feldbezogene Fehlermeldung', () => {
    renderDetail(kreisflaeche)

    fireEvent.change(screen.getByLabelText('r (m)'), {
      target: { value: '-1' },
    })

    expect(
      screen.getByText('Wert muss mindestens 0 liegen.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Ergebnis:/)).not.toBeInTheDocument()
  })

  it('setzt per Klick den Beispielwertsatz ein und berechnet das Ergebnis', () => {
    renderDetail(kreisflaeche)

    fireEvent.click(
      screen.getByRole('button', { name: 'Beispielwerte einsetzen' }),
    )

    expect(screen.getByLabelText('r (m)')).toHaveValue('3')
    expect(screen.getByText('28.2743338823')).toBeInTheDocument()
  })

  it('übernimmt das Ergebnis per Klick in den Rechner und schließt die Detailansicht', () => {
    const onClose = renderDetail(rechteckflaeche)

    fireEvent.change(screen.getByLabelText('a (m)'), {
      target: { value: '4' },
    })
    fireEvent.change(screen.getByLabelText('b (m)'), {
      target: { value: '5' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'In den Rechner übernehmen' }),
    )

    expect(useAppStore.getState().expression).toBe('20')
    expect(onClose).toHaveBeenCalled()
  })

  it('übernimmt ein Ergebnis in Exponentialschreibweise als vom Rechner auswertbaren Ausdruck', () => {
    renderDetail(grossesProdukt)

    fireEvent.change(screen.getByLabelText('a'), {
      target: { value: '1000000' },
    })
    fireEvent.change(screen.getByLabelText('b'), {
      target: { value: '10000000' },
    })
    expect(screen.getByText('1e13')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'In den Rechner übernehmen' }),
    )

    expect(useAppStore.getState().expression).toBe('1*10^13')
  })

  it('hat keine kritischen axe-Verstöße', async () => {
    const { container } = render(
      <ToastProvider>
        <FormulaDetail formula={rechteckflaeche} onClose={vi.fn()} />
      </ToastProvider>,
    )

    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
