import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  afterEach(() => {
    vi.useRealTimers()
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

  it('Ziffern und Operatoren der physischen Tastatur landen im Display', () => {
    render(<CalculatorPage />)

    fireEvent.keyDown(document, { key: '2' })
    fireEvent.keyDown(document, { key: '+' })
    fireEvent.keyDown(document, { key: '3' })

    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('2+3')
  })

  it('Enter berechnet, Escape löscht, Backspace entfernt ein Zeichen', () => {
    render(<CalculatorPage />)

    fireEvent.keyDown(document, { key: '2' })
    fireEvent.keyDown(document, { key: '+' })
    fireEvent.keyDown(document, { key: '3' })
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(screen.getByLabelText('Ergebnis')).toHaveTextContent('5')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('0')

    fireEvent.keyDown(document, { key: '1' })
    fireEvent.keyDown(document, { key: '2' })
    fireEvent.keyDown(document, { key: 'Backspace' })
    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('1')
  })

  it('hebt die gedrückte Taste kurz als aktive Taste in der UI hervor', () => {
    vi.useFakeTimers()
    render(<CalculatorPage />)

    fireEvent.keyDown(document, { key: '7' })
    expect(screen.getByRole('button', { name: '7' })).toHaveClass(
      'calculator-keypad__button--active',
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.getByRole('button', { name: '7' })).not.toHaveClass(
      'calculator-keypad__button--active',
    )
  })

  it('Tastatureingabe funktioniert unabhängig vom fokussierten Element', () => {
    render(<CalculatorPage />)

    screen.getByRole('button', { name: 'Tastenkürzel anzeigen' }).focus()
    fireEvent.keyDown(document, { key: '9' })

    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('9')
  })

  it('deaktiviert die Tastatureingabe, während das Hilfe-Popover offen ist', () => {
    render(<CalculatorPage />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Tastenkürzel anzeigen' }),
    )
    fireEvent.keyDown(document, { key: '5' })
    expect(screen.getByLabelText('Ausdruck')).toHaveTextContent('0')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('dokumentiert die Tastenkürzel im Hilfe-Popover', () => {
    render(<CalculatorPage />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Tastenkürzel anzeigen' }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Tastenkürzel' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ergebnis berechnen')).toBeInTheDocument()
    expect(screen.getByText('Eingabe löschen')).toBeInTheDocument()
    expect(screen.getByText('Letztes Zeichen löschen')).toBeInTheDocument()
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
