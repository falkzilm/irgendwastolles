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
    expect(useAppStore.getState().favoritenIds).toEqual([])
    expect(useAppStore.getState().quizErgebnisse).toEqual([])
  })

  it('übernimmt gültige, über IPC geladene Daten in den Store', async () => {
    const verlauf = [{ id: '1', expression: '2+3', result: '5', timestamp: 1 }]
    const quizErgebnisse = [
      {
        id: '1',
        difficulty: 'mittel',
        anzahlAufgaben: 10,
        anzahlRichtig: 8,
        dauerMs: 60_000,
        timestamp: 1,
      },
    ]
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf,
          favoritenIds: ['kreisflaeche'],
          quizErgebnisse,
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
    expect(useAppStore.getState().favoritenIds).toEqual(['kreisflaeche'])
    expect(useAppStore.getState().quizErgebnisse).toEqual(quizErgebnisse)
  })

  it('ignoriert geladene Daten mit ungültigen Quizergebnissen und behält die Defaults', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
          quizErgebnisse: [{ difficulty: 'unbekannt' }],
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('light')
    expect(useAppStore.getState().quizErgebnisse).toEqual([])
  })

  it('ergänzt bei alten, vor IRGENDWAST-38 persistierten Daten ohne quizErgebnisse eine leere Liste, statt die restlichen Werte zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().quizErgebnisse).toEqual([])
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

  it('ergänzt bei alten, vor IRGENDWAST-33 persistierten Daten ohne favoritenIds eine leere Favoritenliste, statt die restlichen Werte zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().calculatorMode).toBe('scientific')
    expect(useAppStore.getState().favoritenIds).toEqual([])
  })

  it('übernimmt ein gültiges, über IPC geladenes Gamification-Profil', async () => {
    const gamification = {
      xp: 45,
      level: 1,
      restXpBisNaechstesLevel: 55,
      streak: 3,
      laengsterStreak: 5,
      letzterAktivitaetsTag: '2026-03-05',
      freigeschalteteAchievements: ['erste-berechnung'],
      anzahlBerechnungen: 4,
      anzahlQuizRunden: 1,
      xpEventsHeute: { calculation_done: 4 },
    }
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
          gamification,
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().gamification).toEqual(gamification)
  })

  it('ergänzt bei alten, vor IRGENDWAST-41 persistierten Daten ohne gamification das Default-Profil, statt die restlichen Werte zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().theme).toBe('dark')
    expect(useAppStore.getState().gamification).toEqual({
      xp: 0,
      level: 1,
      restXpBisNaechstesLevel: 100,
      streak: 0,
      laengsterStreak: 0,
      letzterAktivitaetsTag: null,
      freigeschalteteAchievements: [],
      anzahlBerechnungen: 0,
      anzahlQuizRunden: 0,
      xpEventsHeute: {},
    })
  })

  it('ergänzt bei alten, vor IRGENDWAST-42 persistierten Gamification-Profilen ohne restXpBisNaechstesLevel/xpEventsHeute beide Felder, statt das Profil zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
          gamification: {
            xp: 150,
            level: 2,
            streak: 3,
            letzterAktivitaetsTag: '2026-03-05',
            freigeschalteteAchievements: [],
            anzahlBerechnungen: 10,
            anzahlQuizRunden: 2,
          },
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().gamification).toEqual({
      xp: 150,
      level: 2,
      restXpBisNaechstesLevel: 150,
      streak: 3,
      laengsterStreak: 3,
      letzterAktivitaetsTag: '2026-03-05',
      freigeschalteteAchievements: [],
      anzahlBerechnungen: 10,
      anzahlQuizRunden: 2,
      xpEventsHeute: {},
    })
  })

  it('berechnet bei alten, vor IRGENDWAST-42 persistierten Gamification-Profilen level und restXpBisNaechstesLevel aus xp neu, statt ein von der alten linearen Kurve stammendes level beizubehalten', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
          gamification: {
            // Alte lineare Kurve (100 XP/Level) hätte hier level 5 ergeben;
            // die neue progressive Kurve ergibt für xp: 400 level 3.
            xp: 400,
            level: 5,
            streak: 3,
            letzterAktivitaetsTag: '2026-03-05',
            freigeschalteteAchievements: [],
            anzahlBerechnungen: 10,
            anzahlQuizRunden: 2,
          },
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().gamification).toEqual({
      xp: 400,
      level: 3,
      restXpBisNaechstesLevel: 200,
      streak: 3,
      laengsterStreak: 3,
      letzterAktivitaetsTag: '2026-03-05',
      freigeschalteteAchievements: [],
      anzahlBerechnungen: 10,
      anzahlQuizRunden: 2,
      xpEventsHeute: {},
    })
  })

  it('ergänzt bei alten, vor IRGENDWAST-43 persistierten Gamification-Profilen ohne laengsterStreak den Wert von streak, statt das Profil zu verwerfen', async () => {
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
          gamification: {
            xp: 45,
            level: 1,
            streak: 3,
            letzterAktivitaetsTag: '2026-03-05',
            freigeschalteteAchievements: [],
            anzahlBerechnungen: 4,
            anzahlQuizRunden: 1,
          },
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().gamification.streak).toBe(3)
    expect(useAppStore.getState().gamification.laengsterStreak).toBe(3)
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

  it('kappt eine zu lange geladene Quiz-Ergebnisliste auf MAX_QUIZ_ERGEBNISSE Einträge', async () => {
    const quizErgebnisse = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`,
      difficulty: 'leicht',
      anzahlAufgaben: 10,
      anzahlRichtig: i,
      dauerMs: 1000,
      timestamp: i,
    }))
    window.api = {
      loadPersistedState: vi.fn().mockResolvedValue({
        data: {
          theme: 'dark',
          angleMode: 'rad',
          calculatorMode: 'scientific',
          verlauf: [],
          favoritenIds: [],
          quizErgebnisse,
        },
      }),
      savePersistedState: vi.fn(),
      ping: vi.fn(),
    }

    await hydratePersistedState()

    expect(useAppStore.getState().quizErgebnisse).toHaveLength(50)
    expect(useAppStore.getState().quizErgebnisse).toEqual(
      quizErgebnisse.slice(0, 50),
    )
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
