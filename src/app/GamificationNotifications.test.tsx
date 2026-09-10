import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { GamificationNotifications } from './GamificationNotifications'
import { ToastProvider } from '../ui/Toast'
import { useAppStore } from '../store'

const initialState = useAppStore.getState()

function renderNotifications() {
  return render(
    <ToastProvider>
      <GamificationNotifications />
    </ToastProvider>,
  )
}

describe('GamificationNotifications', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt beim Level-Up eine Benachrichtigung mit Titel und Beschreibung', () => {
    renderNotifications()

    act(() => {
      // Reicht für einen Level-Up (Schwelle Level 2: 100 XP).
      for (let i = 0; i < 20; i++) {
        useAppStore
          .getState()
          .recordEvent(
            { type: 'calculation_done' },
            new Date(2026, 2, 5 + i, 10, 0, 0),
          )
      }
    })

    expect(useAppStore.getState().gamification.level).toBeGreaterThan(1)
    expect(screen.getByText('Level 2 erreicht!')).toBeInTheDocument()
  })

  it('zeigt bei einem freigeschalteten Achievement eine Benachrichtigung mit dessen Titel und Beschreibung', () => {
    renderNotifications()

    act(() => {
      useAppStore.getState().recordEvent({ type: 'calculation_done' })
    })

    expect(screen.getByText('🧮 Erste Schritte')).toBeInTheDocument()
    expect(
      screen.getByText('Die erste Berechnung im Rechner durchgeführt.'),
    ).toBeInTheDocument()
  })

  it('zeigt keine Benachrichtigung, wenn Benachrichtigungen deaktiviert sind', () => {
    useAppStore.getState().setNotificationsEnabled(false)
    renderNotifications()

    act(() => {
      useAppStore.getState().recordEvent({ type: 'calculation_done' })
    })

    expect(screen.queryByText('🧮 Erste Schritte')).not.toBeInTheDocument()
  })

  it('zeigt beim Mount mit bereits vorhandenem Fortschritt keine Benachrichtigung', () => {
    act(() => {
      useAppStore.getState().recordEvent({ type: 'calculation_done' })
    })

    renderNotifications()

    expect(screen.queryByText('🧮 Erste Schritte')).not.toBeInTheDocument()
  })
})
