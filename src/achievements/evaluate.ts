import type { GamificationProfile } from '../store/slices/gamificationSlice'
import { ACHIEVEMENTS } from './definitions'
import type { Achievement } from './types'

/**
 * Fortschritt einer einzelnen Achievement, z. B. für eine Anzeige wie
 * "42/100". `aktuell` ist auf `ziel` gedeckelt, damit Kennzahlen, die über
 * das Ziel hinauswachsen (z. B. `anzahlBerechnungen` nach dem Freischalten),
 * keine Werte über 100 % anzeigen.
 */
export interface AchievementFortschritt {
  achievement: Achievement
  aktuell: number
  ziel: number
  erreicht: boolean
}

/** Liefert den Fortschritt zu jeder Achievement aus `ACHIEVEMENTS`. */
export function ermittleFortschritt(
  profil: GamificationProfile,
): AchievementFortschritt[] {
  return ACHIEVEMENTS.map((achievement) => {
    const aktuell = achievement.fortschritt(profil)
    return {
      achievement,
      aktuell: Math.min(aktuell, achievement.ziel),
      ziel: achievement.ziel,
      erreicht: aktuell >= achievement.ziel,
    }
  })
}

/**
 * Reine Auswertungsfunktion (IRGENDWAST-44): ermittelt aus dem Profil - dem
 * Ergebnis eines über `recordEvent` (siehe `gamificationSlice.ts`)
 * verarbeiteten Events - welche Achievements dadurch neu freigeschaltet
 * werden. Bereits in `profil.freigeschalteteAchievements` enthaltene ids
 * werden nicht erneut geliefert, jede erfüllte Bedingung liefert also genau
 * einmal ein Unlock-Ergebnis. Der Aufrufer trägt die ids der Rückgabe
 * anschließend in `freigeschalteteAchievements` ein.
 */
export function ermittleNeueAchievements(
  profil: GamificationProfile,
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (achievement) =>
      !profil.freigeschalteteAchievements.includes(achievement.id) &&
      achievement.fortschritt(profil) >= achievement.ziel,
  )
}
