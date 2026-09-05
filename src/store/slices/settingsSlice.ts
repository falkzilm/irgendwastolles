import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

export type Theme = 'light' | 'dark'
export type AngleMode = 'deg' | 'rad'

export interface SettingsSlice {
  theme: Theme
  angleMode: AngleMode
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setAngleMode: (mode: AngleMode) => void
}

export const createSettingsSlice: StateCreator<
  AppState,
  [],
  [],
  SettingsSlice
> = (set) => ({
  theme: 'light',
  angleMode: 'deg',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setAngleMode: (angleMode) => set({ angleMode }),
})
