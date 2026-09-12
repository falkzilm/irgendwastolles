import { useMemo, useState } from 'react'
import './ProgressPage.css'
import { Card } from '../ui/Card'
import { useAppStore } from '../store'
import { ermittleFortschritt } from '../achievements'
import { FORMULA_CATALOG } from '../formulas'
import { BerechnungenChart } from './progress/BerechnungenChart'
import {
  berechneQuizStatistik,
  berechnungenProTag,
  topFormeln,
} from './progress/statistik'

type StatusFilter = 'alle' | 'freigeschaltet' | 'offen'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'freigeschaltet', label: 'Freigeschaltet' },
  { key: 'offen', label: 'Offen' },
]

function formatiereFreischaltDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Fortschrittsseite: kombiniert das Statistik-Dashboard (IRGENDWAST-49) mit
 * der Trophäenseite (IRGENDWAST-48). Das Dashboard zeigt Berechnungen der
 * letzten 7 Tage, Quiz-Trefferquote/-Rundenanzahl und die meistgenutzten
 * Formeln - alle Daten kommen ausschließlich aus dem lokalen Store
 * (`verlauf`, `quizErgebnisse`, `gamification`, `formelNutzung`, siehe
 * docs/state.md), es findet keine Netzwerkabfrage statt. Ohne Daten zeigt
 * jede Kachel einen erklärenden Leerzustand. Darunter listet die
 * Trophäenseite alle Achievements aus `ACHIEVEMENTS` über
 * `ermittleFortschritt` (siehe `src/achievements/evaluate.ts`) mit Titel,
 * Beschreibung und Status.
 */
export function ProgressPage() {
  const verlauf = useAppStore((state) => state.verlauf)
  const quizErgebnisse = useAppStore((state) => state.quizErgebnisse)
  const anzahlQuizRunden = useAppStore(
    (state) => state.gamification.anzahlQuizRunden,
  )
  const formelNutzung = useAppStore((state) => state.formelNutzung)
  const gamification = useAppStore((state) => state.gamification)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')

  const tage = berechnungenProTag(verlauf)
  const quizStatistik = berechneQuizStatistik(quizErgebnisse, anzahlQuizRunden)
  const formeln = topFormeln(formelNutzung, FORMULA_CATALOG)
  const hatBerechnungen = tage.some((tag) => tag.anzahl > 0)

  const fortschritt = useMemo(
    () => ermittleFortschritt(gamification),
    [gamification],
  )

  const gefiltert = useMemo(() => {
    if (statusFilter === 'freigeschaltet') {
      return fortschritt.filter((eintrag) => eintrag.erreicht)
    }
    if (statusFilter === 'offen') {
      return fortschritt.filter((eintrag) => !eintrag.erreicht)
    }
    return fortschritt
  }, [fortschritt, statusFilter])

  return (
    <div className="page">
      <h1>Fortschritt</h1>

      <h2 className="progress-page__section-title">Statistik</h2>
      <div className="progress-page__kacheln">
        <Card className="progress-page__kachel">
          <h3>Berechnungen der letzten 7 Tage</h3>
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
          <h3>Quiz</h3>
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
          <h3>Meistgenutzte Formeln</h3>
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

      <h2 className="progress-page__section-title">Erfolge</h2>
      <div
        className="progress-page__toolbar"
        role="group"
        aria-label="Nach Status filtern"
      >
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className="progress-page__status-filter"
            aria-pressed={statusFilter === filter.key}
            onClick={() => setStatusFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {gefiltert.length === 0 ? (
        <p className="progress-page__empty">
          Keine Erfolge für diesen Filter vorhanden.
        </p>
      ) : (
        <div className="progress-page__cards">
          {gefiltert.map(({ achievement, aktuell, ziel, erreicht }) => {
            const freischaltDatum =
              gamification.achievementFreischaltDaten[achievement.id]

            return (
              <Card key={achievement.id} className="progress-page__card">
                <div className="progress-page__card-header">
                  <span className="progress-page__card-icon" aria-hidden="true">
                    {achievement.icon}
                  </span>
                  <h3 className="progress-page__card-title">
                    {achievement.title}
                  </h3>
                  <span
                    className={`progress-page__status-badge${
                      erreicht
                        ? ' progress-page__status-badge--freigeschaltet'
                        : ''
                    }`}
                  >
                    {erreicht ? 'Freigeschaltet' : 'Offen'}
                  </span>
                </div>
                <p className="progress-page__card-description">
                  {achievement.description}
                </p>
                {erreicht ? (
                  freischaltDatum && (
                    <p className="progress-page__unlock-date">
                      Freigeschaltet am{' '}
                      {formatiereFreischaltDatum(freischaltDatum)}
                    </p>
                  )
                ) : (
                  <div className="progress-page__progress">
                    <div
                      className="progress-page__progress-bar"
                      role="progressbar"
                      aria-valuenow={aktuell}
                      aria-valuemin={0}
                      aria-valuemax={ziel}
                      aria-label={`Fortschritt zu ${achievement.title}`}
                    >
                      <div
                        className="progress-page__progress-fill"
                        style={{ width: `${(aktuell / ziel) * 100}%` }}
                      />
                    </div>
                    <span className="progress-page__progress-label">
                      {aktuell}/{ziel}
                    </span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
