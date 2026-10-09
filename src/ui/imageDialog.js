let editorRef = null
let savedRange = null
let pendingDataUrl = null

export function initImageDialog(editor) {
  editorRef = editor

  document.addEventListener('open-image-dialog', () => openImageDialog())

  const dialog = ensureDialog()
  const closeBtn = dialog.querySelector('.close-modal')
  const cancelBtn = dialog.querySelector('#image-cancel')
  const confirmBtn = dialog.querySelector('#image-confirm')
  const urlInput = dialog.querySelector('#image-url')
  const fileInput = dialog.querySelector('#image-file')
  const dropZone = dialog.querySelector('#image-drop')
  const previewImg = dialog.querySelector('#image-preview')
  const previewName = dialog.querySelector('#image-preview-name')

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

  urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim()
    if (url) {
      pendingDataUrl = null
      showPreview(url, 'URL')
    } else {
      hidePreview()
    }
  })

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      previewName.textContent = 'Arquivo inválido — escolha uma imagem.'
      previewImg.style.display = 'none'
      pendingDataUrl = null
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      pendingDataUrl = ev.target.result
      urlInput.value = ''
      showPreview(ev.target.result, file.name)
    }
    reader.readAsDataURL(file)
  }

  function showPreview(src, label) {
    previewImg.src = src
    previewImg.style.display = 'block'
    previewName.textContent = label
  }

  function hidePreview() {
    previewImg.src = ''
    previewImg.style.display = 'none'
    previewName.textContent = ''
    pendingDataUrl = null
  }

  function handleConfirm() {
    if (!editorRef) return

    const url = urlInput.value.trim()

    if (pendingDataUrl) {
      editorRef.chain().focus().setImage({ src: pendingDataUrl }).run()
      closeDialog()
      return
    }

    if (url) {
      editorRef.chain().focus().setImage({ src: url }).run()
      closeDialog()
      return
    }

    urlInput.focus()
  }

  dialog.__reset = () => {
    urlInput.value = ''
    fileInput.value = ''
    hidePreview()
  }
}

function ensureDialog() {
  let dialog = document.getElementById('image-dialog')
  if (dialog) return dialog

  dialog = document.createElement('div')
  dialog.id = 'image-dialog'
  dialog.className = 'modal'
  dialog.innerHTML = `
    <div class="modal-content">
      <button class="close-modal" title="Fechar">
        <i class="fas fa-times"></i>
      </button>
      <h2><i class="fas fa-image"></i> Inserir Imagem</h2>

      <label class="image-drop" id="image-drop">
        <i class="fas fa-cloud-upload-alt"></i>
        <span class="image-drop-title">Arraste uma imagem aqui</span>
        <span class="image-drop-sub">ou clique para escolher do dispositivo</span>
        <input type="file" id="image-file" accept="image/*" hidden />
      </label>

      <img id="image-preview" class="image-preview" alt="" />
      <p id="image-preview-name" class="file-name"></p>

      <div class="url-divider"><span>ou</span></div>

      <input type="text" id="image-url" placeholder="Cole a URL da imagem..." autocomplete="off" />

      <div class="modal-buttons">
        <button class="btn btn-secondary" id="image-cancel">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
        <button class="btn btn-primary" id="image-confirm">
          <i class="fas fa-check"></i>
          <span>Inserir</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  return dialog
}

function openImageDialog() {
  if (!editorRef) return
  const { from, to } = editorRef.state.selection
  savedRange = { from, to }

  const dialog = ensureDialog()
  if (dialog.__reset) dialog.__reset()
  dialog.style.display = 'flex'
  setTimeout(() => dialog.querySelector('#image-url').focus(), 50)
}

function closeDialog() {
  const dialog = document.getElementById('image-dialog')
  if (dialog) dialog.style.display = 'none'
  savedRange = null
}