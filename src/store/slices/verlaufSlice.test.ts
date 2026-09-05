import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'
import { MAX_VERLAUF_EINTRAEGE } from './verlaufSlice'

const initialState = useAppStore.getState()

describe('verlaufSlice', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('fügt einen Verlaufseintrag vorne an', () => {
    useAppStore.getState().addVerlaufEintrag('2+3', '5')
    useAppStore.getState().addVerlaufEintrag('4*2', '8')

    const verlauf = useAppStore.getState().verlauf
    expect(verlauf).toHaveLength(2)
    expect(verlauf[0]).toMatchObject({ expression: '4*2', result: '8' })
    expect(verlauf[1]).toMatchObject({ expression: '2+3', result: '5' })
  })

  it('begrenzt den Verlauf auf MAX_VERLAUF_EINTRAEGE Einträge', () => {
    for (let i = 0; i < MAX_VERLAUF_EINTRAEGE + 10; i++) {
      useAppStore.getState().addVerlaufEintrag(`${i}+1`, `${i + 1}`)
    }

    const verlauf = useAppStore.getState().verlauf
    expect(verlauf).toHaveLength(MAX_VERLAUF_EINTRAEGE)
    expect(verlauf[0]).toMatchObject({
      expression: `${MAX_VERLAUF_EINTRAEGE + 9}+1`,
    })
  })

  it('löscht den kompletten Verlauf mit clearVerlauf()', () => {
    useAppStore.getState().addVerlaufEintrag('2+3', '5')

    useAppStore.getState().clearVerlauf()

    expect(useAppStore.getState().verlauf).toEqual([])
  })

  it('evaluate() legt bei einer erfolgreichen Berechnung einen Verlaufseintrag an', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')

    useAppStore.getState().evaluate()

    const verlauf = useAppStore.getState().verlauf
    expect(verlauf).toHaveLength(1)
    expect(verlauf[0]).toMatchObject({ expression: '2+3', result: '5' })
  })

  it('evaluate() legt bei einem Fehler keinen Verlaufseintrag an', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')

    useAppStore.getState().evaluate()

    expect(useAppStore.getState().verlauf).toEqual([])
  })

  it('loadExpression() übernimmt einen Ausdruck aus dem Verlauf ins Display', () => {
    useAppStore.getState().input('2')
    useAppStore.getState().input('+')
    useAppStore.getState().input('3')
    useAppStore.getState().evaluate()

    useAppStore.getState().loadExpression('2+3')

    expect(useAppStore.getState().expression).toBe('2+3')
    expect(useAppStore.getState().result).toBeNull()
    expect(useAppStore.getState().error).toBeNull()
  })
})
