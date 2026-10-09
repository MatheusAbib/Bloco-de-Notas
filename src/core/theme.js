import { getSettings, updateSettings } from './storage.js'
import state from './state.js'

const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'

export async function initTheme() {
  const settings = await getSettings()
  const theme = settings.theme === THEME_DARK ? THEME_DARK : THEME_LIGHT
  applyTheme(theme)
  state.set('theme', theme)

  const btn = document.getElementById('theme-toggle')
  if (btn) {
    btn.addEventListener('click', toggleTheme)
  }
}

export async function toggleTheme() {
  const current = state.get('theme')
  const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK
  applyTheme(next)
  state.set('theme', next)
  await updateSettings({ theme: next })
}

function applyTheme(theme) {
  if (theme === THEME_DARK) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  updateToggleIcon(theme)
}

function updateToggleIcon(theme) {
  const btn = document.getElementById('theme-toggle')
  if (!btn) return
  const icon = btn.querySelector('i')
  if (!icon) return
  if (theme === THEME_DARK) {
    icon.className = 'fas fa-sun'
  } else {
    icon.className = 'fas fa-moon'
  }
}