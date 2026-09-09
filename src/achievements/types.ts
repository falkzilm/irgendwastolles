import type { GamificationProfile } from '../store/slices/gamificationSlice'

/**
 * Eine deklarativ definierte Achievement. Bedingung und Fortschritt sind
 * dieselbe Kennzahl (`fortschritt(profil) >= ziel`), damit z. B. "42/100"
 * (siehe `ermittleFortschritt` in `evaluate.ts`) und das Freischalten immer
 * konsistent zueinander sind.
 */
export interface Achievement {
  id: string
  title: string
  description: string
  /** Icon-Referenz (Emoji-Platzhalter), austauschbar gegen ein Icon-Asset. */
  icon: string
  /** Zielwert der Kennzahl aus `fortschritt`, ab dem die Achievement gilt. */
  ziel: number
  /** Liest die für diese Achievement relevante Kennzahl aus dem Profil. */
  fortschritt: (profil: GamificationProfile) => number
}
