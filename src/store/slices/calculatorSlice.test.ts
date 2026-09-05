import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'

const initialState = useAppStore.getState()

describe('calculatorSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('hängt Eingaben an den Ausdruck an', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')

    expect(useAppStore.getState().expression).toBe('2+3')
  })

  it('berechnet das Ergebnis eines gültigen Ausdrucks mit evaluate()', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')

    useAppStore.getState().evaluate()

    expect(useAppStore.getState().result).toBe('5')
    expect(useAppStore.getState().error).toBeNull()
  })

  it('zeigt eine lesbare Fehlermeldung bei einem ungültigen Ausdruck', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')

    useAppStore.getState().evaluate()

    expect(useAppStore.getState().error).toBeTruthy()
    expect(useAppStore.getState().result).toBeNull()
    expect(useAppStore.getState().expression).toBe('2+')
  })

  it('leert Ausdruck, Ergebnis und Fehler mit clear()', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().evaluate()

    useAppStore.getState().clear()

    expect(useAppStore.getState().expression).toBe('')
    expect(useAppStore.getState().result).toBeNull()
    expect(useAppStore.getState().error).toBeNull()
  })

  it('entfernt mit backspace() genau ein Zeichen', () => {
    useAppStore.getState().input('1')
    useAppStore.getState().input('2')
    useAppStore.getState().input('3')

    useAppStore.getState().backspace()

    expect(useAppStore.getState().expression).toBe('12')
  })

  it('räumt nach einem Fehler den Fehler beim nächsten Input aus', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().evaluate()
    expect(useAppStore.getState().error).toBeTruthy()

    useAppStore.getState().input('3')

    expect(useAppStore.getState().error).toBeNull()
    expect(useAppStore.getState().expression).toBe('2+3')
  })

  it('startet nach = eine neue Zahl statt sie ans Ergebnis anzuhängen', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')
    useAppStore.getState().evaluate()
    expect(useAppStore.getState().result).toBe('5')

    useAppStore.getState().input('7')

    expect(useAppStore.getState().expression).toBe('7')
    expect(useAppStore.getState().result).toBeNull()
  })

  it('rechnet nach = bei einem Operator mit dem vorigen Ergebnis weiter', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')
    useAppStore.getState().evaluate()
    expect(useAppStore.getState().result).toBe('5')

    useAppStore.getState().input('*')
    useAppStore.getState().input('2')
    useAppStore.getState().evaluate()

    expect(useAppStore.getState().expression).toBe('5*2')
    expect(useAppStore.getState().result).toBe('10')
  })

  it('wertet trigonometrische Funktionen abhängig vom Winkelmodus aus', () => {
    useAppStore.getState().setAngleMode('deg')
    useAppStore.getState().input('sin(90)')
    useAppStore.getState().evaluate()
    expect(useAppStore.getState().result).toBe('1')

    useAppStore.getState().clear()
    useAppStore.getState().setAngleMode('rad')
    useAppStore.getState().input('sin(90)')
    useAppStore.getState().evaluate()
    expect(useAppStore.getState().result).toBe('0.893996663601')
  })

  it('backspace() nach = beginnt eine leere neue Eingabe', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')
    useAppStore.getState().evaluate()

    useAppStore.getState().backspace()

    expect(useAppStore.getState().expression).toBe('')
    expect(useAppStore.getState().result).toBeNull()
  })
})
