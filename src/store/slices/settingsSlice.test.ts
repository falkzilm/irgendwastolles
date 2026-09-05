import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'

const initialState = useAppStore.getState()

describe('settingsSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('setzt und liest das Theme', () => {
    expect(useAppStore.getState().theme).toBe('light')

    useAppStore.getState().setTheme('dark')

    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('wechselt das Theme per toggleTheme', () => {
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe('dark')

    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe('light')
  })

  it('setzt und liest den Winkelmodus', () => {
    expect(useAppStore.getState().angleMode).toBe('deg')

    useAppStore.getState().setAngleMode('rad')

    expect(useAppStore.getState().angleMode).toBe('rad')
  })

  it('setzt und liest den Rechner-Modus', () => {
    expect(useAppStore.getState().calculatorMode).toBe('simple')

    useAppStore.getState().setCalculatorMode('scientific')

    expect(useAppStore.getState().calculatorMode).toBe('scientific')
  })

  it('wechselt den Rechner-Modus per toggleCalculatorMode', () => {
    useAppStore.getState().toggleCalculatorMode()
    expect(useAppStore.getState().calculatorMode).toBe('scientific')

    useAppStore.getState().toggleCalculatorMode()
    expect(useAppStore.getState().calculatorMode).toBe('simple')
  })
})
