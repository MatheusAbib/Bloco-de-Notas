export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function isToday(timestamp) {
  const now = new Date()
  const date = new Date(timestamp)
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function isWithinDays(timestamp, days) {
  const now = Date.now()
  const limit = now - days * 24 * 60 * 60 * 1000
  return timestamp >= limit
}