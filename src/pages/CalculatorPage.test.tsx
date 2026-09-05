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
})
