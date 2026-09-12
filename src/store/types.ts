import type { CalculatorSlice } from './slices/calculatorSlice'
import type { FavoritenSlice } from './slices/favoritenSlice'
import type { FormelNutzungSlice } from './slices/formelNutzungSlice'
import type { GamificationSlice } from './slices/gamificationSlice'
import type { QuizSlice } from './slices/quizSlice'
import type { SettingsSlice } from './slices/settingsSlice'
import type { VerlaufSlice } from './slices/verlaufSlice'

/**
 * Gesamtzustand des Stores: die Vereinigung aller Slices.
 * Neue fachliche Slices werden hier per Intersection ergänzt,
 * siehe docs/state.md.
 */
export type AppState = SettingsSlice &
  CalculatorSlice &
  VerlaufSlice &
  FavoritenSlice &
  GamificationSlice &
  QuizSlice &
  FormelNutzungSlice
