import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'
import { ThemeProvider } from '../ui/theme'
import { ToastProvider } from '../ui/Toast'

function renderAppShell() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('AppShell', () => {
  it('shows navigation for Rechner, Formeln and Fortschritt', () => {
    renderAppShell()

    expect(screen.getByRole('button', { name: 'Rechner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formeln' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Fortschritt' }),
    ).toBeInTheDocument()
  })

  it('starts on the Rechner view', () => {
    renderAppShell()

    expect(screen.getByRole('heading', { name: 'Rechner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechner' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('switches the view and marks the active nav item on click', () => {
    renderAppShell()

    fireEvent.click(screen.getByRole('button', { name: 'Formeln' }))

    expect(screen.getByRole('heading', { name: 'Formeln' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formeln' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Rechner' })).not.toHaveAttribute(
      'aria-current',
    )
    expect(
      screen.queryByRole('heading', { name: 'Rechner' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fortschritt' }))

    expect(
      screen.getByRole('heading', { name: 'Fortschritt' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fortschritt' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('has no critical axe violations', async () => {
    const { container } = renderAppShell()

    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
