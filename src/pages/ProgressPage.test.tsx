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
