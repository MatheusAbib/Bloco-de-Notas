import state from '../core/state.js'

export function extractAllTags(notes) {
  const map = new Map()
  notes.forEach((note) => {
    if (!note.tags || !note.tags.length) return
    note.tags.forEach((tag) => {
      const name = tag.name || tag
      if (!map.has(name)) {
        map.set(name, tag.color || '#7a8a8a')
      }
    })
  })
  return map
}

export function getAllTagNames() {
  const notes = state.get('notes')
  const map = extractAllTags(notes)
  return Array.from(map.keys()).sort((a, b) => a.localeCompare(b))
}

export function addTag(tagsList, name, color) {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Digite o nome da tag.' }
  const exists = tagsList.some(
    (t) => (t.name || t).toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) return { error: 'Tag já adicionada.' }
  return {
    tags: [...tagsList, { name: trimmed, color: color || '#e74c3c' }]
  }
}

export function removeTag(tagsList, index) {
  return tagsList.filter((_, i) => i !== index)
}

export function renderTagList(container, tagsList, onRemove) {
  if (!container) return
  container.innerHTML = ''
  tagsList.forEach((tag, index) => {
    const item = document.createElement('span')
    item.className = 'tag-item'
    const color = tag.color || '#7a8a8a'
    item.style.background = `${color}33`
    item.style.color = color
    item.innerHTML = `${tag.name || tag} <button class="tag-remove" title="Remover"><i class="fas fa-times"></i></button>`
    const removeBtn = item.querySelector('.tag-remove')
    removeBtn.addEventListener('click', () => onRemove(index))
    container.appendChild(item)
  })
}

export function refreshTagFilter() {
  const select = document.getElementById('filter-tag')
  if (!select) return
  const notes = state.get('notes')
  const map = extractAllTags(notes)
  const currentValue = state.get('filterTag')

  select.innerHTML = '<option value="all">Todas as tags</option>'
  map.forEach((color, name) => {
    const option = document.createElement('option')
    option.value = name
    option.textContent = name
    select.appendChild(option)
  })

  if (currentValue !== 'all' && map.has(currentValue)) {
    select.value = currentValue
  } else if (currentValue !== 'all') {
    state.set('filterTag', 'all')
  }
}