import './styles/base.css'
import './styles/layout.css'
import './styles/sidebar.css'
import './styles/editor.css'
import './styles/modals.css'

import { initTheme } from './core/theme.js'
import { createEditor } from './editor/createEditor.js'
import { bindToolbar, updateToolbarState } from './editor/toolbar.js'
import { initSidebar } from './ui/sidebar.js'
import { initDialog } from './ui/dialog.js'
import { initEditDialog } from './ui/editDialog.js'
import { initLinkDialog } from './ui/linkDialog.js'
import { initImageDialog } from './ui/imageDialog.js'
import { initFileDialog } from './ui/fileDialog.js'
import { initConfirmDialog } from './ui/confirmDialog.js'
import { initNotifications, showNotification } from './ui/notifications.js'
import { initFocusMode } from './ui/focusMode.js'
import { initToolbarToggle } from './ui/toolbarToggle.js'
import { initEmojiPicker } from './ui/emojiPicker.js'
import { initNoteSearch } from './ui/noteSearch.js'
import { initImageContext } from './editor/imageContext.js'
import { initAttachmentHandler } from './editor/attachmentHandler.js'
import {
  loadNotes,
  scheduleAutoSave,
  getCurrentNote,
  saveCurrentNote,
  closeCurrentNote
} from './notes/notes.js'
import state from './core/state.js'
import { initFilters } from './notes/filters.js'
import { initBatch } from './notes/batch.js'
import { formatDateTime } from './utils/dates.js'

async function init() {
  console.log('Bloco de Notas v2 — inicializando...')

  await initTheme()
  await loadNotes()

  const editorElement = document.getElementById('editor')
  const editor = createEditor({
    element: editorElement,
    content: '',
    onUpdate: (ed) => {
      updateStats(ed)
      if (getCurrentNote()) {
        scheduleAutoSave(ed)
      }
    },
    onSelectionChange: (ed) => {
      updateToolbarState(ed)
    }
  })

  bindToolbar(editor)
  initSidebar(editor)
  initEditorStateBinding(editor)
  initDialog(editor)
  initEditDialog()
  initLinkDialog(editor)
  initImageDialog(editor)
  initFileDialog(editor)
  initFilters()
  initBatch()
  initNotifications()
  initConfirmDialog()
  initFocusMode()
  initToolbarToggle()
  initEmojiPicker(editor)
  initNoteSearch(editor)
  initImageContext(editor)
  initAttachmentHandler()
  initActionButtons(editor)
  initKeyboardShortcuts(editor)
  updateStats(editor)

  window.__editor = editor

  console.log('Bloco de Notas v2 — pronto')
}

function initEditorStateBinding(editor) {
  const updateEditorState = () => {
    const hasNote = !!state.get('currentNoteId')

    editor.setEditable(hasNote)

    const noteButtons = document.getElementById('note-buttons')
    if (noteButtons) {
      noteButtons.style.display = hasNote ? 'flex' : 'none'
    }

    const toolbar = document.getElementById('editor-toolbar')
    if (toolbar) {
      if (!hasNote) {
        toolbar.classList.add('disabled')
      } else {
        toolbar.classList.remove('disabled')
      }
    }

    editor.view.dispatch(editor.state.tr)
  }

  state.subscribe('currentNoteId', updateEditorState)

  updateEditorState()
}

function initActionButtons(editor) {
  const saveBtn = document.getElementById('save-note-btn')
  const closeBtn = document.getElementById('close-note-btn')

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const current = getCurrentNote()
      if (!current) {
        showNotification('Nenhuma nota aberta.', 'error')
        return
      }
      await saveCurrentNote(editor)
    })
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      const current = getCurrentNote()
      if (!current) {
        showNotification('Nenhuma nota aberta.', 'error')
        return
      }
      await closeCurrentNote(editor)
    })
  }
}

function initKeyboardShortcuts(editor) {
  document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey

    if (isCtrl && e.key.toLowerCase() === 's') {
      e.preventDefault()
      const current = getCurrentNote()
      if (!current) {
        showNotification('Nenhuma nota aberta.', 'error')
        return
      }
      saveCurrentNote(editor)
      return
    }

    if (isCtrl && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      const event = new CustomEvent('open-new-note-dialog')
      document.dispatchEvent(event)
      return
    }
  })
}

function updateStats(editor) {
  const text = editor.getText()
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const wordEl = document.getElementById('word-count')
  const charEl = document.getElementById('char-count')
  if (wordEl) wordEl.textContent = `Palavras: ${words}`
  if (charEl) charEl.textContent = `Caracteres: ${text.length}`

  const current = getCurrentNote()
  const createdEl = document.getElementById('created-date')
  const editedEl = document.getElementById('edited-date')

  if (current && createdEl && editedEl) {
    createdEl.textContent = `Criado: ${formatDateTime(current.createdAt)}`
    editedEl.textContent = `Editado: ${formatDateTime(current.updatedAt)}`
  } else if (createdEl && editedEl) {
    createdEl.textContent = ''
    editedEl.textContent = ''
  }
}

init()