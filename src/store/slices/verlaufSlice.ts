import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

/** Siehe docs/state.md - IRGENDWAST-26. */
export const MAX_VERLAUF_EINTRAEGE = 100

export interface VerlaufEintrag {
  id: string
  expression: string
  result: string
  timestamp: number
}

export interface VerlaufSlice {
  verlauf: VerlaufEintrag[]
  /** Fügt einen neuen Eintrag vorne an und kappt bei `MAX_VERLAUF_EINTRAEGE`. */
  addVerlaufEintrag: (expression: string, result: string) => void
  clearVerlauf: () => void
}

export const createVerlaufSlice: StateCreator<
  AppState,
  [],
  [],
  VerlaufSlice
> = (set) => ({
  verlauf: [],

  addVerlaufEintrag: (expression, result) =>
    set((state) => ({
      verlauf: [
        { id: crypto.randomUUID(), expression, result, timestamp: Date.now() },
        ...state.verlauf,
      ].slice(0, MAX_VERLAUF_EINTRAEGE),
    })),

  clearVerlauf: () => set({ verlauf: [] }),
})
