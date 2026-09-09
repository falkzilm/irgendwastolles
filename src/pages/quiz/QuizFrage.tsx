import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../ui/Button'
import { checkAnswer } from '../../exercises'
import type { Exercise } from '../../exercises'
import './QuizFrage.css'

interface QuizFrageProps {
  exercise: Exercise
  index: number
  gesamt: number
  istLetzte: boolean
  onWeiter: (richtig: boolean) => void
  onAbbrechen: () => void
}

/**
 * Zeigt eine einzelne Aufgabe einer Quizrunde (IRGENDWAST-38): nach dem
 * Absenden einer Antwort erscheint sofort Richtig/Falsch-Feedback, bei
 * Fehlern zusätzlich die korrekte Lösung. Wird über `key={exercise.id}` von
 * `QuizPage` neu gemountet, wenn die nächste Aufgabe beginnt - der
 * Eingabe-/Feedback-Zustand muss dadurch nicht manuell zurückgesetzt werden.
 */
export function QuizFrage({
  exercise,
  index,
  gesamt,
  istLetzte,
  onWeiter,
  onAbbrechen,
}: QuizFrageProps) {
  const [eingabe, setEingabe] = useState('')
  const [feedback, setFeedback] = useState<{ richtig: boolean } | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (feedback) return
    const richtig = checkAnswer(exercise, Number(eingabe))
    setFeedback({ richtig })
  }

  return (
    <div className="quiz-frage">
      <p className="quiz-frage__fortschritt">
        Aufgabe {index + 1} von {gesamt}
      </p>
      <p className="quiz-frage__prompt">{exercise.prompt}</p>

      <form onSubmit={handleSubmit} className="quiz-frage__form">
        <label className="quiz-frage__label" htmlFor="quiz-frage-antwort">
          Antwort
        </label>
        <input
          id="quiz-frage-antwort"
          type="number"
          inputMode="decimal"
          step="any"
          value={eingabe}
          onChange={(event) => setEingabe(event.target.value)}
          disabled={feedback !== null}
          autoFocus
        />
        {!feedback && (
          <Button type="submit" disabled={eingabe === ''}>
            Prüfen
          </Button>
        )}
      </form>

      {feedback && (
        <div
          role="status"
          className={`quiz-frage__feedback${
            feedback.richtig
              ? ' quiz-frage__feedback--richtig'
              : ' quiz-frage__feedback--falsch'
          }`}
        >
          {feedback.richtig ? (
            <p>Richtig!</p>
          ) : (
            <p>Leider falsch. Richtige Lösung: {exercise.answer}</p>
          )}
        </div>
      )}

      <div className="quiz-frage__aktionen">
        <Button variant="secondary" onClick={onAbbrechen}>
          Abbrechen
        </Button>
        {feedback && (
          <Button onClick={() => onWeiter(feedback.richtig)}>
            {istLetzte ? 'Ergebnis anzeigen' : 'Weiter'}
          </Button>
        )}
      </div>
    </div>
  )
}
