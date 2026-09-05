import { describe, expect, it } from 'vitest'
import { EngineSyntaxError } from './errors'
import { tokenize } from './tokenizer'

describe('tokenize', () => {
  it('zerlegt Zahlen, Operatoren und Klammern', () => {
    expect(tokenize('2+3*4')).toEqual([
      { type: 'number', value: '2', position: 0 },
      { type: 'operator', value: '+', position: 1 },
      { type: 'number', value: '3', position: 2 },
      { type: 'operator', value: '*', position: 3 },
      { type: 'number', value: '4', position: 4 },
    ])
  })

  it('überspringt Whitespace', () => {
    expect(tokenize(' 2 + 3 ')).toEqual([
      { type: 'number', value: '2', position: 1 },
      { type: 'operator', value: '+', position: 3 },
      { type: 'number', value: '3', position: 5 },
    ])
  })

  it('erkennt Dezimalzahlen', () => {
    expect(tokenize('2.5')).toEqual([
      { type: 'number', value: '2.5', position: 0 },
    ])
  })

  it('erkennt Klammern', () => {
    expect(tokenize('(1)')).toEqual([
      { type: 'lparen', value: '(', position: 0 },
      { type: 'number', value: '1', position: 1 },
      { type: 'rparen', value: ')', position: 2 },
    ])
  })

  it('wirft bei unbekannten Zeichen einen EngineSyntaxError', () => {
    expect(() => tokenize('2+x')).toThrow(EngineSyntaxError)
  })

  it('wirft bei einem einzelnen Punkt einen EngineSyntaxError', () => {
    expect(() => tokenize('1+.')).toThrow(EngineSyntaxError)
  })
})
