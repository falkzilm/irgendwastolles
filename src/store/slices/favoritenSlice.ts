import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

/** Siehe docs/state.md - IRGENDWAST-33. */
export interface FavoritenSlice {
  favoritenIds: string[]
  toggleFavorit: (formulaId: string) => void
}

export const createFavoritenSlice: StateCreator<
  AppState,
  [],
  [],
  FavoritenSlice
> = (set) => ({
  favoritenIds: [],

  toggleFavorit: (formulaId) =>
    set((state) => ({
      favoritenIds: state.favoritenIds.includes(formulaId)
        ? state.favoritenIds.filter((id) => id !== formulaId)
        : [...state.favoritenIds, formulaId],
    })),
})
