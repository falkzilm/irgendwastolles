import { EngineSyntaxError } from './errors'
import type { Token } from './types'

const OPERATORS = new Set(['+', '-', '*', '/', '%', '^'])

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

function isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

/**
 * Zerlegt einen Ausdruck in Tokens (Zahlen, Operatoren, Klammern, Bezeichner
 * für Funktionen/Konstanten wie `sin`/`pi`). Whitespace wird übersprungen.
 * Wirft `EngineSyntaxError` bei unbekannten Zeichen oder einer ungültigen
 * Zahl (z. B. einem einzelnen `.`). Ob ein Bezeichner eine bekannte Funktion
 * oder Konstante ist, prüft nicht der Tokenizer, sondern Parser/Evaluator.
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

    if (isAlpha(char)) {
      const start = i
      while (i < input.length && isAlpha(input[i])) {
        i++
      }
      tokens.push({
        type: 'identifier',
        value: input.slice(start, i),
        position: start,
      })
      continue
    }

    throw new EngineSyntaxError(
      `Unerwartetes Zeichen "${char}" an Position ${i}`,
      i,
    )
  }

  return tokens
}
