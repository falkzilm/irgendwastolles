import { useMemo, useState } from 'react'
import './ProgressPage.css'
import { Card } from '../ui/Card'
import { useAppStore } from '../store'
import { ermittleFortschritt } from '../achievements'

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
 * Trophäenseite (IRGENDWAST-48): listet alle Achievements aus `ACHIEVEMENTS`
 * über `ermittleFortschritt` (siehe `src/achievements/evaluate.ts`) mit
 * Titel, Beschreibung und Status. Freigeschaltete Achievements zeigen das in
 * `gamification.achievementFreischaltDaten` vermerkte Freischaltdatum, offene
 * einen Fortschrittsbalken auf Basis von `aktuell`/`ziel`.
 */
export function ProgressPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')
  const gamification = useAppStore((state) => state.gamification)

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
                  <h2 className="progress-page__card-title">
                    {achievement.title}
                  </h2>
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
