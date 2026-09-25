export type AccentThemeId = 'gold' | 'emerald' | 'champagne' | 'rose'

export type AccentTheme = {
  id: AccentThemeId
  label: string
  color: string
  foreground: string
}

export const ACCENT_THEMES: AccentTheme[] = [
  { id: 'gold', label: 'Liquid Gold', color: '#d4af37', foreground: '#0a0802' },
  { id: 'emerald', label: 'Velvet Emerald', color: '#34a37f', foreground: '#02140e' },
  { id: 'champagne', label: 'Champagne', color: '#e6d3a3', foreground: '#14110a' },
  { id: 'rose', label: 'Rose Gold', color: '#d4a08a', foreground: '#140c09' },
]
