import { useState } from 'react'
import { QuizSetup, AUFGABENANZAHL_OPTIONEN } from './quiz/QuizSetup'
import { QuizFrage } from './quiz/QuizFrage'
import { QuizErgebnisUebersicht } from './quiz/QuizErgebnisUebersicht'
import { generateExercises } from '../exercises'
import type { Difficulty, Exercise } from '../exercises'
import { useAppStore } from '../store'

interface AktiveRunde {
  exercises: Exercise[]
  index: number
  anzahlRichtig: number
  startedAt: number
}

interface RundenErgebnis {
  anzahlAufgaben: number
  anzahlRichtig: number
  dauerMs: number
}

type QuizPhase =
  | { status: 'setup' }
  | { status: 'laeuft'; runde: AktiveRunde }
  | { status: 'ergebnis'; ergebnis: RundenErgebnis }

/**
 * Übungsrunde (IRGENDWAST-38): Nutzer wählen Schwierigkeitsstufe und
 * Aufgabenanzahl (`QuizSetup`), beantworten die generierten Aufgaben
 * (`QuizFrage`, mit direktem Richtig/Falsch-Feedback) und sehen am Ende eine
 * Übersicht (`QuizErgebnisUebersicht`). Die aktive Runde lebt ausschließlich
 * als lokaler Komponentenzustand - ein Abbruch verwirft `runde` einfach und
 * hinterlässt dadurch keinen inkonsistenten globalen Zustand. Erst ein
 * abgeschlossenes Rundenergebnis wird über `addQuizErgebnis` persistiert
 * (siehe `quizSlice.ts`) und über `recordEvent` in die Gamification-Auswertung
 * eingetragen (`quiz_round_finished`, siehe `gamificationSlice.ts`).
 */
export function QuizPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('leicht')
  const [anzahlAufgaben, setAnzahlAufgaben] = useState<number>(
    AUFGABENANZAHL_OPTIONEN[1],
  )
  const [phase, setPhase] = useState<QuizPhase>({ status: 'setup' })

  const addQuizErgebnis = useAppStore((state) => state.addQuizErgebnis)
  const recordEvent = useAppStore((state) => state.recordEvent)

  function starteRunde() {
    const exercises = generateExercises({
      seed: Date.now(),
      count: anzahlAufgaben,
      difficulty,
    })
    setPhase({
      status: 'laeuft',
      runde: { exercises, index: 0, anzahlRichtig: 0, startedAt: Date.now() },
    })
  }

  function beendeRunde(runde: AktiveRunde, anzahlRichtig: number) {
    const dauerMs = Date.now() - runde.startedAt
    const anzahlAufgabenGesamt = runde.exercises.length

    addQuizErgebnis({
      difficulty,
      anzahlAufgaben: anzahlAufgabenGesamt,
      anzahlRichtig,
      dauerMs,
    })
    recordEvent({ type: 'quiz_round_finished' })

    setPhase({
      status: 'ergebnis',
      ergebnis: {
        anzahlAufgaben: anzahlAufgabenGesamt,
        anzahlRichtig,
        dauerMs,
      },
    })
  }

  function handleWeiter(runde: AktiveRunde, richtig: boolean) {
    const anzahlRichtig = runde.anzahlRichtig + (richtig ? 1 : 0)
    const istLetzte = runde.index === runde.exercises.length - 1

    if (istLetzte) {
      beendeRunde(runde, anzahlRichtig)
      return
    }

    setPhase({
      status: 'laeuft',
      runde: { ...runde, index: runde.index + 1, anzahlRichtig },
    })
  }

  function handleAbbrechen() {
    setPhase({ status: 'setup' })
  }

  return (
    <div className="page">
      <h1>Quiz</h1>

      {phase.status === 'setup' && (
        <QuizSetup
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          anzahlAufgaben={anzahlAufgaben}
          onAnzahlAufgabenChange={setAnzahlAufgaben}
          onStart={starteRunde}
        />
      )}

      {phase.status === 'laeuft' && (
        <QuizFrage
          key={phase.runde.exercises[phase.runde.index].id}
          exercise={phase.runde.exercises[phase.runde.index]}
          index={phase.runde.index}
          gesamt={phase.runde.exercises.length}
          istLetzte={phase.runde.index === phase.runde.exercises.length - 1}
          onWeiter={(richtig) => handleWeiter(phase.runde, richtig)}
          onAbbrechen={handleAbbrechen}
        />
      )}

      {phase.status === 'ergebnis' && (
        <QuizErgebnisUebersicht
          anzahlRichtig={phase.ergebnis.anzahlRichtig}
          anzahlAufgaben={phase.ergebnis.anzahlAufgaben}
          dauerMs={phase.ergebnis.dauerMs}
          onNeueRunde={() => setPhase({ status: 'setup' })}
        />
      )}
    </div>
  )
}
