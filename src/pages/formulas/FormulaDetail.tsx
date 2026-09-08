import { useMemo, useState } from 'react'
import './FormulaDetail.css'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { useToast } from '../../ui/Toast'
import { useAppStore } from '../../store'
import { formatResult } from '../../engine'
import { evaluateFormula } from '../../formulas'
import type { Formula, FormulaVariable } from '../../formulas'

interface FormulaDetailProps {
  formula: Formula
  onClose: () => void
}

function parseVariableValue(raw: string): number | undefined {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '') return undefined
  const value = Number(normalized)
  return Number.isFinite(value) ? value : undefined
}

function describeRange(
  min: number | undefined,
  max: number | undefined,
): string {
  if (min !== undefined && max !== undefined) {
    return `zwischen ${min} und ${max}`
  }
  if (min !== undefined) {
    return `mindestens ${min}`
  }
  return `höchstens ${max}`
}

function validateField(
  variable: FormulaVariable,
  raw: string,
): string | undefined {
  if (raw.trim() === '') return undefined

  const value = parseVariableValue(raw)
  if (value === undefined) {
    return 'Bitte eine gültige Zahl eingeben.'
  }

  const { min, max } = variable.range ?? {}
  if (
    (min !== undefined && value < min) ||
    (max !== undefined && value > max)
  ) {
    return `Wert muss ${describeRange(min, max)} liegen.`
  }

  return undefined
}

/**
 * Formel-Detailansicht (IRGENDWAST-34): Eingabefeld je Variable, Ergebnis
 * sobald alle Werte gültig sind, feldbezogene Fehler bei ungültigen
 * Eingaben. Ein Beispielwertsatz (`formula.example`) lässt sich per Klick
 * einsetzen, das Ergebnis per Klick über `loadExpression()` in den
 * `calculatorSlice` übernehmen (siehe docs/state.md).
 */
export function FormulaDetail({ formula, onClose }: FormulaDetailProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const angleMode = useAppStore((state) => state.angleMode)
  const loadExpression = useAppStore((state) => state.loadExpression)
  const { showToast } = useToast()

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {}
    for (const variable of formula.variables) {
      const error = validateField(variable, values[variable.name] ?? '')
      if (error) {
        errors[variable.name] = error
      }
    }
    return errors
  }, [formula.variables, values])

  const allFilled = formula.variables.every(
    (variable) => (values[variable.name] ?? '').trim() !== '',
  )
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  const evaluation = useMemo(() => {
    if (!allFilled || hasFieldErrors) return null

    const numericValues: Record<string, number> = {}
    for (const variable of formula.variables) {
      numericValues[variable.name] = parseVariableValue(
        values[variable.name] ?? '',
      ) as number
    }
    return evaluateFormula(formula, numericValues, { angleMode })
  }, [allFilled, hasFieldErrors, formula, values, angleMode])

  const resultText = evaluation?.ok ? formatResult(evaluation.value) : null

  function handleChange(name: string, raw: string) {
    setValues((current) => ({ ...current, [name]: raw }))
  }

  function handleExample() {
    if (!formula.example) return
    const next: Record<string, string> = {}
    for (const variable of formula.variables) {
      const exampleValue = formula.example[variable.name]
      if (exampleValue !== undefined) {
        next[variable.name] = String(exampleValue)
      }
    }
    setValues(next)
  }

  function handleTransfer() {
    if (!resultText) return
    loadExpression(resultText)
    showToast(`Ergebnis ${resultText} in den Rechner übernommen`, 'success')
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={formula.title}>
      <div className="formula-detail">
        <p className="formula-detail__description">{formula.description}</p>
        <p className="formula-detail__latex">{formula.latex}</p>

        {formula.example && (
          <Button
            variant="secondary"
            className="formula-detail__example"
            onClick={handleExample}
          >
            Beispielwerte einsetzen
          </Button>
        )}

        <div className="formula-detail__fields">
          {formula.variables.map((variable) => {
            const fieldId = `formula-detail__field-${variable.name}`
            const errorId = `${fieldId}-error`
            const error = fieldErrors[variable.name]
            return (
              <div className="formula-detail__field" key={variable.name}>
                <label htmlFor={fieldId}>
                  {variable.name}
                  {variable.unit ? ` (${variable.unit})` : ''}
                </label>
                <input
                  id={fieldId}
                  type="text"
                  inputMode="decimal"
                  value={values[variable.name] ?? ''}
                  onChange={(event) =>
                    handleChange(variable.name, event.target.value)
                  }
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
                {error && (
                  <p
                    className="formula-detail__field-error"
                    id={errorId}
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {resultText !== null && (
          <div className="formula-detail__result">
            <p>
              Ergebnis: <strong>{resultText}</strong>
            </p>
            <Button onClick={handleTransfer}>In den Rechner übernehmen</Button>
          </div>
        )}

        {evaluation && !evaluation.ok && (
          <p className="formula-detail__result-error" role="alert">
            {evaluation.error.message}
          </p>
        )}
      </div>
    </Modal>
  )
}
