import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider, useTheme } from './theme'

function ToggleButton() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

describe('ThemeProvider', () => {
  it('toggles the data-theme attribute on the document element without a reload', () => {
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    )

    const button = screen.getByRole('button')
    const initialTheme = document.documentElement.getAttribute('data-theme')

    fireEvent.click(button)

    const nextTheme = document.documentElement.getAttribute('data-theme')
    expect(nextTheme).not.toBe(initialTheme)
    expect(button.textContent).toBe(nextTheme)
  })
})
