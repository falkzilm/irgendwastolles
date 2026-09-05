import { AppShell } from './app/AppShell'
import { ThemeProvider } from './ui/theme'
import { ToastProvider } from './ui/Toast'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
