import localforage from 'localforage'

localforage.config({
  name: 'bloco-de-notas',
  storeName: 'notas',
  description: 'Armazenamento do Bloco de Notas'
})

const NOTES_KEY = 'notes'
const SETTINGS_KEY = 'settings'

const DEFAULT_SETTINGS = {
  theme: 'light'
}

export async function getNotes() {
  const notes = await localforage.getItem(NOTES_KEY)
  return notes || []
}

export async function saveNotes(notes) {
  await localforage.setItem(NOTES_KEY, notes)
  return notes
}

export async function getNoteById(id) {
  const notes = await getNotes()
  return notes.find((n) => n.id === id) || null
}

export async function addNote(note) {
  const notes = await getNotes()
  notes.push(note)
  await saveNotes(notes)
  return note
}

export async function updateNote(id, patch) {
  const notes = await getNotes()
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) return null
  notes[index] = { ...notes[index], ...patch, updatedAt: Date.now() }
  await saveNotes(notes)
  return notes[index]
}

export async function deleteNote(id) {
  const notes = await getNotes()
  const filtered = notes.filter((n) => n.id !== id)
  await saveNotes(filtered)
  return filtered
}

export async function deleteNotes(ids) {
  const notes = await getNotes()
  const idSet = new Set(ids)
  const filtered = notes.filter((n) => !idSet.has(n.id))
  await saveNotes(filtered)
  return filtered
}

export async function getSettings() {
  const settings = await localforage.getItem(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(settings || {}) }
}

export async function saveSettings(settings) {
  await localforage.setItem(SETTINGS_KEY, settings)
  return settings
}

export async function updateSettings(patch) {
  const current = await getSettings()
  const next = { ...current, ...patch }
  await saveSettings(next)
  return next
}

export async function clearAll() {
  await localforage.removeItem(NOTES_KEY)
  await localforage.removeItem(SETTINGS_KEY)
}