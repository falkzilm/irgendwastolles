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
    expect(useAppStore.getState().calculatorMode).toBe('simple')
    expect(useAppStore.getState().verlauf).toEqual([])
  })

  it('übernimmt gültige, über IPC geladene Daten in den Store', async () => {
    const verlauf = [{ id: '1', expression: '2+3', result: '5', timestamp: 1 }]
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf,
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().angleMode).toBe('rad')
    expect(useAppStore.getState().calculatorMode).toBe('scientific')
    expect(useAppStore.getState().verlauf).toEqual(verlauf)
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

  it('ignoriert geladene Daten mit ungültigem Verlauf und behält die Defaults', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          verlauf: [{ expression: '2+3' }],
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('light')
    expect(useAppStore.getState().verlauf).toEqual([])
  })

  it('ergänzt bei alten, vor IRGENDWAST-26 persistierten Daten ohne Verlauf einen leeren Verlauf, statt die restlichen Werte zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: { theme: 'dark', angleMode: 'rad', calculatorMode: 'scientific' },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().angleMode).toBe('rad')
    expect(useAppStore.getState().calculatorMode).toBe('scientific')
    expect(useAppStore.getState().verlauf).toEqual([])
  })

  it('ergänzt bei alten, vor IRGENDWAST-25 persistierten Daten ohne calculatorMode den Default "simple", statt theme/angleMode zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: { theme: 'dark', angleMode: 'rad' },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().angleMode).toBe('rad')
    expect(useAppStore.getState().calculatorMode).toBe('simple')
    expect(useAppStore.getState().verlauf).toEqual([])
  })

  it('kappt einen zu langen geladenen Verlauf auf MAX_VERLAUF_EINTRAEGE Einträge', async () => {
    const verlauf = Array.from({ length: 110 }, (_, i) => ({
      id: `${i}`,
      expression: `${i}+1`,
      result: `${i + 1}`,
      timestamp: i,
    }))
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf,
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().verlauf).toHaveLength(100)
    expect(useAppStore.getState().verlauf).toEqual(verlauf.slice(0, 100))
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
