import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'

const initialState = useAppStore.getState()

describe('formelNutzungSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('zählt die erste Nutzung einer Formel auf 1', () => {
    useAppStore.getState().recordFormelNutzung('kreisflaeche')

    expect(useAppStore.getState().formelNutzung).toEqual({ kreisflaeche: 1 })
  })

  it('zählt wiederholte Nutzung derselben Formel hoch', () => {
    useAppStore.getState().recordFormelNutzung('kreisflaeche')
    useAppStore.getState().recordFormelNutzung('kreisflaeche')
    useAppStore.getState().recordFormelNutzung('kreisflaeche')

    expect(useAppStore.getState().formelNutzung).toEqual({ kreisflaeche: 3 })
  })

  it('zählt mehrere Formeln unabhängig voneinander', () => {
    useAppStore.getState().recordFormelNutzung('kreisflaeche')
    useAppStore.getState().recordFormelNutzung('kreisumfang')
    useAppStore.getState().recordFormelNutzung('kreisflaeche')

    expect(useAppStore.getState().formelNutzung).toEqual({
      kreisflaeche: 2,
      kreisumfang: 1,
    })
  })
})
