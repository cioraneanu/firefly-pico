export const ThemeMode = {
  light: 'light',
  dark: 'dark',
  system: 'system',
}

export const isThemeMode = (value) => Object.values(ThemeMode).includes(value)

export default ThemeMode
