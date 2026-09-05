import { EngineSyntaxError } from './errors'
import type { Token } from './types'

const OPERATORS = new Set(['+', '-', '*', '/', '%', '^'])

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

/**
 * Zerlegt einen Ausdruck in Tokens (Zahlen, Operatoren, Klammern).
 * Whitespace wird übersprungen. Wirft `EngineSyntaxError` bei unbekannten
 * Zeichen oder einer ungültigen Zahl (z. B. einem einzelnen `.`).
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const char = input[i]

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      i++
      continue
    }

    if (char === '(') {
      tokens.push({ type: 'lparen', value: char, position: i })
      i++
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'rparen', value: char, position: i })
      i++
      continue
    }

    if (OPERATORS.has(char)) {
      tokens.push({ type: 'operator', value: char, position: i })
      i++
      continue
    }

    if (isDigit(char) || char === '.') {
      const start = i
      let sawDot = false
      while (i < input.length) {
        const current = input[i]
        if (isDigit(current)) {
          i++
        } else if (current === '.' && !sawDot) {
          sawDot = true
          i++
        } else {
          break
        }
      }
      const raw = input.slice(start, i)
      if (raw === '.') {
        throw new EngineSyntaxError(
          `Ungültige Zahl an Position ${start}`,
          start,
        )
      }
      tokens.push({ type: 'number', value: raw, position: start })
      continue
    }

    throw new EngineSyntaxError(
      `Unerwartetes Zeichen "${char}" an Position ${i}`,
      i,
    )
  }

  return tokens
}
