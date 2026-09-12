import { useAppStore } from '../store'
import './SettingsPage.css'

/**
 * Einstellungen: der Schalter für Gamification-Benachrichtigungen
 * (Level-Up, Achievement-Unlock, siehe `app/GamificationNotifications.tsx`,
 * IRGENDWAST-46) sowie der Schalter für das Fortschritts-HUD (Level,
 * XP-Balken, Streak, siehe `app/ProgressHud.tsx`, IRGENDWAST-47). Weitere
 * Einstellungen ergänzen diese Seite um weitere Abschnitte, statt eine
 * eigene Seite anzulegen.
 */
export function SettingsPage() {
  const notificationsEnabled = useAppStore(
    (state) => state.notificationsEnabled,
  )
  const setNotificationsEnabled = useAppStore(
    (state) => state.setNotificationsEnabled,
  )
  const hudEnabled = useAppStore((state) => state.hudEnabled)
  const setHudEnabled = useAppStore((state) => state.setHudEnabled)

  return (
    <div className="page">
      <h1>Einstellungen</h1>
      <label className="settings-page__toggle">
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(event) => setNotificationsEnabled(event.target.checked)}
        />
        Benachrichtigungen bei Level-Up und neuen Erfolgen anzeigen
      </label>
      <label className="settings-page__toggle">
        <input
          type="checkbox"
          checked={hudEnabled}
          onChange={(event) => setHudEnabled(event.target.checked)}
        />
        Fortschritts-HUD (Level, XP-Balken, Streak) anzeigen
      </label>
    </div>
  )
}
