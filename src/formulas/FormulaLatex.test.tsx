import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { FormulaLatex } from './FormulaLatex'

describe('FormulaLatex', () => {
  it('rendert gültiges LaTeX als KaTeX-Markup', () => {
    const { container } = render(<FormulaLatex latex="A = \pi r^2" />)

    const katexEl = container.querySelector('.katex')
    expect(katexEl).not.toBeNull()
    expect(container.querySelector('.formula-latex--fallback')).toBeNull()
    // KaTeX rendert Symbole als eigene Spans statt als Klartext im DOM -
    // stattdessen die MathML-Annotation prüfen, die die Original-Quelle enthält.
    expect(container.querySelector('annotation')?.textContent).toBe(
      'A = \\pi r^2',
    )
  })

  it('zeigt bei ungültigem LaTeX einen Klartext-Fallback ohne Absturz', () => {
    const invalid = '\\frac{1}{'

    const { container, getByText } = render(<FormulaLatex latex={invalid} />)

    expect(container.querySelector('.katex')).toBeNull()
    const fallback = getByText(invalid)
    expect(fallback).toHaveClass('formula-latex--fallback')
  })

  it('hat für gültiges LaTeX keine Accessibility-Verstöße', async () => {
    const { container } = render(<FormulaLatex latex="x^2 + y^2 = r^2" />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('hat für den Klartext-Fallback keine Accessibility-Verstöße', async () => {
    const { container } = render(<FormulaLatex latex="\\frac{1}{" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
