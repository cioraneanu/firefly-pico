export const trimString = (value, maxLength = 20) => {
  return value.length > maxLength ? value.substring(0, maxLength) + '...' : value
}
