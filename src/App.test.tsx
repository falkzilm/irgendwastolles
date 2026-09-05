import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the Rechner page as the initial view', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Rechner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechner' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
