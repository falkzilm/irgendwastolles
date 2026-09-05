import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './index'
import {
  hydratePersistedState,
  selectPersistableState,
  subscribeToPersistState,
} from './persistence'

const initialState = useAppStore.getState()

describe('store persistence', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  afterEach(() => {
    // @ts-expect-error - window.api existiert nur in Electron, siehe electron-api.d.ts
    delete window.api
  })

  it('übernimmt ohne window.api (reiner Browser) keine Daten und bleibt bei den Defaults', async () => {
    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('light')
    expect(useAppStore.getState().angleMode).toBe('deg')
  })

  it('übernimmt gültige, über IPC geladene Daten in den Store', async () => {
    window.api = {
      loadPersistedState: vi
        .fn()
        .mockResolvedValue({ data: { theme: 'dark', angleMode: 'rad' } }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().angleMode).toBe('rad')
  })

  it('ignoriert ungültige geladene Daten und behält die Defaults', async () => {
    window.api = {
      loadPersistedState: vi
        .fn()
        .mockResolvedValue({ data: { theme: 'not-a-theme' } }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('light')
  })

  it('speichert Store-Änderungen über window.api.savePersistedState', () => {
    const savePersistedState = vi.fn()
    window.api = {
      loadPersistedState: vi.fn(),
      savePersistedState,
      ping: vi.fn(),
    }

    const unsubscribe = subscribeToPersistState()
    useAppStore.getState().setTheme('dark')

    expect(savePersistedState).toHaveBeenCalledWith({
      data: selectPersistableState(useAppStore.getState()),
    })

    unsubscribe()
  })
})
