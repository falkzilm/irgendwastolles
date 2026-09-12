import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

export type Theme = 'light' | 'dark'
export type AngleMode = 'deg' | 'rad'
export type CalculatorMode = 'simple' | 'scientific'

export interface SettingsSlice {
  theme: Theme
  angleMode: AngleMode
  calculatorMode: CalculatorMode
  /** Ob Gamification-Benachrichtigungen (Level-Up, Achievement-Unlock) angezeigt werden (IRGENDWAST-46). */
  notificationsEnabled: boolean
  /** Ob das Fortschritts-HUD (Level, XP-Balken, Streak) in der Shell angezeigt wird (IRGENDWAST-47). */
  hudEnabled: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setAngleMode: (mode: AngleMode) => void
  setCalculatorMode: (mode: CalculatorMode) => void
  toggleCalculatorMode: () => void
  setNotificationsEnabled: (enabled: boolean) => void
  setHudEnabled: (enabled: boolean) => void
}

export const createSettingsSlice: StateCreator<
  AppState,
  [],
  [],
  SettingsSlice
> = (set) => ({
  theme: 'light',
  angleMode: 'deg',
  calculatorMode: 'simple',
  notificationsEnabled: true,
  hudEnabled: true,
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setAngleMode: (angleMode) => set({ angleMode }),
  setCalculatorMode: (calculatorMode) => set({ calculatorMode }),
  toggleCalculatorMode: () =>
    set((state) => ({
      calculatorMode:
        state.calculatorMode === 'simple' ? 'scientific' : 'simple',
    })),
  setNotificationsEnabled: (notificationsEnabled) =>
    set({ notificationsEnabled }),
  setHudEnabled: (hudEnabled) => set({ hudEnabled }),
})
