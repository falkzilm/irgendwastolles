import { create } from 'zustand'
import { createCalculatorSlice } from './slices/calculatorSlice'
import { createFavoritenSlice } from './slices/favoritenSlice'
import { createFormelNutzungSlice } from './slices/formelNutzungSlice'
import { createGamificationSlice } from './slices/gamificationSlice'
import { createQuizSlice } from './slices/quizSlice'
import { createSettingsSlice } from './slices/settingsSlice'
import { createVerlaufSlice } from './slices/verlaufSlice'
import type { AppState } from './types'

/**
 * Zentraler App-Store. Der Hook wird direkt exportiert, damit Komponenten
 * per Selektor nur die benötigten Slice-Ausschnitte abonnieren, siehe
 * docs/state.md.
 */
export const useAppStore = create<AppState>()((...args) => ({
  ...createSettingsSlice(...args),
  ...createCalculatorSlice(...args),
  ...createVerlaufSlice(...args),
  ...createFavoritenSlice(...args),
  ...createGamificationSlice(...args),
  ...createQuizSlice(...args),
  ...createFormelNutzungSlice(...args),
}))

export type { AppState } from './types'
export type { CalculatorSlice } from './slices/calculatorSlice'
export type { FavoritenSlice } from './slices/favoritenSlice'
export type { FormelNutzungSlice } from './slices/formelNutzungSlice'
export { berechneXpFortschritt } from './slices/gamificationSlice'
export type {
  GamificationEvent,
  GamificationProfile,
  GamificationSlice,
} from './slices/gamificationSlice'
export type {
  QuizErgebnis,
  QuizErgebnisInput,
  QuizSlice,
} from './slices/quizSlice'
export type {
  AngleMode,
  CalculatorMode,
  SettingsSlice,
  Theme,
} from './slices/settingsSlice'
export type { VerlaufEintrag, VerlaufSlice } from './slices/verlaufSlice'
