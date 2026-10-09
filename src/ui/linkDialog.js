import state from '../core/state.js'

let editorRef = null
let savedRange = null

export function initLinkDialog(editor) {
  editorRef = editor

  document.addEventListener('open-link-dialog', () => openLinkDialog())

  const dialog = ensureDialog()
  const closeBtn = dialog.querySelector('.close-modal')
  const cancelBtn = dialog.querySelector('#link-cancel')
  const confirmBtn = dialog.querySelector('#link-confirm')
  const urlInput = dialog.querySelector('#link-url')
  const textInput = dialog.querySelector('#link-text')

  closeBtn.addEventListener('click', closeDialog)
  cancelBtn.addEventListener('click', closeDialog)
  confirmBtn.addEventListener('click', handleConfirm)

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeDialog()
    }
  })

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeDialog()
    }
  })
}

function ensureDialog() {
  let dialog = document.getElementById('link-dialog')
  if (dialog) return dialog

  dialog = document.createElement('div')
  dialog.id = 'link-dialog'
  dialog.className = 'modal'
  dialog.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" title="Fechar">
        <i class="fas fa-times"></i>
      </button>
      <h2><i class="fas fa-link"></i> Inserir Link</h2>
      <input type="text" id="link-url" placeholder="URL do link..." autocomplete="off" />
      <input type="text" id="link-text" placeholder="Texto do link (opcional)..." autocomplete="off" />
      <div class="modal-buttons">
        <button class="btn btn-secondary" id="link-cancel">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
        <button class="btn btn-primary" id="link-confirm">
          <i class="fas fa-check"></i>
          <span>Inserir</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  return dialog
}

function openLinkDialog() {
  if (!editorRef) return
  const { from, to } = editorRef.state.selection
  savedRange = { from, to }
  const selectedText = editorRef.state.doc.textBetween(from, to, ' ')

  const dialog = ensureDialog()
  dialog.querySelector('#link-url').value = ''
  dialog.querySelector('#link-text').value = selectedText || ''
  dialog.style.display = 'flex'

  setTimeout(() => dialog.querySelector('#link-url').focus(), 50)
}

function closeDialog() {
  const dialog = document.getElementById('link-dialog')
  if (dialog) dialog.style.display = 'none'
  savedRange = null
}

function handleConfirm() {
  if (!editorRef) return
  const dialog = document.getElementById('link-dialog')
  const rawUrl = dialog.querySelector('#link-url').value.trim()
  const text = dialog.querySelector('#link-text').value.trim()

  if (!rawUrl) {
    dialog.querySelector('#link-url').focus()
    return
  }

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  if (savedRange && savedRange.from !== savedRange.to) {
    const chain = editorRef.chain().focus().setTextSelection(savedRange)
    if (text) {
      chain.insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`).run()
    } else {
      chain.extendMarkRange('link').setLink({ href: url }).run()
    }
  } else {
    const label = text || url
    editorRef.chain().focus().insertContent(
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
    ).run()
  }

  closeDialog()
}