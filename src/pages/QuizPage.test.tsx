import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it } from 'vitest'
import { QuizPage } from './QuizPage'
import { useAppStore } from '../store'

const initialState = useAppStore.getState()

function starteRunde(anzahl: number) {
  fireEvent.click(screen.getByRole('button', { name: String(anzahl) }))
  fireEvent.click(screen.getByRole('button', { name: 'Runde starten' }))
}

/** Beantwortet die aktuell angezeigte Aufgabe absichtlich falsch. */
function beantworteFalsch() {
  fireEvent.change(screen.getByLabelText('Antwort'), {
    target: { value: '-999999' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }))
}

describe('QuizPage', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt die Auswahl für Schwierigkeitsstufe und Aufgabenanzahl', () => {
    render(<QuizPage />)

    expect(screen.getByRole('button', { name: 'Leicht' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'Runde starten' }),
    ).toBeInTheDocument()
  })

  it('startet eine Runde mit der gewählten Aufgabenanzahl', () => {
    render(<QuizPage />)
    starteRunde(5)

    expect(screen.getByText('Aufgabe 1 von 5')).toBeInTheDocument()
  })

  it('zeigt nach einer falschen Antwort Feedback inklusive korrekter Lösung', () => {
    render(<QuizPage />)
    starteRunde(5)

    beantworteFalsch()

    expect(screen.getByText(/leider falsch/i)).toBeInTheDocument()
    expect(screen.getByText(/richtige lösung:/i)).toBeInTheDocument()
  })

  it('deaktiviert die Eingabe erst nach dem Prüfen und zeigt danach "Weiter"', () => {
    render(<QuizPage />)
    starteRunde(5)

    expect(
      screen.queryByRole('button', { name: 'Weiter' }),
    ).not.toBeInTheDocument()

    beantworteFalsch()

    expect(screen.getByLabelText('Antwort')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument()
  })

  it('zeigt am Ende der Runde eine Übersicht mit Anzahl richtiger Antworten und Dauer', () => {
    render(<QuizPage />)
    starteRunde(5)

    for (let i = 0; i < 4; i++) {
      beantworteFalsch()
      fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    }
    beantworteFalsch()
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis anzeigen' }))

    expect(
      screen.getByRole('heading', { name: 'Runde abgeschlossen' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 von 5 Aufgaben richtig')).toBeInTheDocument()
    expect(screen.getByText(/benötigte zeit:/i)).toBeInTheDocument()
  })

  it('persistiert das Rundenergebnis und meldet es der Gamification-Auswertung', () => {
    render(<QuizPage />)
    starteRunde(5)

    for (let i = 0; i < 4; i++) {
      beantworteFalsch()
      fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    }
    beantworteFalsch()
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis anzeigen' }))

    const { quizErgebnisse, gamification } = useAppStore.getState()
    expect(quizErgebnisse).toHaveLength(1)
    expect(quizErgebnisse[0]).toMatchObject({
      difficulty: 'leicht',
      anzahlAufgaben: 5,
      anzahlRichtig: 0,
    })
    expect(gamification.anzahlQuizRunden).toBe(1)
  })

  it('bricht eine Runde ab, ohne ein Ergebnis zu persistieren, und kehrt zur Auswahl zurück', () => {
    render(<QuizPage />)
    starteRunde(5)
    beantworteFalsch()

    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))

    expect(
      screen.getByRole('button', { name: 'Runde starten' }),
    ).toBeInTheDocument()
    expect(useAppStore.getState().quizErgebnisse).toEqual([])
    expect(useAppStore.getState().gamification.anzahlQuizRunden).toBe(0)
  })

  it('startet nach dem Abbruch erneut eine vollständige Runde', () => {
    render(<QuizPage />)
    starteRunde(5)
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))

    starteRunde(5)

    expect(screen.getByText('Aufgabe 1 von 5')).toBeInTheDocument()
  })

  it('hat keine kritischen axe-Verstöße', async () => {
    const { container } = render(<QuizPage />)

    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
