import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './Toast'

function TestConsumer() {
  const { showToast } = useToast()
  return (
    <button
      type="button"
      onClick={() => showToast('Nachricht', 'success', 'Titel')}
    >
      auslösen
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('zeigt eine Benachrichtigung mit Titel und Beschreibung und lässt sie manuell schließen', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'auslösen' }))

    expect(screen.getByText('Titel')).toBeInTheDocument()
    expect(screen.getByText('Nachricht')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Benachrichtigung schließen' }),
    )

    expect(screen.queryByText('Titel')).not.toBeInTheDocument()
  })

  it('entfernt eine Benachrichtigung automatisch nach der Anzeigedauer', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'auslösen' }))
    expect(screen.getByText('Titel')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByText('Titel')).not.toBeInTheDocument()
  })

  it('stapelt mehrere gleichzeitige Benachrichtigungen statt sie zu überlagern', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'auslösen' }))
    fireEvent.click(screen.getByRole('button', { name: 'auslösen' }))

    expect(screen.getAllByText('Titel')).toHaveLength(2)
    expect(
      screen.getAllByRole('button', { name: 'Benachrichtigung schließen' }),
    ).toHaveLength(2)
  })
})
