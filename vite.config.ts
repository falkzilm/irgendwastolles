import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
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
}))
