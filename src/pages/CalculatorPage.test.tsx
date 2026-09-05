import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CalculatorPage } from './CalculatorPage'
import { useAppStore } from '../store'

const initialState = useAppStore.getState()

function pressKeys(...labels: string[]) {
  labels.forEach((label) => {
    fireEvent.click(screen.getByRole('button', { name: label }))
  })
}

describe('CalculatorPage', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt Ziffern und Operatoren im Display, "=" zeigt das Ergebnis', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '3')
    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('2+3')

    pressKeys('=')
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('5')
  })

  it('bedient Klammern und Komma als Dezimaltrennzeichen', () => {
    render(<CalculatorPage />)

    pressKeys('(', '1', 'Komma', '5', 'Plus', '2', ')', '=')

    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('3.5')
  })

  it('AC leert Ausdruck und Ergebnis', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '3', '=')
    pressKeys('Alles löschen')

    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('0')
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('')
  })

  it('Backspace entfernt genau ein Zeichen', () => {
    render(<CalculatorPage />)

    pressKeys('1', '2', '3', 'Letztes Zeichen löschen')

    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('12')
  })

  it('zeigt einen Engine-Fehler als lesbare Meldung, App bleibt bedienbar', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '=')

    expect(screen.getByRole('alert')).not.toHaveTextContent('')

    pressKeys('3', '=')
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('5')
  })

  it('startet nach "=" eine neue Eingabe ohne das Ergebnis zu verstümmeln', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '3', '=')
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('5')

    pressKeys('7')

    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('7')
  })

  it('zeigt einen Hinweistext, solange der Verlauf leer ist', () => {
    render(<CalculatorPage />)

    expect(
      screen.getByText(/noch keine berechnungen vorhanden/i),
    ).toBeInTheDocument()
  })

  it('zeigt eine abgeschlossene Berechnung mit Ausdruck und Ergebnis im Verlauf', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '3', '=')

    expect(
      screen.getByRole('button', { name: /2\+3.*= 5/ }),
    ).toBeInTheDocument()
  })

  it('übernimmt beim Klick auf einen Verlaufseintrag dessen Ausdruck ins Display', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '3', '=')
    pressKeys('9')
    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('9')

    fireEvent.click(screen.getByRole('button', { name: /2\+3.*= 5/ }))

    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('2+3')
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('')
  })

  it('löscht mit "Verlauf löschen" alle Einträge, danach erscheint wieder der Hinweistext', () => {
    render(<CalculatorPage />)

    pressKeys('2', 'Plus', '3', '=')
    pressKeys('Verlauf löschen')

    expect(
      screen.queryByRole('button', { name: /2\+3.*= 5/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/noch keine berechnungen vorhanden/i),
    ).toBeInTheDocument()
  })

  it('zeigt im einfachen Modus keine wissenschaftlichen Tasten oder DEG/RAD', () => {
    render(<CalculatorPage />)

    expect(
      screen.queryByRole('group', { name: 'Wissenschaftliche Funktionen' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Winkeleinheit' }),
    ).not.toBeInTheDocument()
  })

  it('schaltet auf wissenschaftlichen Modus um und zeigt die erweiterten Tasten sowie DEG/RAD', () => {
    render(<CalculatorPage />)

    pressKeys('Einfach')

    expect(
      screen.getByRole('group', { name: 'Wissenschaftliche Funktionen' }),
    ).toBeInTheDocument()
    ;[
      'Sinus',
      'Kosinus',
      'Tangens',
      'Logarithmus zur Basis 10',
      'Natürlicher Logarithmus',
      'Quadratwurzel',
      'Potenz',
      'Pi',
      'Eulersche Zahl',
      'Fakultät',
    ].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })
    expect(
      screen.getByRole('group', { name: 'Winkeleinheit' }),
    ).toBeInTheDocument()
  })

  it('DEG/RAD beeinflusst das Ergebnis von sin() im wissenschaftlichen Modus', () => {
    render(<CalculatorPage />)

    pressKeys('Einfach', 'DEG', 'Sinus')
    pressKeys('9', '0', ')', '=')
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('1')

    pressKeys('Alles löschen', 'RAD', 'Sinus')
    pressKeys('9', '0', ')', '=')
    expect(screen.getByLabelText('Ergebnis').textContent).not.toBe('1')
  })
})
