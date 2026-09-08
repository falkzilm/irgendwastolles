import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../index'

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
      streak: 0,
      letzterAktivitaetsTag: null,
      freigeschalteteAchievements: [],
      anzahlBerechnungen: 0,
      anzahlQuizRunden: 0,
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

  it('erhöht das Level, sobald genug XP gesammelt wurden', () => {
    for (let i = 0; i < 20; i++) {
      useAppStore.getState().recordEvent({ type: 'quiz_round_finished' })
    }

    expect(useAppStore.getState().gamification.xp).toBe(400)
    expect(useAppStore.getState().gamification.level).toBe(5)
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
