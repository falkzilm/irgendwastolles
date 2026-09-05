/**
 * Reine, von der Electron-Runtime entkoppelte Bausteine der in docs/security.md
 * dokumentierten Härtungsmaßnahmen. Die Trennung von `main.ts` erlaubt es,
 * das tatsächliche Verhalten (welcher Header gesetzt wird, dass Navigation
 * wirklich abgebrochen wird) in `main.security.test.ts` zu prüfen, ohne das
 * `electron`-Modul zu importieren.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
].join('; ')

export interface HeadersReceivedDetails {
  responseHeaders?: Record<string, string[]>
}

export interface HeadersReceivedResponse {
  responseHeaders: Record<string, string[]>
}

export interface WebRequestLike {
  onHeadersReceived(
    listener: (details: HeadersReceivedDetails, callback: (response: HeadersReceivedResponse) => void) => void,
  ): void
}

export function applyContentSecurityPolicy(webRequest: WebRequestLike): void {
  webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CONTENT_SECURITY_POLICY],
      },
    })
  })
}

export function denyWindowOpen(): { action: 'deny' } {
  return { action: 'deny' }
}

export interface NavigationEventLike {
  preventDefault(): void
}

export function blockNavigation(event: NavigationEventLike): void {
  event.preventDefault()
}
