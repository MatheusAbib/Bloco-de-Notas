import { getAllTagNames } from '../notes/tags.js'

const dropdowns = new Map()

export function attachTagAutocomplete(inputEl, getTagColor) {
  if (!inputEl) return

  const wrapper = inputEl.closest('.tag-input-group') || inputEl.parentElement
  if (!wrapper) return

  const dropdown = document.createElement('div')
  dropdown.className = 'tag-autocomplete'
  dropdown.style.display = 'none'
  wrapper.style.position = 'relative'
  wrapper.appendChild(dropdown)

  dropdowns.set(inputEl, { dropdown, getTagColor })

  inputEl.addEventListener('input', () => {
    updateSuggestions(inputEl)
  })

  inputEl.addEventListener('focus', () => {
    updateSuggestions(inputEl)
  })

  inputEl.addEventListener('keydown', (e) => {
    handleKeydown(e, inputEl)
  })

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      hideDropdown(inputEl)
    }
  })
}

function updateSuggestions(inputEl) {
  const { dropdown } = dropdowns.get(inputEl) || {}
  if (!dropdown) return

  const query = inputEl.value.trim().toLowerCase()
  const all = getAllTagNames()

  if (!all.length) {
    dropdown.style.display = 'none'
    return
  }

  const filtered = query
    ? all.filter((name) => name.toLowerCase().includes(query))
    : all

  if (!filtered.length) {
    dropdown.style.display = 'none'
    return
  }

  dropdown.innerHTML = ''
  filtered.slice(0, 6).forEach((name) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'tag-autocomplete-item'
    btn.innerHTML = `<i class="fas fa-tag"></i><span>${escapeHtml(name)}</span>`
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      inputEl.value = name
      hideDropdown(inputEl)
      inputEl.dispatchEvent(new Event('autocomplete-selected', { bubbles: true }))
    })
    dropdown.appendChild(btn)
  })

  dropdown.style.display = 'block'
}

function handleKeydown(e, inputEl) {
  const { dropdown } = dropdowns.get(inputEl) || {}
  if (!dropdown || dropdown.style.display === 'none') return

  const items = dropdown.querySelectorAll('.tag-autocomplete-item')
  if (!items.length) return

  const current = dropdown.querySelector('.tag-autocomplete-item.focused')
  let index = current ? Array.from(items).indexOf(current) : -1

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    index = (index + 1) % items.length
    setFocused(items, index)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    index = (index - 1 + items.length) % items.length
    setFocused(items, index)
  } else if (e.key === 'Enter' && current) {
    e.preventDefault()
    e.stopPropagation()
    current.click()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    hideDropdown(inputEl)
  }
}

function setFocused(items, index) {
  items.forEach((item, i) => {
    item.classList.toggle('focused', i === index)
  })
}

function hideDropdown(inputEl) {
  const { dropdown } = dropdowns.get(inputEl) || {}
  if (dropdown) dropdown.style.display = 'none'
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}