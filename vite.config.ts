import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  // Relative Basis, damit die gebauten Assets auch unter `file://`
  // (Electron `loadFile`) statt nur über einen HTTP-Server auflösen.
  base: command === 'build' ? './' : '/',
  plugins: [
    react(),
    // Baut electron/main.ts und electron/preload.ts nach dist-electron/.
    // Bei `vite build` immer aktiv (Produktions-Build), im Dev-Server nur im
    // expliziten `--mode electron` (siehe `npm run dev:electron`), damit
    // `npm run dev` weiterhin ein reiner Browser-Dev-Server bleibt.
    ...(command === 'build' || mode === 'electron'
      ? [
          electron({
            main: {
              entry: 'electron/main.ts',
            },
            preload: {
              input: 'electron/preload.ts',
            },
          }),
        ]
      : []),
  ],
  test: {
    environment: 'jsdom',
    // `e2e/` enthält Playwright-Specs (IRGENDWAST-16), die über
    // `npm run test:e2e` laufen, nicht über Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
}))
