import { createNote, openNote } from '../notes/notes.js'
import { addTag, removeTag, renderTagList } from '../notes/tags.js'
import { attachTagAutocomplete } from './tagAutocomplete.js'

let editorRef = null
let selectedColor = '#1a6d5e'
let selectedTagColor = '#e74c3c'
let newTags = []

export function initDialog(editor) {
  editorRef = editor

  document.addEventListener('open-new-note-dialog', () => openDialog())

  const dialog = ensureDialog()
  const closeBtn = dialog.querySelector('.close-modal')
  const saveBtn = dialog.querySelector('#dialog-save')
  const cancelBtn = dialog.querySelector('#dialog-cancel')
  const input = dialog.querySelector('#dialog-name')
  const tagInput = dialog.querySelector('#dialog-tag-input')
  const addTagBtn = dialog.querySelector('#dialog-tag-add')

  closeBtn.addEventListener('click', closeDialog)
  cancelBtn.addEventListener('click', closeDialog)
  saveBtn.addEventListener('click', handleSave)

  addTagBtn.addEventListener('click', handleAddTag)
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeDialog()
    }
  })

  dialog.querySelectorAll('.color-option[data-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dialog.querySelectorAll('.color-option[data-color]').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      selectedColor = btn.dataset.color
    })
  })

  dialog.querySelectorAll('.tag-color-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      dialog.querySelectorAll('.tag-color-option').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      selectedTagColor = btn.dataset.color
      const preview = dialog.querySelector('#dialog-tag-color-preview')
      if (preview) preview.style.background = selectedTagColor
    })
  })

  attachTagAutocomplete(tagInput)

  function handleAddTag() {
    const result = addTag(newTags, tagInput.value, selectedTagColor)
    if (result.error) {
      tagInput.value = ''
      renderTags()
      return
    }
    newTags = result.tags
    tagInput.value = ''
    renderTags()
  }

  function renderTags() {
    const list = dialog.querySelector('#dialog-tag-list')
    const render = () => {
      renderTagList(list, newTags, (index) => {
        newTags = removeTag(newTags, index)
        render()
      })
    }
    render()
  }

  dialog.__renderTags = renderTags
}

function ensureDialog() {
  let dialog = document.getElementById('new-note-dialog')
  if (dialog) return dialog

  dialog = document.createElement('div')
  dialog.id = 'new-note-dialog'
  dialog.className = 'modal'
  dialog.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" title="Fechar">
        <i class="fas fa-times"></i>
      </button>
      <h2><i class="fas fa-plus-circle"></i> Nova Nota</h2>
      <input type="text" id="dialog-name" placeholder="Insira um nome para a sua nota..." autocomplete="off" />
      <div class="tag-input-group">
        <input type="text" id="dialog-tag-input" placeholder="Adicionar tag..." autocomplete="off" />
        <div class="tag-color-picker-wrapper">
          <button class="tag-color-btn" title="Cor da tag" type="button">
            <span class="tag-color-preview" id="dialog-tag-color-preview" style="background:#e74c3c"></span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="tag-color-popover" id="dialog-tag-color-popover" style="display:none;">
            <div class="tag-color-options">
              <button class="tag-color-option active" data-color="#e74c3c" style="background:#e74c3c"></button>
              <button class="tag-color-option" data-color="#3498db" style="background:#3498db"></button>
              <button class="tag-color-option" data-color="#f39c12" style="background:#f39c12"></button>
              <button class="tag-color-option" data-color="#9b59b6" style="background:#9b59b6"></button>
              <button class="tag-color-option" data-color="#1abc9c" style="background:#1abc9c"></button>
              <button class="tag-color-option" data-color="#e67e22" style="background:#e67e22"></button>
              <button class="tag-color-option" data-color="#2ecc71" style="background:#2ecc71"></button>
              <button class="tag-color-option" data-color="#1a6d5e" style="background:#1a6d5e"></button>
            </div>
          </div>
        </div>
        <button class="btn-tag-add" id="dialog-tag-add" title="Adicionar tag" type="button">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <div class="tag-list" id="dialog-tag-list"></div>
      <div class="color-picker">
        <span>Cor da nota:</span>
        <button class="color-option active" data-color="#1a6d5e" style="background:#1a6d5e"></button>
        <button class="color-option" data-color="#e74c3c" style="background:#e74c3c"></button>
        <button class="color-option" data-color="#3498db" style="background:#3498db"></button>
        <button class="color-option" data-color="#f39c12" style="background:#f39c12"></button>
        <button class="color-option" data-color="#9b59b6" style="background:#9b59b6"></button>
        <button class="color-option" data-color="#1abc9c" style="background:#1abc9c"></button>
        <button class="color-option" data-color="#e67e22" style="background:#e67e22"></button>
        <button class="color-option" data-color="#2ecc71" style="background:#2ecc71"></button>
      </div>
      <div class="modal-buttons">
        <button class="btn btn-secondary" id="dialog-cancel">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
        <button class="btn btn-primary" id="dialog-save">
          <i class="fas fa-check"></i>
          <span>Salvar</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  const colorBtn = dialog.querySelector('.tag-color-btn')
  const popover = dialog.querySelector('#dialog-tag-color-popover')
  colorBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    popover.style.display = popover.style.display === 'none' ? 'block' : 'none'
  })

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tag-color-picker-wrapper')) {
      popover.style.display = 'none'
    }
  })

  return dialog
}

function openDialog() {
  const dialog = ensureDialog()
  selectedColor = '#1a6d5e'
  selectedTagColor = '#e74c3c'
  newTags = []

  dialog.querySelectorAll('.color-option').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === selectedColor)
  })

  dialog.querySelectorAll('.tag-color-option').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === '#e74c3c')
  })

  const preview = dialog.querySelector('#dialog-tag-color-preview')
  if (preview) preview.style.background = '#e74c3c'

  const input = dialog.querySelector('#dialog-name')
  input.value = ''
  dialog.querySelector('#dialog-tag-input').value = ''

  if (dialog.__renderTags) dialog.__renderTags()

  dialog.style.display = 'flex'
  setTimeout(() => input.focus(), 50)
}

function closeDialog() {
  const dialog = document.getElementById('new-note-dialog')
  if (dialog) dialog.style.display = 'none'
}

async function handleSave() {
  const dialog = document.getElementById('new-note-dialog')
  const input = dialog.querySelector('#dialog-name')
  const name = input.value.trim()

  if (!name) {
    input.focus()
    return
  }

  const note = await createNote({ name, color: selectedColor, tags: newTags })
  closeDialog()
  await openNote(note.id, editorRef)
  if (editorRef) editorRef.commands.focus()
}