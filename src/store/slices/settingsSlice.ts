import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

export type Theme = 'light' | 'dark'
export type AngleMode = 'deg' | 'rad'
export type CalculatorMode = 'simple' | 'scientific'

export interface SettingsSlice {
  theme: Theme
  angleMode: AngleMode
  calculatorMode: CalculatorMode
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setAngleMode: (mode: AngleMode) => void
  setCalculatorMode: (mode: CalculatorMode) => void
  toggleCalculatorMode: () => void
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
})
