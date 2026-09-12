import './ProgressHud.css'
import { berechneXpFortschritt, useAppStore } from '../store'

/**
 * Fortschritts-HUD (IRGENDWAST-47): zeigt Level, XP-Fortschrittsbalken und
 * aktuellen Streak dauerhaft in der App-Shell an, unabhängig von der
 * aktiven Ansicht (siehe `AppShell.tsx`). Liest ausschließlich aus dem
 * bereits bestehenden `gamification`-Profil (siehe `gamificationSlice.ts`)
 * - es gibt keinen eigenen HUD-State, der Balken aktualisiert sich also
 * automatisch mit jedem `recordEvent`-Aufruf. Ist `hudEnabled` (siehe
 * `settingsSlice.ts`) deaktiviert, rendert die Komponente nichts.
 */
export function ProgressHud() {
  const hudEnabled = useAppStore((state) => state.hudEnabled)
  const level = useAppStore((state) => state.gamification.level)
  const restXpBisNaechstesLevel = useAppStore(
    (state) => state.gamification.restXpBisNaechstesLevel,
  )
  const streak = useAppStore((state) => state.gamification.streak)

  if (!hudEnabled) return null

  const fortschritt = berechneXpFortschritt({
    level,
    restXpBisNaechstesLevel,
  })
  const fortschrittProzent = Math.round(fortschritt * 100)

  return (
    <div className="progress-hud" aria-label="Fortschritt">
      <span className="progress-hud__level">Level {level}</span>
      <div
        className="progress-hud__xp-bar"
        role="progressbar"
        aria-label="XP-Fortschritt bis zum nächsten Level"
        aria-valuenow={fortschrittProzent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-hud__xp-bar-fill"
          style={{ width: `${fortschrittProzent}%` }}
        />
      </div>
      <span className="progress-hud__streak">🔥 {streak}</span>
    </div>
  )
}
