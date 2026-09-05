import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DemoPage } from './DemoPage'
import { ThemeProvider } from './theme'
import { ToastProvider } from './Toast'

function renderDemoPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <DemoPage />
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('DemoPage', () => {
  it('shows Button, Card, Modal trigger and Toast triggers', () => {
    renderDemoPage()

    expect(screen.getByRole('button', { name: 'Primär' })).toBeInTheDocument()
    expect(screen.getByText('Kartentitel')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Modal öffnen' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Erfolgs-Toast anzeigen' }),
    ).toBeInTheDocument()
  })

  it('opens the modal and closes it via the close button', () => {
    renderDemoPage()

    fireEvent.click(screen.getByRole('button', { name: 'Modal öffnen' }))
    expect(
      screen.getByRole('dialog', { name: 'Beispiel-Modal' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
