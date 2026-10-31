import { createTheme } from '@fluentui/react/lib/Styling';
import type { ITheme } from '@fluentui/react/lib/Styling';

const STORAGE_KEY = 'onboardingTracker.darkMode';

// Fluent UI components (dropdowns, pickers, buttons ...) read these colors; the rest of the app
// is darkened by the `dark` rules in OnboardingTracker.module.scss.
export const DARK_THEME: ITheme = createTheme({
  palette: {
    themePrimary: '#3fb0b9',
    themeLighterAlt: '#04090a',
    themeLighter: '#0f1d1f',
    themeLight: '#1c3436',
    themeTertiary: '#38666a',
    themeSecondary: '#379aa2',
    themeDarkAlt: '#52b8c0',
    themeDark: '#6dc4cb',
    themeDarker: '#92d4d9',
    neutralLighterAlt: '#26272c',
    neutralLighter: '#2c2d33',
    neutralLight: '#36373e',
    neutralQuaternaryAlt: '#3d3e46',
    neutralQuaternary: '#43444c',
    neutralTertiaryAlt: '#5b5c66',
    neutralTertiary: '#a3a8b0',
    neutralSecondary: '#b8bcc3',
    neutralPrimaryAlt: '#cdd0d5',
    neutralPrimary: '#e5e7eb',
    neutralDark: '#f3f4f6',
    black: '#fafafa',
    white: '#1f2024'
  },
  semanticColors: {
    bodyBackground: '#1f2024',
    bodyText: '#e5e7eb',
    inputBackground: '#26272c',
    inputBorder: '#5b5c66',
    menuBackground: '#26272c',
    menuItemBackgroundHovered: '#36373e',
    listBackground: '#26272c',
    errorText: '#f87171'
  },
  isInverted: true
});

export function readSystemDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// The choice made with the switch; undefined until the user has used it.
export function readDarkChoice(): boolean | undefined {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === null ? undefined : value === '1';
  } catch {
    return undefined;
  }
}

export function saveDarkMode(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // storage can be blocked; the choice then only lasts for this session
  }
}
