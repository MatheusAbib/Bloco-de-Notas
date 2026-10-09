import state from '../core/state.js'

export function initToolbarToggle() {
  const btn = document.getElementById('toolbar-toggle')
  const toolbar = document.getElementById('editor-toolbar')
  if (!btn || !toolbar) return

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleToolbar()
  })

  document.addEventListener('click', (e) => {
    if (window.matchMedia('(min-width: 769px)').matches) return
    if (!state.get('toolbarOpen')) return
    if (toolbar.contains(e.target)) return
    if (e.target.closest('#top-bar')) return
    closeToolbar()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.get('toolbarOpen')) {
      closeToolbar()
    }
  })
}

export function toggleToolbar() {
  const current = state.get('toolbarOpen')
  if (current) {
    closeToolbar()
  } else {
    openToolbar()
  }
}

function openToolbar() {
  const btn = document.getElementById('toolbar-toggle')
  const toolbar = document.getElementById('editor-toolbar')
  if (!btn || !toolbar) return
  toolbar.classList.add('open')
  btn.classList.add('active')
  state.set('toolbarOpen', true)
}

function closeToolbar() {
  const btn = document.getElementById('toolbar-toggle')
  const toolbar = document.getElementById('editor-toolbar')
  if (!btn || !toolbar) return
  toolbar.classList.remove('open')
  btn.classList.remove('active')
  state.set('toolbarOpen', false)
}