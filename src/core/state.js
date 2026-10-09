const state = (() => {
  const data = {
    notes: [],
    currentNoteId: null,
    currentTab: 'active',
    multiSelectMode: false,
    selectedNoteIds: new Set(),
    searchQuery: '',
    filterTag: 'all',
    filterDate: 'all',
    theme: 'light',
    focusMode: false,
    toolbarOpen: false,
    saveStatus: 'idle'
  }

  const listeners = new Map()

  function get(key) {
    return data[key]
  }

  function getAll() {
    return { ...data }
  }

  function set(key, value) {
    const prev = data[key]
    if (prev === value) return
    data[key] = value
    notify(key, value, prev)
  }

  function subscribe(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set())
    }
    listeners.get(key).add(callback)
    return () => {
      listeners.get(key).delete(callback)
    }
  }

  function notify(key, value, prev) {
    const callbacks = listeners.get(key)
    if (!callbacks) return
    callbacks.forEach((cb) => {
      try {
        cb(value, prev)
      } catch (err) {
        console.error(`Erro em listener de "${key}":`, err)
      }
    })
  }

  function dump() {
    const snapshot = { ...data }
    snapshot.selectedNoteIds = Array.from(data.selectedNoteIds)
    return snapshot
  }

  return { get, getAll, set, subscribe, dump }
})()

window.__state = state

export default state