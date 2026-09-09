import { Button } from '../../ui/Button'
import { DIFFICULTIES } from '../../exercises'
import type { Difficulty } from '../../exercises'
import './QuizSetup.css'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  leicht: 'Leicht',
  mittel: 'Mittel',
  schwer: 'Schwer',
}

export const AUFGABENANZAHL_OPTIONEN = [5, 10, 15] as const

interface QuizSetupProps {
  difficulty: Difficulty
  onDifficultyChange: (difficulty: Difficulty) => void
  anzahlAufgaben: number
  onAnzahlAufgabenChange: (anzahl: number) => void
  onStart: () => void
}

/**
 * Auswahl von Schwierigkeitsstufe und Aufgabenanzahl vor dem Start einer
 * Quizrunde (IRGENDWAST-38).
 */
export function QuizSetup({
  difficulty,
  onDifficultyChange,
  anzahlAufgaben,
  onAnzahlAufgabenChange,
  onStart,
}: QuizSetupProps) {
  return (
    <div className="quiz-setup">
      <fieldset className="quiz-setup__field">
        <legend>Schwierigkeitsstufe</legend>
        <div className="quiz-setup__options" role="group">
          {DIFFICULTIES.map((stufe) => (
            <Button
              key={stufe}
              variant="secondary"
              aria-pressed={difficulty === stufe}
              onClick={() => onDifficultyChange(stufe)}
            >
              {DIFFICULTY_LABELS[stufe]}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="quiz-setup__field">
        <legend>Anzahl Aufgaben</legend>
        <div className="quiz-setup__options" role="group">
          {AUFGABENANZAHL_OPTIONEN.map((anzahl) => (
            <Button
              key={anzahl}
              variant="secondary"
              aria-pressed={anzahlAufgaben === anzahl}
              onClick={() => onAnzahlAufgabenChange(anzahl)}
            >
              {anzahl}
            </Button>
          ))}
        </div>
      </fieldset>

      <Button onClick={onStart}>Runde starten</Button>
    </div>
  )
}
