import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProgressPage } from './ProgressPage'
import { useAppStore } from '../store'

const initialState = useAppStore.getState()

describe('ProgressPage', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt für jede Kachel einen erklärenden Leerzustand ohne Daten', () => {
    render(<ProgressPage />)

    expect(
      screen.getByText(/noch keine berechnungen in den letzten 7 tagen/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/noch keine quizrunde gespielt/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/noch keine formel verwendet/i)).toBeInTheDocument()
  })

  it('zeigt ein Diagramm mit 7 Tagen, sobald Berechnungen im Verlauf sind', () => {
    useAppStore.setState({
      verlauf: [
        { id: '1', expression: '1+1', result: '2', timestamp: Date.now() },
        { id: '2', expression: '2+2', result: '4', timestamp: Date.now() },
      ],
    })

    render(<ProgressPage />)

    expect(
      screen.queryByText(/noch keine berechnungen in den letzten 7 tagen/i),
    ).not.toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('zeigt Trefferquote und Anzahl gespielter Runden', () => {
    useAppStore.setState({
      quizErgebnisse: [
        {
          id: '1',
          difficulty: 'leicht',
          anzahlAufgaben: 10,
          anzahlRichtig: 8,
          dauerMs: 1000,
          timestamp: Date.now(),
        },
      ],
      gamification: {
        ...initialState.gamification,
        anzahlQuizRunden: 1,
      },
    })

    render(<ProgressPage />)

    expect(screen.getByText('80 %')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('gespielte Runde')).toBeInTheDocument()
  })

  it('listet die drei meistgenutzten Formeln absteigend sortiert', () => {
    useAppStore.setState({
      formelNutzung: {
        kreisflaeche: 5,
        kreisumfang: 2,
        'lineare-gleichung': 8,
        'quadratische-diskriminante': 1,
      },
    })

    render(<ProgressPage />)

    const eintraege = screen.getAllByText(/× verwendet/)
    expect(eintraege).toHaveLength(3)
    expect(screen.getByText('Lineare Gleichung')).toBeInTheDocument()
    expect(screen.getByText('Kreisfläche')).toBeInTheDocument()
    expect(screen.getByText('Kreisumfang')).toBeInTheDocument()
    expect(
      screen.queryByText('Diskriminante der quadratischen Gleichung'),
    ).not.toBeInTheDocument()
  })

  it('listet alle Achievements mit Titel, Beschreibung und Status "Offen"', () => {
    render(<ProgressPage />)

    expect(screen.getByText('Erste Schritte')).toBeInTheDocument()
    expect(
      screen.getByText('Die erste Berechnung im Rechner durchgeführt.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Offen').length).toBeGreaterThan(0)
  })

  it('zeigt bei einer freigeschalteten Achievement das Freischaltdatum statt eines Fortschrittsbalkens', () => {
    useAppStore
      .getState()
      .recordEvent(
        { type: 'calculation_done' },
        new Date('2026-03-05T10:00:00.000Z'),
      )

    render(<ProgressPage />)

    expect(screen.getByText('Freigeschaltet am 05.03.2026')).toBeInTheDocument()
  })

  it('zeigt bei einer offenen Achievement mit Zähler einen Fortschrittsindikator', () => {
    useAppStore
      .getState()
      .recordEvent(
        { type: 'calculation_done' },
        new Date('2026-03-05T10:00:00.000Z'),
      )

    render(<ProgressPage />)

    expect(
      screen.getByRole('progressbar', { name: 'Fortschritt zu Rechenmeister' }),
    ).toHaveAttribute('aria-valuenow', '1')
  })

  it('filtert die Liste per Statusfilter nach freigeschaltet', () => {
    useAppStore
      .getState()
      .recordEvent(
        { type: 'calculation_done' },
        new Date('2026-03-05T10:00:00.000Z'),
      )

    render(<ProgressPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Freigeschaltet' }))

    expect(screen.getByText('Erste Schritte')).toBeInTheDocument()
    expect(screen.queryByText('Quiz-Neuling')).not.toBeInTheDocument()
  })

  it('filtert die Liste per Statusfilter nach offen', () => {
    useAppStore
      .getState()
      .recordEvent(
        { type: 'calculation_done' },
        new Date('2026-03-05T10:00:00.000Z'),
      )

    render(<ProgressPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Offen' }))

    expect(screen.queryByText('Erste Schritte')).not.toBeInTheDocument()
    expect(screen.getByText('Quiz-Neuling')).toBeInTheDocument()
  })

  it('zeigt einen Leerzustand, wenn der Freigeschaltet-Filter aktiv ist und noch nichts freigeschaltet wurde', () => {
    render(<ProgressPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Freigeschaltet' }))

    expect(
      screen.getByText('Keine Erfolge für diesen Filter vorhanden.'),
    ).toBeInTheDocument()
  })

  it('hat keine kritischen axe-Verstöße', async () => {
    const { container } = render(<ProgressPage />)

    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
