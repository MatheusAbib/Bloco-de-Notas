import { saveAttachment } from '../core/attachments.js'

let editorRef = null
let pendingFile = null

export function initFileDialog(editor) {
  editorRef = editor

  document.addEventListener('open-file-dialog', () => openFileDialog())

  const dialog = ensureDialog()
  const closeBtn = dialog.querySelector('.close-modal')
  const cancelBtn = dialog.querySelector('#file-cancel')
  const confirmBtn = dialog.querySelector('#file-confirm')
  const fileInput = dialog.querySelector('#attach-file')
  const dropZone = dialog.querySelector('#file-drop')
  const fileNameEl = dialog.querySelector('#file-preview-name')

  closeBtn.addEventListener('click', closeDialog)
  cancelBtn.addEventListener('click', closeDialog)
  confirmBtn.addEventListener('click', handleConfirm)

  dropZone.addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) handleFile(file)
  })

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropZone.classList.add('dragover')
  })

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover')
  })

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropZone.classList.remove('dragover')
    const file = e.dataTransfer.files && e.dataTransfer.files[0]
    if (file) handleFile(file)
  })

  function handleFile(file) {
    if (file.type.startsWith('image/')) {
      pendingFile = null
      fileNameEl.textContent = 'Para imagens, use o botão de imagem.'
      fileInput.value = ''
      return
    }
    pendingFile = file
    fileNameEl.textContent = file.name
  }

  async function handleConfirm() {
    if (!editorRef) return

    if (!pendingFile) {
      fileNameEl.textContent = 'Escolha um arquivo primeiro.'
      return
    }

    if (pendingFile.type.startsWith('image/')) {
      fileNameEl.textContent = 'Para imagens, use o botão de imagem.'
      return
    }

    const file = pendingFile

    try {
      const id = await saveAttachment(file)
      const size = formatBytes(file.size)

      editorRef.chain().focus().setAttachment({
        attachmentId: id,
        fileName: file.name,
        fileSize: size,
        fileType: file.type || ''
      }).run()

      editorRef.chain().focus().insertContent(' ').run()

      closeDialog()
    } catch (err) {
      console.error(err)
      fileNameEl.textContent = 'Erro ao anexar o arquivo.'
    }
  }

  dialog.__reset = () => {
    fileNameEl.textContent = ''
    fileInput.value = ''
    pendingFile = null
  }
}

function ensureDialog() {
  let dialog = document.getElementById('file-dialog')
  if (dialog) return dialog

  dialog = document.createElement('div')
  dialog.id = 'file-dialog'
  dialog.className = 'modal'
  dialog.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" title="Fechar">
        <i class="fas fa-times"></i>
      </button>
      <h2><i class="fas fa-paperclip"></i> Anexar Arquivo</h2>

      <label class="image-drop" id="file-drop">
        <i class="fas fa-file-upload"></i>
        <span class="image-drop-title">Arraste um arquivo aqui</span>
        <span class="image-drop-sub">ou clique para escolher do dispositivo</span>
        <input
          type="file"
          id="attach-file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp3,.mp4,.mov,.avi,.json,.xml,.md"
          hidden
        />
      </label>

      <p id="file-preview-name" class="file-name"></p>

      <div class="modal-buttons">
        <button class="btn btn-secondary" id="file-cancel">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
        <button class="btn btn-primary" id="file-confirm">
          <i class="fas fa-check"></i>
          <span>Anexar</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  return dialog
}

function openFileDialog() {
  if (!editorRef) return
  const dialog = ensureDialog()
  if (dialog.__reset) dialog.__reset()
  dialog.style.display = 'flex'
}

function closeDialog() {
  const dialog = document.getElementById('file-dialog')
  if (dialog) dialog.style.display = 'none'
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}