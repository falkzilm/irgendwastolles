import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../index'
import { berechneLevelStand } from './gamificationSlice'

const initialState = useAppStore.getState()

describe('gamificationSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('startet mit den definierten Defaults', () => {
    expect(useAppStore.getState().gamification).toEqual({
      xp: 0,
      level: 1,
      restXpBisNaechstesLevel: 100,
      streak: 0,
      letzterAktivitaetsTag: null,
      freigeschalteteAchievements: [],
      anzahlBerechnungen: 0,
      anzahlQuizRunden: 0,
      xpEventsHeute: {},
    })
  })

  it('schreibt XP und den Berechnungs-Zähler bei calculation_done fort', () => {
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    const { gamification } = useAppStore.getState()
    expect(gamification.xp).toBe(5)
    expect(gamification.anzahlBerechnungen).toBe(1)
    expect(gamification.anzahlQuizRunden).toBe(0)
  })

  it('schreibt XP und den Quizrunden-Zähler bei quiz_round_finished fort', () => {
    useAppStore.getState().recordEvent({ type: 'quiz_round_finished' })

    const { gamification } = useAppStore.getState()
    expect(gamification.xp).toBe(20)
    expect(gamification.anzahlQuizRunden).toBe(1)
    expect(gamification.anzahlBerechnungen).toBe(0)
  })

  describe('Level-Kurve', () => {
    it('berechnet Level und Rest-XP deterministisch aus dem XP-Gesamtwert', () => {
      expect(berechneLevelStand(0)).toEqual({
        level: 1,
        restXpBisNaechstesLevel: 100,
      })
      expect(berechneLevelStand(99)).toEqual({
        level: 1,
        restXpBisNaechstesLevel: 1,
      })
      expect(berechneLevelStand(100)).toEqual({
        level: 2,
        restXpBisNaechstesLevel: 200,
      })
      expect(berechneLevelStand(299)).toEqual({
        level: 2,
        restXpBisNaechstesLevel: 1,
      })
      expect(berechneLevelStand(300)).toEqual({
        level: 3,
        restXpBisNaechstesLevel: 300,
      })
    })

    it('macht die Kurve progressiv: jedes Level braucht mehr XP als das vorherige', () => {
      const xpFuerLevel2 =
        berechneLevelStand(99).restXpBisNaechstesLevel + 99 - 0
      const xpFuerLevel3 =
        berechneLevelStand(299).restXpBisNaechstesLevel + 299 - 100
      expect(xpFuerLevel3).toBeGreaterThan(xpFuerLevel2)
    })

    it('erhöht das Level entlang der progressiven Kurve, sobald genug XP gesammelt wurden', () => {
      for (let i = 0; i < 20; i++) {
        useAppStore.getState().recordEvent({ type: 'quiz_round_finished' })
      }

      const { gamification } = useAppStore.getState()
      expect(gamification.xp).toBe(400)
      expect(gamification.level).toBe(3)
      expect(gamification.restXpBisNaechstesLevel).toBe(200)
    })

    it('meldet ein Level-Up als Ergebnis von recordEvent zurück', () => {
      // Level 1 -> 2 braucht 100 XP, ein quiz_round_finished bringt 20 XP.
      for (let i = 0; i < 4; i++) {
        const ergebnis = useAppStore
          .getState()
          .recordEvent({ type: 'quiz_round_finished' })
        expect(ergebnis.levelUp).toBe(false)
      }

      const ergebnis = useAppStore
        .getState()
        .recordEvent({ type: 'quiz_round_finished' })
      expect(ergebnis.levelUp).toBe(true)
      expect(ergebnis.level).toBe(2)
    })
  })

  describe('Deckelung gegen Punktefarming', () => {
    it('vergibt für ein triviales Event ab dem Tages-Limit keine weitere XP', () => {
      for (let i = 0; i < 25; i++) {
        useAppStore.getState().recordEvent({ type: 'calculation_done' })
      }

      const { gamification } = useAppStore.getState()
      expect(gamification.anzahlBerechnungen).toBe(25)
      expect(gamification.xp).toBe(20 * 5)
    })

    it('setzt das Tages-Limit am Folgetag zurück', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-05T10:00:00.000Z'))
      for (let i = 0; i < 20; i++) {
        useAppStore.getState().recordEvent({ type: 'calculation_done' })
      }
      expect(useAppStore.getState().gamification.xp).toBe(20 * 5)

      vi.setSystemTime(new Date('2026-03-06T09:00:00.000Z'))
      useAppStore.getState().recordEvent({ type: 'calculation_done' })

      expect(useAppStore.getState().gamification.xp).toBe(20 * 5 + 5)
    })

    it('deckelt Quizrunden nicht, da sie keine trivialen Wiederholereignisse sind', () => {
      for (let i = 0; i < 25; i++) {
        useAppStore.getState().recordEvent({ type: 'quiz_round_finished' })
      }

      expect(useAppStore.getState().gamification.xp).toBe(25 * 20)
    })
  })

  it('startet den Streak bei 1 mit dem ersten Event des Tages', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T10:00:00.000Z'))

    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    expect(useAppStore.getState().gamification.streak).toBe(1)
    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-05',
    )
  })

  it('lässt den Streak bei weiteren Events am selben Tag unverändert', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T10:00:00.000Z'))
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    vi.setSystemTime(new Date('2026-03-05T18:00:00.000Z'))
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    expect(useAppStore.getState().gamification.streak).toBe(1)
  })

  it('erhöht den Streak bei einem Event am Folgetag', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T10:00:00.000Z'))
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    vi.setSystemTime(new Date('2026-03-06T09:00:00.000Z'))
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    expect(useAppStore.getState().gamification.streak).toBe(2)
  })

  it('setzt den Streak zurück, wenn ein Tag ausgelassen wurde', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T10:00:00.000Z'))
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    vi.setSystemTime(new Date('2026-03-08T09:00:00.000Z'))
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    expect(useAppStore.getState().gamification.streak).toBe(1)
  })
})
