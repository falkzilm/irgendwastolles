import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'

const initialState = useAppStore.getState()

describe('favoritenSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('markiert eine Formel als Favorit', () => {
    useAppStore.getState().toggleFavorit('kreisflaeche')

    expect(useAppStore.getState().favoritenIds).toEqual(['kreisflaeche'])
  })

  it('entfernt eine Formel wieder aus den Favoriten', () => {
    useAppStore.getState().toggleFavorit('kreisflaeche')
    useAppStore.getState().toggleFavorit('kreisflaeche')

    expect(useAppStore.getState().favoritenIds).toEqual([])
  })

  it('verwaltet mehrere Favoriten unabhängig voneinander', () => {
    useAppStore.getState().toggleFavorit('kreisflaeche')
    useAppStore.getState().toggleFavorit('kreisumfang')
    useAppStore.getState().toggleFavorit('kreisflaeche')

    expect(useAppStore.getState().favoritenIds).toEqual(['kreisumfang'])
  })
})
