import { useAppStore } from '../store'
import './SettingsPage.css'

/**
 * Einstellungen (IRGENDWAST-46): aktuell einzig der Schalter für
 * Gamification-Benachrichtigungen (Level-Up, Achievement-Unlock, siehe
 * `app/GamificationNotifications.tsx`). Weitere Einstellungen ergänzen diese
 * Seite um weitere Abschnitte, statt eine eigene Seite anzulegen.
 */
export function SettingsPage() {
  const notificationsEnabled = useAppStore(
    (state) => state.notificationsEnabled,
  )
  const setNotificationsEnabled = useAppStore(
    (state) => state.setNotificationsEnabled,
  )

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
    </div>
  )
}
