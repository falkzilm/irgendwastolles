import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from './definitions'

describe('ACHIEVEMENTS', () => {
  it('enthält mindestens 12 Achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(12)
  })

  it('hat ausschließlich eindeutige ids', () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(ACHIEVEMENTS.map((achievement) => ({ achievement })))(
    '$achievement.id: hat Titel, Beschreibung, Icon und ein positives Ziel',
    ({ achievement }) => {
      expect(achievement.title.trim()).not.toBe('')
      expect(achievement.description.trim()).not.toBe('')
      expect(achievement.icon.trim()).not.toBe('')
      expect(achievement.ziel).toBeGreaterThan(0)
      expect(typeof achievement.fortschritt).toBe('function')
    },
  )
})
