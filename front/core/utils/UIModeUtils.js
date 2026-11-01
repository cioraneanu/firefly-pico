export const UI_MODES = ['auto', 'desktop', 'mobile']

const mode = localStorage.getItem('uiMode') ?? 'auto'

export const isDesktopUI = mode === 'desktop' || (mode === 'auto' && matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)').matches)
