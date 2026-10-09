import state from '../core/state.js'

export function initFocusMode() {
  const btn = document.getElementById('focus-mode-btn')
  if (!btn) return

  btn.addEventListener('click', () => toggleFocusMode())

  state.subscribe('focusMode', (active) => {
    const app = document.getElementById('app')
    if (!app) return
    app.classList.toggle('focus-mode', active)

    const icon = btn.querySelector('i')
    if (icon) {
      icon.className = active ? 'fas fa-compress' : 'fas fa-expand'
    }
  })
}

export function toggleFocusMode() {
  const current = state.get('focusMode')
  state.set('focusMode', !current)
}