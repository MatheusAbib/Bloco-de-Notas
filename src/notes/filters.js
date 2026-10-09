import { isToday, isWithinDays } from '../utils/dates.js'
import { refreshTagFilter } from './tags.js'
import state from '../core/state.js'

export function initFilters() {
  const tagSelect = document.getElementById('filter-tag')
  const dateSelect = document.getElementById('filter-date')
  const clearBtn = document.getElementById('filter-clear')

  if (tagSelect) {
    tagSelect.addEventListener('change', (e) => {
      state.set('filterTag', e.target.value)
      updateClearVisibility()
    })
  }

  if (dateSelect) {
    dateSelect.addEventListener('change', (e) => {
      state.set('filterDate', e.target.value)
      updateClearVisibility()
    })
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.set('filterTag', 'all')
      state.set('filterDate', 'all')
      if (tagSelect) tagSelect.value = 'all'
      if (dateSelect) dateSelect.value = 'all'
      updateClearVisibility()
    })
  }

  state.subscribe('notes', () => refreshTagFilter())
  state.subscribe('filterTag', () => updateClearVisibility())
  state.subscribe('filterDate', () => updateClearVisibility())

  refreshTagFilter()
  updateClearVisibility()
}

function updateClearVisibility() {
  const clearBtn = document.getElementById('filter-clear')
  if (!clearBtn) return
  const hasFilter =
    state.get('filterTag') !== 'all' || state.get('filterDate') !== 'all'
  clearBtn.classList.toggle('hidden', !hasFilter)
}

export function applyDateFilter(notes) {
  const filterDate = state.get('filterDate')
  if (filterDate === 'all') return notes

  return notes.filter((note) => {
    const ts = note.updatedAt || note.createdAt
    if (!ts) return false
    if (filterDate === 'today') return isToday(ts)
    if (filterDate === 'week') return isWithinDays(ts, 7)
    if (filterDate === 'month') return isWithinDays(ts, 30)
    return true
  })
}