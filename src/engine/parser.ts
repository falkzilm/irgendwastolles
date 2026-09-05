import { EngineSyntaxError } from './errors'
import type { AstNode, Token } from './types'

/**
 * Baut aus Tokens einen AST nach folgender Präzedenz (niedrig zu hoch):
 * `+`/`-` (binär, linksassoziativ) < `*`/`/`/`%` (linksassoziativ)
 * < unäres `+`/`-` < `^` (rechtsassoziativ).
 *
 * Unäres Vorzeichen bindet schwächer als `^`, damit `-2^2` als `-(2^2)`
 * (also `-4`) ausgewertet wird; im Exponenten selbst ist wiederum ein
 * Vorzeichen erlaubt (`2^-2`).
 *
 * `inputLength` dient nur dazu, Fehlermeldungen für ein unerwartetes Ende
 * der Eingabe (kein weiteres Token vorhanden) eine sinnvolle Position
 * zuzuordnen.
 */
export function parse(tokens: Token[], inputLength: number): AstNode {
  let pos = 0

  function peek(): Token | undefined {
    return tokens[pos]
  }

  function parseExpression(): AstNode {
    return parseAddSub()
  }

  function parseAddSub(): AstNode {
    let node = parseMulDivMod()
    for (;;) {
      const token = peek()
      if (
        token?.type === 'operator' &&
        (token.value === '+' || token.value === '-')
      ) {
        pos++
        const right = parseMulDivMod()
        node = { type: 'binary', operator: token.value, left: node, right }
      } else {
        return node
      }
    }
  }

  function parseMulDivMod(): AstNode {
    let node = parseUnary()
    for (;;) {
      const token = peek()
      if (
        token?.type === 'operator' &&
        (token.value === '*' || token.value === '/' || token.value === '%')
      ) {
        pos++
        const right = parseUnary()
        node = { type: 'binary', operator: token.value, left: node, right }
      } else {
        return node
      }
    }
  }

  function parseUnary(): AstNode {
    const token = peek()
    if (
      token?.type === 'operator' &&
      (token.value === '+' || token.value === '-')
    ) {
      pos++
      const operand = parseUnary()
      return { type: 'unary', operator: token.value, operand }
    }
    return parsePower()
  }

  function parsePower(): AstNode {
    const base = parsePrimary()
    const token = peek()
    if (token?.type === 'operator' && token.value === '^') {
      pos++
      const exponent = parseUnary()
      return { type: 'binary', operator: '^', left: base, right: exponent }
    }
    return base
  }

  function parsePrimary(): AstNode {
    const token = peek()
    if (!token) {
      throw new EngineSyntaxError('Unerwartetes Ende der Eingabe', inputLength)
    }
    if (token.type === 'number') {
      pos++
      return { type: 'number', value: Number(token.value) }
    }
    if (token.type === 'lparen') {
      pos++
      const expression = parseExpression()
      const closing = peek()
      if (!closing || closing.type !== 'rparen') {
        throw new EngineSyntaxError(
          'Fehlende schließende Klammer',
          closing ? closing.position : inputLength,
        )
      }
      pos++
      return expression
    }
    throw new EngineSyntaxError(
      `Unerwartetes Token "${token.value}" an Position ${token.position}`,
      token.position,
    )
  }

  const result = parseExpression()
  const trailing = peek()
  if (trailing) {
    throw new EngineSyntaxError(
      `Unerwartetes Token "${trailing.value}" an Position ${trailing.position}`,
      trailing.position,
    )
  }
  return result
}
