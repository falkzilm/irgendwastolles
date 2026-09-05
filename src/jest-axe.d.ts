import 'vitest'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- must match Vitest's own `Assertion<T = any>` signature for declaration merging
  interface Assertion<T = any> {
    toHaveNoViolations(): void
  }
}
