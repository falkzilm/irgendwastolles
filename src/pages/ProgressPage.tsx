import './ProgressPage.css'
import { Card } from '../ui/Card'
import { useAppStore } from '../store'
import { FORMULA_CATALOG } from '../formulas'
import { BerechnungenChart } from './progress/BerechnungenChart'
import {
  berechneQuizStatistik,
  berechnungenProTag,
  topFormeln,
} from './progress/statistik'

/**
 * Statistik-Dashboard (IRGENDWAST-49): drei Kacheln mit Berechnungen der
 * letzten 7 Tage, Quiz-Trefferquote/-Rundenanzahl und den meistgenutzten
 * Formeln. Alle Daten kommen ausschließlich aus dem lokalen Store
 * (`verlauf`, `quizErgebnisse`, `gamification`, `formelNutzung`, siehe
 * docs/state.md) - es findet keine Netzwerkabfrage statt. Ohne Daten zeigt
 * jede Kachel einen erklärenden Leerzustand statt eines leeren Diagramms.
 */
export function ProgressPage() {
  const verlauf = useAppStore((state) => state.verlauf)
  const quizErgebnisse = useAppStore((state) => state.quizErgebnisse)
  const anzahlQuizRunden = useAppStore(
    (state) => state.gamification.anzahlQuizRunden,
  )
  const formelNutzung = useAppStore((state) => state.formelNutzung)

  const tage = berechnungenProTag(verlauf)
  const quizStatistik = berechneQuizStatistik(quizErgebnisse, anzahlQuizRunden)
  const formeln = topFormeln(formelNutzung, FORMULA_CATALOG)

  const hatBerechnungen = tage.some((tag) => tag.anzahl > 0)

  return (
    <div className="page">
      <h1>Fortschritt</h1>

      <div className="progress-page__kacheln">
        <Card className="progress-page__kachel">
          <h2>Berechnungen der letzten 7 Tage</h2>
          {hatBerechnungen ? (
            <BerechnungenChart tage={tage} />
          ) : (
            <p className="progress-page__leer">
              Noch keine Berechnungen in den letzten 7 Tagen. Rechne im Rechner,
              damit hier ein Diagramm erscheint.
            </p>
          )}
        </Card>

        <Card className="progress-page__kachel">
          <h2>Quiz</h2>
          {quizStatistik.trefferquote === null ? (
            <p className="progress-page__leer">
              Noch keine Quizrunde gespielt. Spiele eine Runde im Quiz, um deine
              Trefferquote zu sehen.
            </p>
          ) : (
            <div className="progress-page__kennzahlen">
              <p className="progress-page__kennzahl">
                <span className="progress-page__kennzahl-wert">
                  {Math.round(quizStatistik.trefferquote * 100)} %
                </span>
                <span className="progress-page__kennzahl-label">
                  Trefferquote
                </span>
              </p>
              <p className="progress-page__kennzahl">
                <span className="progress-page__kennzahl-wert">
                  {quizStatistik.anzahlRunden}
                </span>
                <span className="progress-page__kennzahl-label">
                  {quizStatistik.anzahlRunden === 1
                    ? 'gespielte Runde'
                    : 'gespielte Runden'}
                </span>
              </p>
            </div>
          )}
        </Card>

        <Card className="progress-page__kachel">
          <h2>Meistgenutzte Formeln</h2>
          {formeln.length === 0 ? (
            <p className="progress-page__leer">
              Noch keine Formel verwendet. Übernimm ein Ergebnis aus der
              Formel-Detailansicht in den Rechner, damit sie hier erscheint.
            </p>
          ) : (
            <ol className="progress-page__formeln">
              {formeln.map((eintrag) => (
                <li key={eintrag.formula.id} className="progress-page__formel">
                  <span className="progress-page__formel-titel">
                    {eintrag.formula.title}
                  </span>
                  <span className="progress-page__formel-anzahl">
                    {eintrag.anzahl}× verwendet
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  )
}
