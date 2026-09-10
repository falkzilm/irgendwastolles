import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SettingsPage } from './SettingsPage'
import { useAppStore } from '../store'

const initialState = useAppStore.getState()

describe('SettingsPage', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zeigt den Benachrichtigungs-Schalter standardmäßig aktiviert', () => {
    render(<SettingsPage />)

    expect(
      screen.getByRole('checkbox', {
        name: 'Benachrichtigungen bei Level-Up und neuen Erfolgen anzeigen',
      }),
    ).toBeChecked()
  })

  it('deaktiviert Benachrichtigungen im Store per Klick auf den Schalter', () => {
    render(<SettingsPage />)

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Benachrichtigungen bei Level-Up und neuen Erfolgen anzeigen',
      }),
    )

    expect(useAppStore.getState().notificationsEnabled).toBe(false)
  })
})
