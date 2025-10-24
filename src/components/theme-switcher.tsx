
/**
 * @fileoverview Defines a component for switching between light, dark, and system themes.
 *
 * This client-side component provides a user interface for changing the application's
 * theme. It offers two display variants: a compact dropdown menu for desktop and a more
 * explicit list of buttons for mobile navigation menus. It uses the `next-themes`
 * library to manage the theme state.
 */
'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Props for the ThemeSwitcher component.
 */
interface ThemeSwitcherProps {
  /**
   * If true, renders a mobile-friendly version of the theme switcher.
   * @default false
   */
  isMobile?: boolean;
}

/**
 * Renders a UI control for switching the application's color theme.
 *
 * This component provides two distinct UIs based on the `isMobile` prop:
 * - **Desktop (default):** A dropdown menu triggered by an icon button that shows
 *   the current theme (sun for light, moon for dark) and allows selection of
 *   Light, Dark, or System.
 * - **Mobile (`isMobile={true}`):** A list of full-width buttons for Light, Dark,
 *   and System, suitable for inclusion in a sidebar or mobile menu.
 *
 * @param {ThemeSwitcherProps} props - The props for the component.
 * @returns {JSX.Element} The rendered theme switcher.
 */
export function ThemeSwitcher({ isMobile = false }: ThemeSwitcherProps) {
  const { setTheme, resolvedTheme } = useTheme();

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  if (isMobile) {
    return (
      <div className="space-y-1 pt-2 border-t mt-2">
        <p className="px-4 text-xs text-muted-foreground uppercase font-semibold">Theme</p>
        <Button
          variant="ghost"
          className="w-full justify-start text-base py-3"
          onClick={() => setTheme('light')}
        >
          <Sun className="mr-2 h-5 w-5" />
          Light
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-base py-3"
          onClick={() => setTheme('dark')}
        >
          <Moon className="mr-2 h-5 w-5" />
          Dark
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-base py-3"
          onClick={() => setTheme('system')}
        >
          <Monitor className="mr-2 h-5 w-5" />
          System
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
