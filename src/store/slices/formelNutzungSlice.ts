import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

/**
 * Nutzungszähler je Formel-id aus `FORMULA_CATALOG` (siehe
 * [formulas.md](../../../docs/formulas.md)). Grundlage der "meistgenutzten
 * Formeln" im Statistik-Dashboard (IRGENDWAST-49).
 */
export interface FormelNutzungSlice {
  formelNutzung: Record<string, number>
  /** Zählt eine Nutzung der Formel mit der übergebenen id um eins hoch. */
  recordFormelNutzung: (formulaId: string) => void
}

export const createFormelNutzungSlice: StateCreator<
  AppState,
  [],
  [],
  FormelNutzungSlice
> = (set) => ({
  formelNutzung: {},

  recordFormelNutzung: (formulaId) =>
    set((state) => ({
      formelNutzung: {
        ...state.formelNutzung,
        [formulaId]: (state.formelNutzung[formulaId] ?? 0) + 1,
      },
    })),
})
