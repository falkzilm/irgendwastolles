import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProgressHud } from './ProgressHud'
import { useAppStore } from '../store'

const initialState = useAppStore.getState()

describe('ProgressHud', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt Level, XP-Fortschritt und Streak an', () => {
    render(<ProgressHud />)

    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'XP-Fortschritt bis zum nächsten Level',
      }),
    ).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('🔥 0')).toBeInTheDocument()
  })

  it('aktualisiert sich unmittelbar nach einer XP-relevanten Aktion', () => {
    render(<ProgressHud />)

    act(() => {
      useAppStore
        .getState()
        .recordEvent({ type: 'calculation_done' }, new Date(2026, 2, 5))
    })

    expect(
      screen.getByRole('progressbar', {
        name: 'XP-Fortschritt bis zum nächsten Level',
      }),
    ).toHaveAttribute('aria-valuenow', '5')
    expect(screen.getByText('🔥 1')).toBeInTheDocument()
  })

  it('zeigt bei einem Level-Up den korrekten neuen Fortschritt', () => {
    render(<ProgressHud />)

    act(() => {
      for (let i = 0; i < 20; i++) {
        useAppStore
          .getState()
          .recordEvent(
            { type: 'calculation_done' },
            new Date(2026, 2, 5 + i, 10, 0, 0),
          )
      }
    })

    expect(screen.getByText('Level 2')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'XP-Fortschritt bis zum nächsten Level',
      }),
    ).toHaveAttribute('aria-valuenow', '0')
  })

  it('rendert nichts, wenn das HUD in den Einstellungen deaktiviert ist', () => {
    useAppStore.getState().setHudEnabled(false)

    render(<ProgressHud />)

    expect(screen.queryByText(/Level/)).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
