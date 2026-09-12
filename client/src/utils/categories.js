export const CATEGORIES = [
  { id: 'hat', label: 'CAPS', ko: '모자' },
  { id: 'object', label: 'OBJECTS', ko: '오브제' },
]

export function normalizeCategory(category) {
  if (category === 'object' || category === 'incense') return 'object'
  return 'hat'
}

export function categoryLabel(category) {
  const id = normalizeCategory(category)
  return CATEGORIES.find((item) => item.id === id)?.label || 'CAPS'
}
