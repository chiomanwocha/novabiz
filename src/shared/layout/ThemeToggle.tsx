import { useTheme } from '../../app/providers/ThemeProvider'
import { Button } from '../ui/Button'

/** Toggles light/dark mode. The label itself changes, so the state isn't shown by icon alone. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button variant="secondary" onClick={toggleTheme}>
      {isDark ? 'Light mode' : 'Dark mode'}
    </Button>
  )
}
