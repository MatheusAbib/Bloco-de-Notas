import 'emoji-picker-element'
import { SYMBOLS } from '../editor/emojis.js'

let editorRef = null
let popoverEl = null
let pickerEl = null
let symbolsGridEl = null
let tabsEl = null
let activeTab = 'emojis'

export function initEmojiPicker(editor) {
  editorRef = editor

  const triggerBtn = document.querySelector('[data-command="emoji"]')
  if (!triggerBtn) return

  triggerBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    togglePopover(triggerBtn)
  })

  document.addEventListener('click', (e) => {
    if (!popoverEl) return
    if (popoverEl.contains(e.target)) return
    if (e.target.closest('[data-command="emoji"]')) return
    closePopover()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopover()
  })

  const themeObserver = new MutationObserver(() => {
    updatePickerTheme()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  })
}

function ensurePopover() {
  if (popoverEl) return popoverEl

  popoverEl = document.createElement('div')
  popoverEl.className = 'emoji-popover'
  popoverEl.innerHTML = `
    <div class="emoji-tabs">
      <button class="emoji-tab active" data-tab="emojis">Emojis</button>
      <button class="emoji-tab" data-tab="symbols">Símbolos</button>
    </div>
    <div class="emoji-panel" data-panel="emojis"></div>
    <div class="emoji-panel" data-panel="symbols" style="display:none;">
      <div class="symbols-grid"></div>
    </div>
  `
  document.body.appendChild(popoverEl)

  pickerEl = document.createElement('emoji-picker')
  pickerEl.addEventListener('emoji-click', (event) => {
    insertEmoji(event.detail.unicode)
  })
  popoverEl.querySelector('[data-panel="emojis"]').appendChild(pickerEl)

  symbolsGridEl = popoverEl.querySelector('.symbols-grid')
  SYMBOLS.forEach((sym) => {
    const btn = document.createElement('button')
    btn.className = 'symbol-btn'
    btn.type = 'button'
    btn.title = sym.name
    btn.textContent = sym.char
    btn.addEventListener('click', () => {
      insertEmoji(sym.char)
    })
    symbolsGridEl.appendChild(btn)
  })

  tabsEl = popoverEl.querySelectorAll('.emoji-tab')
  tabsEl.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab
      tabsEl.forEach((t) => t.classList.toggle('active', t.dataset.tab === activeTab))
      popoverEl.querySelector('[data-panel="emojis"]').style.display =
        activeTab === 'emojis' ? 'block' : 'none'
      popoverEl.querySelector('[data-panel="symbols"]').style.display =
        activeTab === 'symbols' ? 'block' : 'none'
    })
  })

  updatePickerTheme()

  return popoverEl
}

function updatePickerTheme() {
  if (!pickerEl) return
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  pickerEl.classList.toggle('dark', isDark)
}

function togglePopover(triggerBtn) {
  const popover = ensurePopover()
  if (popover.classList.contains('open')) {
    closePopover()
  } else {
    openPopover(triggerBtn)
  }
}

function openPopover(triggerBtn) {
  const popover = ensurePopover()
  const rect = triggerBtn.getBoundingClientRect()

  popover.style.top = `${rect.bottom + 8}px`
  popover.style.left = `${rect.left}px`

  requestAnimationFrame(() => {
    const popoverRect = popover.getBoundingClientRect()
    const overflowRight = popoverRect.right - window.innerWidth
    if (overflowRight > 0) {
      popover.style.left = `${rect.left - overflowRight - 8}px`
    }
    const overflowBottom = popoverRect.bottom - window.innerHeight
    if (overflowBottom > 0) {
      popover.style.top = `${rect.top - popoverRect.height - 8}px`
    }
  })

  popover.classList.add('open')
  popover.style.display = 'flex'
}

function closePopover() {
  if (!popoverEl) return
  popoverEl.classList.remove('open')
  popoverEl.style.display = 'none'
}

function insertEmoji(char) {
  if (!editorRef || !char) return
  editorRef.chain().focus().insertContent(char).run()
}