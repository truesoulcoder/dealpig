import { Button } from './button';
import { useTheme } from './theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      aria-label="Switch Theme"
      variant="default"
      style={{ minWidth: 120 }}
      onClick={toggleTheme}
      className="mx-2"
    >
      {theme === 'leet' ? 'HeroUI Theme' : 'Leet Theme'}
    </Button>
  );
}
