import { describe, expect, it } from 'vitest'
import {
  erstelleDefaultGamificationProfil,
  type GamificationProfile,
} from '../store/slices/gamificationSlice'
import { ermittleFortschritt, ermittleNeueAchievements } from './evaluate'

function profil(overrides: Partial<GamificationProfile>): GamificationProfile {
  return { ...erstelleDefaultGamificationProfil(), ...overrides }
}

describe('ermittleNeueAchievements', () => {
  it('liefert keine Achievement, solange keine Bedingung erfüllt ist', () => {
    expect(ermittleNeueAchievements(profil({}))).toEqual([])
  })

  it('liefert eine erfüllte Achievement genau einmal', () => {
    const neue = ermittleNeueAchievements(profil({ anzahlBerechnungen: 1 }))

    expect(neue.map((achievement) => achievement.id)).toEqual([
      'erste-berechnung',
    ])
  })

  it('liefert mehrere gleichzeitig erfüllte Achievements', () => {
    const neue = ermittleNeueAchievements(
      profil({ anzahlBerechnungen: 100, xp: 500 }),
    )

    const ids = neue.map((achievement) => achievement.id)
    expect(ids).toContain('erste-berechnung')
    expect(ids).toContain('hundert-berechnungen')
    expect(ids).toContain('xp-500')
  })

  it('löst bereits freigeschaltete Achievements nicht erneut aus', () => {
    const neue = ermittleNeueAchievements(
      profil({
        anzahlBerechnungen: 1,
        freigeschalteteAchievements: ['erste-berechnung'],
      }),
    )

    expect(neue).toEqual([])
  })

  it('ist rein funktional: identischer Aufruf liefert dasselbe Ergebnis, ohne das Profil zu verändern', () => {
    const eingabe = profil({ anzahlBerechnungen: 1 })
    const kopie = { ...eingabe }

    const erstesErgebnis = ermittleNeueAchievements(eingabe)
    const zweitesErgebnis = ermittleNeueAchievements(eingabe)

    expect(erstesErgebnis).toEqual(zweitesErgebnis)
    expect(eingabe).toEqual(kopie)
  })
})

describe('ermittleFortschritt', () => {
  it('liefert aktuellen Stand und Ziel je Achievement, z. B. 42/100', () => {
    const fortschritt = ermittleFortschritt(profil({ anzahlBerechnungen: 42 }))

    const hundertBerechnungen = fortschritt.find(
      (eintrag) => eintrag.achievement.id === 'hundert-berechnungen',
    )
    expect(hundertBerechnungen).toMatchObject({
      aktuell: 42,
      ziel: 100,
      erreicht: false,
    })
  })

  it('markiert eine erreichte Achievement als erreicht', () => {
    const fortschritt = ermittleFortschritt(profil({ anzahlBerechnungen: 100 }))

    const hundertBerechnungen = fortschritt.find(
      (eintrag) => eintrag.achievement.id === 'hundert-berechnungen',
    )
    expect(hundertBerechnungen).toMatchObject({
      aktuell: 100,
      ziel: 100,
      erreicht: true,
    })
  })

  it('deckelt den aktuellen Fortschritt auf das Ziel', () => {
    const fortschritt = ermittleFortschritt(profil({ anzahlBerechnungen: 150 }))

    const hundertBerechnungen = fortschritt.find(
      (eintrag) => eintrag.achievement.id === 'hundert-berechnungen',
    )
    expect(hundertBerechnungen?.aktuell).toBe(100)
  })
})
