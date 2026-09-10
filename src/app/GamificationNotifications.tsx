import { useEffect, useRef } from 'react'
import { ACHIEVEMENTS } from '../achievements/definitions'
import { useAppStore } from '../store'
import { useToast } from '../ui/Toast'

/**
 * Gemeinsam genutzte Benachrichtigungs-Anbindung für Gamification-Ereignisse
 * (IRGENDWAST-46): beobachtet `gamification.level` sowie
 * `freigeschalteteAchievements` im Store und zeigt bei einem Level-Up bzw.
 * einem neu freigeschalteten Achievement eine Toast-Benachrichtigung mit
 * Titel und Beschreibung (siehe `ui/Toast.tsx`). Andere UI-Bausteine dieses
 * Features setzen auf dieser Komponente auf, statt selbst auf
 * Store-Änderungen zu horchen. Rendert nichts Sichtbares.
 *
 * Der erste Effekt-Durchlauf nach dem Mount merkt sich nur den Ausgangsstand,
 * ohne eine Benachrichtigung auszulösen - andernfalls würde das beim
 * App-Start bereits vor dem ersten Render hydrierte Profil (siehe
 * `hydratePersistedState` in `persistence.ts`) fälschlich als Level-Up bzw.
 * frisch freigeschaltete Achievements erscheinen.
 */
export function GamificationNotifications() {
  const level = useAppStore((state) => state.gamification.level)
  const freigeschalteteAchievements = useAppStore(
    (state) => state.gamification.freigeschalteteAchievements,
  )
  const notificationsEnabled = useAppStore(
    (state) => state.notificationsEnabled,
  )
  const { showToast } = useToast()

  const istErsterDurchlauf = useRef(true)
  const vorherigesLevel = useRef(level)
  const bekannteAchievementIds = useRef(new Set(freigeschalteteAchievements))

  useEffect(() => {
    if (istErsterDurchlauf.current) {
      istErsterDurchlauf.current = false
      vorherigesLevel.current = level
      bekannteAchievementIds.current = new Set(freigeschalteteAchievements)
      return
    }

    const neueAchievementIds = freigeschalteteAchievements.filter(
      (id) => !bekannteAchievementIds.current.has(id),
    )

    if (notificationsEnabled) {
      if (level > vorherigesLevel.current) {
        showToast(
          `Weiter so - auf zu neuen Herausforderungen!`,
          'success',
          `Level ${level} erreicht!`,
        )
      }

      for (const achievementId of neueAchievementIds) {
        const achievement = ACHIEVEMENTS.find(
          (kandidat) => kandidat.id === achievementId,
        )
        if (!achievement) continue

        showToast(
          achievement.description,
          'success',
          `${achievement.icon} ${achievement.title}`,
        )
      }
    }

    vorherigesLevel.current = level
    bekannteAchievementIds.current = new Set(freigeschalteteAchievements)
  }, [level, freigeschalteteAchievements, notificationsEnabled, showToast])

  return null
}
