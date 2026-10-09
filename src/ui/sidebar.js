import state from '../core/state.js'
import { formatDateTime } from '../utils/dates.js'
import * as notes from '../notes/notes.js'
import { openNote, togglePin, toggleArchive } from '../notes/notes.js'
import { applyDateFilter } from '../notes/filters.js'
import { toggleNoteSelection } from '../notes/batch.js'

let editorRef = null

export function initSidebar(editor) {
  editorRef = editor

  initSidebarToggle()

  const newBtn = document.getElementById('new-note-btn')
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      const event = new CustomEvent('open-new-note-dialog')
      document.dispatchEvent(event)
    })
  }

  state.subscribe('notes', () => renderNotes())
  state.subscribe('currentNoteId', () => {
    renderNotes()
    updateTitle()
  })
  state.subscribe('currentTab', () => renderNotes())
  state.subscribe('searchQuery', () => renderNotes())
  state.subscribe('filterTag', () => renderNotes())
  state.subscribe('filterDate', () => renderNotes())
  state.subscribe('multiSelectMode', () => renderNotes())
  state.subscribe('selectedNoteIds', () => renderNotes())

  initTabs()
  initSearch()

  renderNotes()
  updateTitle()
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab
      state.set('currentTab', tab)
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.tab === tab)
      })
    })
  })
}

function initSearch() {
  const input = document.getElementById('search-notes')
  const clear = document.getElementById('search-clear')
  if (!input) return

  input.addEventListener('input', (e) => {
    const value = e.target.value
    state.set('searchQuery', value)
    if (clear) {
      clear.classList.toggle('visible', value.length > 0)
    }
  })

  if (clear) {
    clear.addEventListener('click', () => {
      input.value = ''
      state.set('searchQuery', '')
      clear.classList.remove('visible')
    })
  }
}

function getFilteredNotes() {
  const allNotes = state.get('notes')
  const tab = state.get('currentTab')
  const search = state.get('searchQuery').toLowerCase().trim()
  const filterTag = state.get('filterTag')

  let filtered = allNotes.filter((n) => {
    if (tab === 'active') return !n.archived
    return n.archived
  })

  if (search) {
    filtered = filtered.filter((n) => {
      const inName = n.name.toLowerCase().includes(search)
      const inContent = (n.content || '').toLowerCase().includes(search)
      return inName || inContent
    })
  }

  if (filterTag !== 'all') {
    filtered = filtered.filter((n) => {
      return n.tags && n.tags.some((t) => (t.name || t) === filterTag)
    })
  }

  filtered = applyDateFilter(filtered)

  return filtered
}

function renderNotes() {
  const list = document.getElementById('saved-notes')
  if (!list) return

  const filtered = getFilteredNotes()
  const countEl = document.getElementById('note-count')
  if (countEl) countEl.textContent = filtered.length

  list.innerHTML = ''

  if (filtered.length === 0) {
    const tab = state.get('currentTab')
    const msg = tab === 'active' ? 'Nenhuma nota ativa' : 'Nenhuma nota arquivada'
    const p = document.createElement('p')
    p.className = 'empty-state'
    p.textContent = msg
    list.appendChild(p)
    return
  }

  const currentId = state.get('currentNoteId')

  filtered.forEach((note) => {
    const card = createNoteCard(note, note.id === currentId)
    list.appendChild(card)
  })
}

function createNoteCard(note, isActive) {
  const multiSelectMode = state.get('multiSelectMode')
  const selectedNoteIds = state.get('selectedNoteIds')

  const card = document.createElement('div')
  card.className = 'note-card'
  card.dataset.id = note.id

  if (note.pinned) card.classList.add('pinned-card')
  if (note.archived) card.classList.add('archived-card')
  if (isActive && !multiSelectMode) card.classList.add('active')
  if (multiSelectMode) card.classList.add('selectable')
  if (selectedNoteIds.has(note.id)) card.classList.add('selected')

  if (note.color) {
    card.style.borderLeftColor = note.color
    const rgb = hexToRgb(note.color)
    if (rgb) {
      card.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`
      if (isActive && !multiSelectMode) {
        card.style.boxShadow = `0 0 0 2px ${note.color}`
      }
      if (selectedNoteIds.has(note.id)) {
        card.style.boxShadow = `0 0 0 2px ${note.color}`
      }
    }
  }

  if (multiSelectMode) {
    const checkbox = document.createElement('div')
    checkbox.className = 'checkbox-overlay show'
    if (selectedNoteIds.has(note.id)) {
      checkbox.classList.add('checked')
      checkbox.innerHTML = '<i class="fas fa-check"></i>'
    }
    card.appendChild(checkbox)
  }

  if (note.pinned) {
    const pin = document.createElement('i')
    pin.className = 'pin-icon pinned fas fa-thumbtack'
    if (note.color) pin.style.color = note.color
    card.appendChild(pin)
  }

  const title = document.createElement('h3')
  title.textContent = note.name
  if (note.color) title.style.color = note.color
  card.appendChild(title)

  const date = document.createElement('p')
  date.textContent = formatDateTime(note.updatedAt)
  card.appendChild(date)

  if (note.tags && note.tags.length > 0) {
    const tagsDiv = document.createElement('div')
    tagsDiv.className = 'tags-corner'
    note.tags.forEach((tag) => {
      const span = document.createElement('span')
      span.textContent = tag.name || tag
      const color = tag.color || '#7a8a8a'
      span.style.background = `${color}33`
      span.style.color = color
      tagsDiv.appendChild(span)
    })
    card.appendChild(tagsDiv)
  }

  if (!multiSelectMode) {
    const actions = document.createElement('div')
    actions.className = 'note-card-actions'

    actions.appendChild(makeActionButton('thumbtack', note.pinned ? 'Desafixar' : 'Fixar', (e) => {
      e.stopPropagation()
      togglePin(note.id)
    }))

    actions.appendChild(makeActionButton('pen', 'Editar', (e) => {
      e.stopPropagation()
      const event = new CustomEvent('edit-note', { detail: { id: note.id } })
      document.dispatchEvent(event)
    }))

    actions.appendChild(makeActionButton('trash', 'Excluir', async (e) => {
      e.stopPropagation()
      await notes.deleteNoteById(note.id)
    }, 'btn-delete'))

    actions.appendChild(makeActionButton(
      note.archived ? 'undo' : 'archive',
      note.archived ? 'Desarquivar' : 'Arquivar',
      (e) => {
        e.stopPropagation()
        toggleArchive(note.id)
      }
    ))

    card.appendChild(actions)
  }

  card.addEventListener('click', async (e) => {
    if (multiSelectMode) {
      e.preventDefault()
      e.stopPropagation()
      toggleNoteSelection(note.id)
      return
    }
    await openNote(note.id, editorRef)
    updateTitle()
    closeSidebarOnMobile()
  })

  return card
}


function closeSidebarOnMobile() {
  if (!window.matchMedia('(max-width: 768px)').matches) return
  const sidebar = document.getElementById('sidebar')
  const backdrop = document.getElementById('sidebar-backdrop')
  if (sidebar) sidebar.classList.remove('open')
  if (backdrop) backdrop.classList.remove('visible')
  document.body.style.overflow = ''
}

function makeActionButton(iconName, title, handler, extraClass = '') {
  const btn = document.createElement('button')
  btn.className = extraClass
  btn.title = title
  btn.innerHTML = `<i class="fas fa-${iconName}"></i>`
  btn.addEventListener('click', handler)
  return btn
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

export function updateTitle() {
  const display = document.getElementById('note-title-display')
  if (!display) return
  const current = notes.getCurrentNote()
  if (current) {
    display.innerHTML = `Bloco de Notas <span style="color:${current.color || 'inherit'};font-weight:500;">• ${current.name}</span>`
  } else {
    display.textContent = 'Bloco de Notas'
  }
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('toggle-sidebar')
  const sidebar = document.getElementById('sidebar')
  if (!toggleBtn || !sidebar) return

  let backdrop = document.getElementById('sidebar-backdrop')
  if (!backdrop) {
    backdrop = document.createElement('div')
    backdrop.id = 'sidebar-backdrop'
    document.body.appendChild(backdrop)
  }

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches

  const openSidebar = () => {
    sidebar.classList.add('open')
    backdrop.classList.add('visible')
    document.body.style.overflow = 'hidden'
  }

  const closeSidebar = () => {
    sidebar.classList.remove('open')
    backdrop.classList.remove('visible')
    document.body.style.overflow = ''
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (sidebar.classList.contains('open')) {
      closeSidebar()
    } else {
      openSidebar()
    }
  })

  backdrop.addEventListener('click', closeSidebar)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar()
    }
  })

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      closeSidebar()
    }
  })
}