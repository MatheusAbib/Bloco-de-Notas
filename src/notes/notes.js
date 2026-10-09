import { generateId } from '../utils/id.js'
import * as storage from '../core/storage.js'
import state from '../core/state.js'
import { confirmar } from '../ui/confirmDialog.js'

let autoSaveTimer = null

function notify(message, type = 'success') {
  const event = new CustomEvent('app-notification', {
    detail: { message, type }
  })
  document.dispatchEvent(event)
}

export async function loadNotes() {
  const notes = await storage.getNotes()
  const sorted = sortNotes(notes)
  state.set('notes', sorted)
  return sorted
}

export function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  })
}

export async function createNote({ name, color, tags }) {
  const now = Date.now()
  const note = {
    id: generateId(),
    name: name.trim(),
    content: '',
    tags: tags && tags.length ? tags : [],
    color: color || '#1a6d5e',
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now
  }
  await storage.addNote(note)
  await loadNotes()
  notify(`"${note.name}" criada com sucesso!`, 'success')
  return note
}

export async function openNote(id, editor) {
  const note = await storage.getNoteById(id)
  if (!note) return null
  state.set('currentNoteId', id)
  if (editor) {
    editor.commands.setContent(note.content || '', false)
    editor.commands.focus()
  }
  updateSaveIndicator('saved', 'Salvo ✓')
  notify(`"${note.name}" aberta!`, 'success')
  return note
}

export async function closeCurrentNote(editor) {
  const id = state.get('currentNoteId')
  if (id && editor) {
    await saveCurrentNote(editor, { silent: true })
  }
  state.set('currentNoteId', null)
  if (editor) {
    editor.commands.clearContent()
  }
  updateSaveIndicator('idle', '')
  notify('Nota fechada.', 'success')
}

export async function saveCurrentNote(editor, { silent = false } = {}) {
  const id = state.get('currentNoteId')
  if (!id || !editor) return null
  const content = editor.getHTML()
  const updated = await storage.updateNote(id, { content })
  await loadNotes()
  if (!silent) {
    updateSaveIndicator('saved', 'Salvo ✓')
    notify('Nota salva!', 'success')
  }
  return updated
}

export function scheduleAutoSave(editor) {
  updateSaveIndicator('saving', 'Salvando...')
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(async () => {
    await saveCurrentNote(editor, { silent: true })
  }, 600)
}

export async function deleteNoteById(id) {
  const note = await storage.getNoteById(id)
  if (!note) return

  const ok = await confirmar({
    titulo: 'Excluir nota',
    mensagem: `Tem certeza que deseja excluir "${note.name}"?`,
    confirmarTexto: 'Excluir',
    cancelarTexto: 'Cancelar',
    tipo: 'danger'
  })

  if (!ok) return

  await storage.deleteNote(id)
  if (state.get('currentNoteId') === id) {
    state.set('currentNoteId', null)
  }
  await loadNotes()
  notify(`"${note.name}" excluída!`, 'error')
}

export async function updateNoteMeta(id, patch) {
  const note = await storage.updateNote(id, patch)
  await loadNotes()
  if (note) {
    notify(`"${note.name}" atualizada!`, 'success')
  }
  return note
}

export async function togglePin(id) {
  const notes = state.get('notes')
  const note = notes.find((n) => n.id === id)
  if (!note) return
  const pinnedCount = notes.filter((n) => n.pinned).length
  if (!note.pinned && pinnedCount >= 5) {
    notify('Limite de 5 notas fixadas!', 'error')
    return { error: 'Limite de 5 notas fixadas!' }
  }
  await storage.updateNote(id, { pinned: !note.pinned })
  await loadNotes()
  const message = note.pinned
    ? `"${note.name}" desafixada!`
    : `"${note.name}" fixada!`
  notify(message, 'success')
  return { success: true, pinned: !note.pinned }
}

export async function toggleArchive(id) {
  const notes = state.get('notes')
  const note = notes.find((n) => n.id === id)
  if (!note) return
  await storage.updateNote(id, { archived: !note.archived })
  await loadNotes()
  const message = note.archived
    ? `"${note.name}" desarquivada!`
    : `"${note.name}" arquivada!`
  notify(message, 'success')
  return { archived: !note.archived }
}

export function getCurrentNote() {
  const id = state.get('currentNoteId')
  if (!id) return null
  const notes = state.get('notes')
  return notes.find((n) => n.id === id) || null
}

export function updateSaveIndicator(status, message) {
  const indicator = document.getElementById('save-indicator')
  if (!indicator) return

  if (status === 'idle') {
    indicator.className = 'save-indicator'
    indicator.innerHTML = ''
    return
  }

  indicator.className = 'save-indicator'
  if (status === 'saving') {
    indicator.classList.add('saving')
    indicator.innerHTML = `<i class="fas fa-circle-notch"></i><span>${message}</span>`
  } else if (status === 'saved') {
    indicator.classList.add('saved')
    indicator.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`
  } else if (status === 'error') {
    indicator.classList.add('error')
    indicator.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`
  }
}