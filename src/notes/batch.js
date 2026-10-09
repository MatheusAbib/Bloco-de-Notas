import state from '../core/state.js'
import * as storage from '../core/storage.js'
import { loadNotes } from './notes.js'
import { confirmar } from '../ui/confirmDialog.js'

function notify(message, type = 'success') {
  const event = new CustomEvent('app-notification', {
    detail: { message, type }
  })
  document.dispatchEvent(event)
}

export function initBatch() {
  const toggleBtn = document.getElementById('multi-select-toggle')
  const actionsBar = document.getElementById('multi-select-actions')
  const pinBtn = document.getElementById('batch-pin-btn')
  const archiveBtn = document.getElementById('batch-archive-btn')
  const unarchiveBtn = document.getElementById('batch-unarchive-btn')
  const deleteBtn = document.getElementById('batch-delete-btn')

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleMultiSelect())
  }

  if (pinBtn) pinBtn.addEventListener('click', () => batchPin())
  if (archiveBtn) archiveBtn.addEventListener('click', () => batchArchive())
  if (unarchiveBtn) unarchiveBtn.addEventListener('click', () => batchUnarchive())
  if (deleteBtn) deleteBtn.addEventListener('click', () => batchDelete())

  state.subscribe('multiSelectMode', (active) => {
    if (toggleBtn) toggleBtn.classList.toggle('active', active)
    if (actionsBar) actionsBar.classList.toggle('visible', active)
    if (!active) {
      state.set('selectedNoteIds', new Set())
    }
    updateSelectedCount()
  })

  state.subscribe('selectedNoteIds', () => updateSelectedCount())
  state.subscribe('currentTab', () => updateBatchButtons())
}

export function toggleMultiSelect() {
  const current = state.get('multiSelectMode')
  state.set('multiSelectMode', !current)
}

export function toggleNoteSelection(id) {
  if (!state.get('multiSelectMode')) return
  const selected = new Set(state.get('selectedNoteIds'))
  if (selected.has(id)) {
    selected.delete(id)
  } else {
    selected.add(id)
  }
  state.set('selectedNoteIds', selected)
}

export function updateSelectedCount() {
  const countEl = document.getElementById('selected-count')
  if (!countEl) return
  const size = state.get('selectedNoteIds').size
  countEl.textContent = size
}

function updateBatchButtons() {
  const archiveBtn = document.getElementById('batch-archive-btn')
  const unarchiveBtn = document.getElementById('batch-unarchive-btn')
  if (!archiveBtn || !unarchiveBtn) return

  const tab = state.get('currentTab')
  if (tab === 'archived') {
    archiveBtn.style.display = 'none'
    unarchiveBtn.style.display = 'inline-flex'
  } else {
    archiveBtn.style.display = 'inline-flex'
    unarchiveBtn.style.display = 'none'
  }
}

async function batchPin() {
  const selected = Array.from(state.get('selectedNoteIds'))
  if (!selected.length) return

  const notes = await storage.getNotes()
  const pinnedCount = notes.filter((n) => n.pinned).length
  const toPin = selected.length

  if (pinnedCount + toPin > 5) {
    notify('Limite de 5 notas fixadas!', 'error')
    return
  }

  const idSet = new Set(selected)
  const updated = notes.map((n) =>
    idSet.has(n.id) ? { ...n, pinned: true, updatedAt: Date.now() } : n
  )

  await storage.saveNotes(updated)
  await loadNotes()
  clearSelection()
  notify(`${toPin} nota(s) fixada(s)!`, 'success')
}

async function batchArchive() {
  const selected = Array.from(state.get('selectedNoteIds'))
  if (!selected.length) return

  const notes = await storage.getNotes()
  const idSet = new Set(selected)
  const updated = notes.map((n) =>
    idSet.has(n.id) ? { ...n, archived: true, updatedAt: Date.now() } : n
  )

  await storage.saveNotes(updated)
  await loadNotes()
  clearSelection()
  notify(`${selected.length} nota(s) arquivada(s)!`, 'success')
}

async function batchUnarchive() {
  const selected = Array.from(state.get('selectedNoteIds'))
  if (!selected.length) return

  const notes = await storage.getNotes()
  const idSet = new Set(selected)
  const updated = notes.map((n) =>
    idSet.has(n.id) ? { ...n, archived: false, updatedAt: Date.now() } : n
  )

  await storage.saveNotes(updated)
  await loadNotes()
  clearSelection()
  notify(`${selected.length} nota(s) desarquivada(s)!`, 'success')
}

async function batchDelete() {
  const selected = Array.from(state.get('selectedNoteIds'))
  if (!selected.length) return

  const notes = await storage.getNotes()
  const idSet = new Set(selected)
  const names = notes.filter((n) => idSet.has(n.id)).map((n) => n.name)

  const ok = await confirmar({
    titulo: 'Excluir notas',
    mensagem: `Excluir ${selected.length} nota(s)?\n\n• ${names.join('\n• ')}`,
    confirmarTexto: 'Excluir',
    cancelarTexto: 'Cancelar',
    tipo: 'danger'
  })

  if (!ok) return

  const filtered = notes.filter((n) => !idSet.has(n.id))
  await storage.saveNotes(filtered)

  const currentId = state.get('currentNoteId')
  if (currentId && idSet.has(currentId)) {
    state.set('currentNoteId', null)
  }

  await loadNotes()
  clearSelection()
  notify(`${selected.length} nota(s) excluída(s)!`, 'error')
}

function clearSelection() {
  state.set('selectedNoteIds', new Set())
}