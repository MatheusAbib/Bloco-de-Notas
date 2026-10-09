import 'emoji-picker-element'
import { SYMBOLS } from '../editor/emojis.js'

let editorRef = null
let popoverEl = null
let pickerEl = null
let symbolsGridEl = null
let tabsEl = null
let activeTab = 'emojis'
let initialized = false

export function initEmojiPicker(editor) {
  if (initialized) return
  initialized = true

  editorRef = editor

  const btns = document.querySelectorAll('[data-command="emoji"]')
  btns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      togglePopover(btn)
    })
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
}

function ensurePopover() {
  if (popoverEl) return popoverEl

  popoverEl = document.createElement('div')
  popoverEl.className = 'emoji-popover'
  popoverEl.innerHTML = `
    <div class="emoji-tabs">
      <button class="emoji-tab active" data-tab="emojis" type="button">Emojis</button>
      <button class="emoji-tab" data-tab="symbols" type="button">Símbolos</button>
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

  return popoverEl
}

function togglePopover(triggerBtn) {
  const popover = ensurePopover()
  if (popover.style.display === 'flex') {
    closePopover()
  } else {
    openPopover(triggerBtn)
  }
}

function openPopover(triggerBtn) {
  const popover = ensurePopover()
  const rect = triggerBtn.getBoundingClientRect()

  popover.style.display = 'flex'
  popover.style.position = 'fixed'
  popover.style.zIndex = '100000'
  popover.style.top = `${rect.bottom + 8}px`
  popover.style.left = `${rect.left}px`

  setTimeout(() => {
    const popRect = popover.getBoundingClientRect()
    if (popRect.right > window.innerWidth - 8) {
      popover.style.left = `${window.innerWidth - popRect.width - 8}px`
    }
    if (popRect.bottom > window.innerHeight - 8) {
      popover.style.top = `${rect.top - popRect.height - 8}px`
    }
  }, 50)
}

function closePopover() {
  if (!popoverEl) return
  popoverEl.style.display = 'none'
}

function insertEmoji(char) {
  if (!editorRef || !char) return
  editorRef.chain().focus().insertContent(char).run()
}