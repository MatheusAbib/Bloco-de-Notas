const CONTAINER_ID = 'notification'
const DEFAULT_DURATION = 3000

export function initNotifications() {
  ensureContainer()

  document.addEventListener('app-notification', (e) => {
    const { message, type } = e.detail || {}
    showNotification(message, type)
  })
}

export function showNotification(message, type = 'success', duration = DEFAULT_DURATION) {
  if (!message) return
  const container = ensureContainer()

  const toast = document.createElement('div')
  toast.className = `notification-modal ${type}`

  const progress = document.createElement('div')
  progress.className = 'notification-progress'
  progress.style.animationDuration = `${duration}ms`

  const text = document.createElement('span')
  text.textContent = message

  toast.appendChild(text)
  toast.appendChild(progress)
  container.appendChild(toast)

  requestAnimationFrame(() => {
    toast.classList.add('show')
  })

  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => {
      toast.remove()
    }, 500)
  }, duration)
}

function ensureContainer() {
  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    container.className = 'notification-container'
    document.body.appendChild(container)
  }
  return container
}