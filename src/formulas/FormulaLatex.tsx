import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './FormulaLatex.css'

export interface FormulaLatexProps {
  /** LaTeX-Quelltext, z. B. `A = \\pi r^2` (siehe `Formula.latex`). */
  latex: string
  /**
   * KaTeX-Displaymodus (zentriert, größere Symbole) statt Inline-Rendering.
   * Formeln im Katalog sind eigenständige Gleichungen, daher `true` als
   * Standard.
   */
  displayMode?: boolean
  className?: string
}

type RenderResult = { ok: true; html: string } | { ok: false }

function renderLatex(latex: string, displayMode: boolean): RenderResult {
  try {
    return {
      ok: true,
      html: katex.renderToString(latex, {
        throwOnError: true,
        displayMode,
        // Default (kein extern eingebundenes HTML/CSS/JS zulassen) reicht
        // aus, damit weder `trust` noch die CSP für das Rendering gelockert
        // werden müssen.
        trust: false,
      }),
    }
  } catch {
    // Jeder Fehler (u. a. `katex.ParseError` bei ungültigem LaTeX) führt zum
    // Klartext-Fallback statt zu einem Absturz der Komponente.
    return { ok: false }
  }
}

/**
 * Rendert die LaTeX-Darstellung einer Formel per KaTeX. KaTeX läuft
 * vollständig lokal (aus `node_modules/katex` gebündelt, keine
 * CDN-Anfragen) und benötigt daher keine Lockerung der Content-Security-Policy.
 */
export function FormulaLatex({
  latex,
  displayMode = true,
  className,
}: FormulaLatexProps) {
  const result = useMemo(
    () => renderLatex(latex, displayMode),
    [latex, displayMode],
  )
  const classes = ['formula-latex', className].filter(Boolean).join(' ')

  if (!result.ok) {
    return (
      <span
        className={`${classes} formula-latex--fallback`}
        aria-label={`Formel konnte nicht dargestellt werden: ${latex}`}
      >
        {latex}
      </span>
    )
  }

  return (
    <span
      className={classes}
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  )
}
