import { Button } from '../../ui/Button'
import './QuizErgebnisUebersicht.css'

interface QuizErgebnisUebersichtProps {
  anzahlRichtig: number
  anzahlAufgaben: number
  dauerMs: number
  onNeueRunde: () => void
}

/** Formatiert eine Dauer in Millisekunden als `mm:ss`. */
export function formatDauer(dauerMs: number): string {
  const gesamtSekunden = Math.round(dauerMs / 1000)
  const minuten = Math.floor(gesamtSekunden / 60)
  const sekunden = gesamtSekunden % 60
  return `${minuten}:${String(sekunden).padStart(2, '0')}`
}

/**
 * Rundenabschluss-Übersicht (IRGENDWAST-38): Anzahl richtiger Antworten und
 * benötigte Zeit der abgeschlossenen Runde.
 */
export function QuizErgebnisUebersicht({
  anzahlRichtig,
  anzahlAufgaben,
  dauerMs,
  onNeueRunde,
}: QuizErgebnisUebersichtProps) {
  return (
    <div className="quiz-ergebnis">
      <h2>Runde abgeschlossen</h2>
      <p className="quiz-ergebnis__zeile">
        {anzahlRichtig} von {anzahlAufgaben} Aufgaben richtig
      </p>
      <p className="quiz-ergebnis__zeile">
        Benötigte Zeit: {formatDauer(dauerMs)} Minuten
      </p>
      <Button onClick={onNeueRunde}>Neue Runde</Button>
    </div>
  )
}
