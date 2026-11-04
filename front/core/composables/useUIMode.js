export function useUIMode() {
  return computed({
    get: () => localStorage.getItem('uiMode') ?? 'auto',
    set: (value) => {
      localStorage.setItem('uiMode', value)
      location.reload()
    },
  })
}
