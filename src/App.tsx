import { AppShell } from './app/AppShell'
import { GamificationNotifications } from './app/GamificationNotifications'
import { ThemeProvider } from './ui/theme'
import { ToastProvider } from './ui/Toast'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GamificationNotifications />
        <AppShell />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
