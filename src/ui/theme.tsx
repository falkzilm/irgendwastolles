import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAppStore } from '../store'
import type { Theme } from '../store'

export type { Theme } from '../store'

const STORAGE_KEY = 'ui-theme'

function getPreferredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  return 'light'
}

/**
 * Übernimmt die DOM- und localStorage-Seiteneffekte des Themes und
 * initialisiert es beim Mount aus der gespeicherten/bevorzugten Einstellung.
 * Das Theme selbst lebt im `settingsSlice` des zentralen Stores (siehe
 * docs/state.md) – der Provider hält nur die Renderer-spezifischen Effekte.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  useEffect(() => {
    // `hydratePersistedState()` (siehe src/store/persistence.ts) läuft in
    // src/main.tsx bereits vor dem ersten Render und ist damit - sofern
    // `window.api` existiert - die maßgebliche Quelle für das Theme beim
    // Start (siehe IRGENDWAST-13). Die localStorage-/Systempräferenz greift
    // nur noch als Fallback im reinen Browser-Dev-Server ohne IPC-Persistenz;
    // sonst würde sie den gerade hydrierten Wert sofort wieder überschreiben.
    if (!window.api) {
      setTheme(getPreferredTheme())
    }
    // Nur beim Mount die bevorzugte Einstellung übernehmen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return <>{children}</>
}

export function useTheme() {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  return { theme, setTheme, toggleTheme }
}
