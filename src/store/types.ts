import type { CalculatorSlice } from './slices/calculatorSlice'
import type { SettingsSlice } from './slices/settingsSlice'
import type { VerlaufSlice } from './slices/verlaufSlice'

/**
 * Gesamtzustand des Stores: die Vereinigung aller Slices.
 * Neue fachliche Slices werden hier per Intersection ergänzt,
 * siehe docs/state.md.
 */
export type AppState = SettingsSlice & CalculatorSlice & VerlaufSlice
