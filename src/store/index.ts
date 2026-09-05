import { create } from 'zustand'
import { createCalculatorSlice } from './slices/calculatorSlice'
import { createSettingsSlice } from './slices/settingsSlice'
import type { AppState } from './types'

/**
 * Zentraler App-Store. Der Hook wird direkt exportiert, damit Komponenten
 * per Selektor nur die benötigten Slice-Ausschnitte abonnieren, siehe
 * docs/state.md.
 */
export const useAppStore = create<AppState>()((...args) => ({
  ...createSettingsSlice(...args),
  ...createCalculatorSlice(...args),
}))

export type { AppState } from './types'
export type { CalculatorSlice } from './slices/calculatorSlice'
export type {
  AngleMode,
  CalculatorMode,
  SettingsSlice,
  Theme,
} from './slices/settingsSlice'
