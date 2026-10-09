import state from '../core/state.js'
import { updateNoteMeta } from '../notes/notes.js'
import { addTag, removeTag, renderTagList } from '../notes/tags.js'
import { attachTagAutocomplete } from './tagAutocomplete.js'

let currentEditId = null
let editTags = []
let selectedColor = '#1a6d5e'
let selectedTagColor = '#e74c3c'

export function initEditDialog() {
  document.addEventListener('edit-note', (e) => {
    openEditDialog(e.detail.id)
  })

  const dialog = ensureDialog()
  const closeBtn = dialog.querySelector('.close-modal')
  const saveBtn = dialog.querySelector('#edit-save')
  const cancelBtn = dialog.querySelector('#edit-cancel')
  const nameInput = dialog.querySelector('#edit-name')
  const tagInput = dialog.querySelector('#edit-tag-input')
  const addTagBtn = dialog.querySelector('#edit-tag-add')

  closeBtn.addEventListener('click', closeEditDialog)
  cancelBtn.addEventListener('click', closeEditDialog)
  saveBtn.addEventListener('click', handleSave)

  addTagBtn.addEventListener('click', handleAddTag)
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  })

  attachTagAutocomplete(tagInput)

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeEditDialog()
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
      const preview = dialog.querySelector('#edit-tag-color-preview')
      if (preview) preview.style.background = selectedTagColor
    })
  })

  function handleAddTag() {
    const result = addTag(editTags, tagInput.value, selectedTagColor)
    if (result.error) {
      tagInput.value = ''
      return
    }
    editTags = result.tags
    tagInput.value = ''
    renderTags()
  }

  function renderTags() {
    const list = dialog.querySelector('#edit-tag-list')
    const render = () => {
      renderTagList(list, editTags, (index) => {
        editTags = removeTag(editTags, index)
        render()
      })
    }
    render()
  }

  dialog.__renderTags = renderTags
}

function ensureDialog() {
  let dialog = document.getElementById('edit-note-dialog')
  if (dialog) return dialog

  dialog = document.createElement('div')
  dialog.id = 'edit-note-dialog'
  dialog.className = 'modal'
  dialog.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" title="Fechar">
        <i class="fas fa-times"></i>
      </button>
      <h2><i class="fas fa-pen"></i> Editar Nota</h2>
      <input type="text" id="edit-name" placeholder="Nome da nota" autocomplete="off" />
      <div class="tag-input-group">
        <input type="text" id="edit-tag-input" placeholder="Adicionar tag..." autocomplete="off" />
        <div class="tag-color-picker-wrapper">
          <button class="tag-color-btn" title="Cor da tag" type="button">
            <span class="tag-color-preview" id="edit-tag-color-preview" style="background:#e74c3c"></span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="tag-color-popover" id="edit-tag-color-popover" style="display:none;">
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
        <button class="btn-tag-add" id="edit-tag-add" title="Adicionar tag" type="button">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      <div class="tag-list" id="edit-tag-list"></div>
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
        <button class="btn btn-secondary" id="edit-cancel">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
        <button class="btn btn-primary" id="edit-save">
          <i class="fas fa-check"></i>
          <span>Salvar</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  const colorBtn = dialog.querySelector('.tag-color-btn')
  const popover = dialog.querySelector('#edit-tag-color-popover')
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

function openEditDialog(id) {
  const notes = state.get('notes')
  const note = notes.find((n) => n.id === id)
  if (!note) return

  currentEditId = id
  editTags = note.tags ? JSON.parse(JSON.stringify(note.tags)) : []
  selectedColor = note.color || '#1a6d5e'
  selectedTagColor = '#e74c3c'

  const dialog = ensureDialog()
  dialog.querySelector('#edit-name').value = note.name || ''
  dialog.querySelector('#edit-tag-input').value = ''

  dialog.querySelectorAll('.color-option[data-color]').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === selectedColor)
  })

  dialog.querySelectorAll('.tag-color-option').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === '#e74c3c')
  })

  const preview = dialog.querySelector('#edit-tag-color-preview')
  if (preview) preview.style.background = '#e74c3c'

  if (dialog.__renderTags) {
    dialog.__renderTags()
  }

  dialog.style.display = 'flex'
  setTimeout(() => dialog.querySelector('#edit-name').focus(), 50)
}

function closeEditDialog() {
  const dialog = document.getElementById('edit-note-dialog')
  if (dialog) dialog.style.display = 'none'
  currentEditId = null
}

async function handleSave() {
  if (!currentEditId) return
  const dialog = document.getElementById('edit-note-dialog')
  const name = dialog.querySelector('#edit-name').value.trim()

  if (!name) {
    dialog.querySelector('#edit-name').focus()
    return
  }

  await updateNoteMeta(currentEditId, {
    name,
    tags: editTags,
    color: selectedColor
  })

  closeEditDialog()
}