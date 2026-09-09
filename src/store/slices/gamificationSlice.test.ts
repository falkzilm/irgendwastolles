import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../index'

const initialState = useAppStore.getState()

describe('gamificationSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('startet mit den definierten Defaults', () => {
    expect(useAppStore.getState().gamification).toEqual({
      xp: 0,
      level: 1,
      streak: 0,
      laengsterStreak: 0,
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

  it('schaltet eine Achievement frei, sobald ihre Bedingung erfüllt ist', () => {
    useAppStore.getState().recordEvent({ type: 'calculation_done' })

    expect(
      useAppStore.getState().gamification.freigeschalteteAchievements,
    ).toContain('erste-berechnung')
  })

  it('löst dieselbe Achievement bei wiederholten Events nicht erneut aus', () => {
    for (let i = 0; i < 5; i++) {
      useAppStore.getState().recordEvent({ type: 'calculation_done' })
    }

    const { freigeschalteteAchievements } = useAppStore.getState().gamification
    expect(
      freigeschalteteAchievements.filter((id) => id === 'erste-berechnung'),
    ).toEqual(['erste-berechnung'])
  })

  it('schaltet mehrere gleichzeitig erfüllte Achievements in einem Event frei', () => {
    for (let i = 0; i < 100; i++) {
      useAppStore.getState().recordEvent({ type: 'calculation_done' })
    }

    const { freigeschalteteAchievements } = useAppStore.getState().gamification
    expect(freigeschalteteAchievements).toContain('erste-berechnung')
    expect(freigeschalteteAchievements).toContain('hundert-berechnungen')
    expect(new Set(freigeschalteteAchievements).size).toBe(
      freigeschalteteAchievements.length,
    )
  })

  it('speichert den längsten je erreichten Streak separat und lässt ihn nach einem Aussetzer unverändert', () => {
    const { recordEvent } = useAppStore.getState()
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-05T10:00:00'))
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-06T10:00:00'))
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-07T10:00:00'))

    expect(useAppStore.getState().gamification.streak).toBe(3)
    expect(useAppStore.getState().gamification.laengsterStreak).toBe(3)

    // Aussetzer: der Streak wird zurückgesetzt, der Bestwert bleibt erhalten.
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-10T10:00:00'))

    expect(useAppStore.getState().gamification.streak).toBe(1)
    expect(useAppStore.getState().gamification.laengsterStreak).toBe(3)
  })

  it('bewertet den Tageswechsel anhand des lokalen Kalendertags, nicht des UTC-Tags', () => {
    vi.stubEnv('TZ', 'Pacific/Kiritimati') // UTC+14

    const { recordEvent } = useAppStore.getState()
    // 23:30 UTC am 05.03. ist in UTC+14 bereits 13:30 lokal am 06.03.
    recordEvent(
      { type: 'calculation_done' },
      new Date('2026-03-05T23:30:00.000Z'),
    )

    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-06',
    )
  })

  it('bleibt bei einem Zeitzonenwechsel zwischen zwei Events robust, solange die injizierte Zeit denselben lokalen Folgetag trifft', () => {
    const { recordEvent } = useAppStore.getState()

    vi.stubEnv('TZ', 'Europe/Berlin')
    recordEvent(
      { type: 'calculation_done' },
      new Date('2026-03-05T22:00:00.000Z'), // 23:00 MEZ, lokal 05.03.
    )
    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-05',
    )

    // Nutzer reist in eine andere Zeitzone; derselbe UTC-Zeitpunkt würde in
    // Europe/Berlin einem anderen Kalendertag entsprechen. Trotzdem soll
    // der zweite Event im injizierten Zonenkontext als Folgetag zählen.
    vi.stubEnv('TZ', 'Pacific/Auckland')
    recordEvent(
      { type: 'calculation_done' },
      new Date('2026-03-06T09:00:00.000Z'), // lokal 06.03. in Auckland
    )

    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-06',
    )
    expect(useAppStore.getState().gamification.streak).toBe(2)
  })

  it('ignoriert für Streak und Aktivitätstag einen lokalen Tag, der vor dem gespeicherten Aktivitätstag liegt', () => {
    const { recordEvent } = useAppStore.getState()

    // Event am 06.03.
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-06T10:00:00'))
    expect(useAppStore.getState().gamification.streak).toBe(1)
    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-06',
    )

    // Zeitzonen-/Uhrsprung rückwärts auf den 05.03.: darf den bereits
    // gezählten 06.03. weder überschreiben noch den Streak verändern.
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-05T10:00:00'))
    expect(useAppStore.getState().gamification.streak).toBe(1)
    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-06',
    )

    // Rückkehr zum 06.03.: darf, weil dieser Tag schon gezählt wurde, nicht
    // erneut als Folgetag gewertet werden.
    recordEvent({ type: 'calculation_done' }, new Date('2026-03-06T18:00:00'))
    expect(useAppStore.getState().gamification.streak).toBe(1)
    expect(useAppStore.getState().gamification.letzterAktivitaetsTag).toBe(
      '2026-03-06',
    )
  })
})
