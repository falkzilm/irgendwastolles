import type { SettingsSlice } from './slices/settingsSlice'

/**
 * Gesamtzustand des Stores: die Vereinigung aller Slices.
 * Neue fachliche Slices werden hier per Intersection ergänzt,
 * siehe docs/state.md.
 */
export type AppState = SettingsSlice
