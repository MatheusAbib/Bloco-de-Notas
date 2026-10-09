let editorRef = null
let floatBtnEl = null
let menuEl = null
let resizePanelEl = null
let activeImage = null
let cropOverlayEl = null
let hideTimeout = null

export function initImageContext(editor) {
  editorRef = editor

  const editorEl = document.getElementById('editor')
  if (!editorEl) return

  ensureFloatButton()
  ensureMenu()
  ensureResizePanel()

  editorEl.addEventListener('mouseover', (e) => {
    const img = e.target.closest('img')
    if (!img) return
    if (cropOverlayEl) return
    clearTimeout(hideTimeout)
    activeImage = img
    showFloatButton(img)
  })

  editorEl.addEventListener('mouseout', (e) => {
    const related = e.relatedTarget
    if (related && (isInside(floatBtnEl, related) || isInside(menuEl, related) || isInside(resizePanelEl, related))) return

    const img = e.target.closest('img')
    if (!img) return

    const goingTo = related && related.closest ? related.closest('img') : null
    if (goingTo === img) return

    scheduleHide()
  })

  floatBtnEl.addEventListener('mouseenter', () => clearTimeout(hideTimeout))
  floatBtnEl.addEventListener('mouseleave', () => scheduleHide())

  menuEl.addEventListener('mouseenter', () => clearTimeout(hideTimeout))
  menuEl.addEventListener('mouseleave', () => {
    if (menuEl.style.display === 'block') return
    scheduleHide()
  })

  resizePanelEl.addEventListener('mouseenter', () => clearTimeout(hideTimeout))
  resizePanelEl.addEventListener('mouseleave', () => {
    if (resizePanelEl.style.display === 'block') return
    scheduleHide()
  })

  editorEl.addEventListener('click', (e) => {
    const img = e.target.closest('img')
    if (!img) return
    if (window.matchMedia('(max-width: 768px)').matches) {
      clearTimeout(hideTimeout)
      activeImage = img
      showFloatButton(img)
    }
  })

  document.addEventListener('click', (e) => {
    if (isInside(floatBtnEl, e.target)) return
    if (isInside(menuEl, e.target)) return
    if (isInside(resizePanelEl, e.target)) return
    if (e.target.closest && e.target.closest('img')) return
    hideMenu()
    hideResizePanel()
    hideFloatButton()
  })
}

function isInside(el, target) {
  return el && target && el.contains && el.contains(target)
}

function scheduleHide() {
  clearTimeout(hideTimeout)
  hideTimeout = setTimeout(() => {
    if (isHovering(floatBtnEl) || isHovering(menuEl) || isHovering(resizePanelEl)) return
    if (menuEl && menuEl.style.display === 'block') return
    if (resizePanelEl && resizePanelEl.style.display === 'block') return
    hideFloatButton()
  }, 250)
}

function isHovering(el) {
  return el && el.matches && el.matches(':hover')
}

function ensureFloatButton() {
  if (floatBtnEl) return floatBtnEl

  floatBtnEl = document.createElement('button')
  floatBtnEl.type = 'button'
  floatBtnEl.className = 'image-float-btn'
  floatBtnEl.innerHTML = '<i class="fas fa-ellipsis-vertical"></i>'
  floatBtnEl.style.display = 'none'
  floatBtnEl.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!activeImage) return
    clearTimeout(hideTimeout)
    hideResizePanel()
    const rect = floatBtnEl.getBoundingClientRect()
    showMenu(rect.right + 8, rect.top)
  })
  document.body.appendChild(floatBtnEl)

  return floatBtnEl
}

function ensureMenu() {
  if (menuEl) return menuEl

  menuEl = document.createElement('div')
  menuEl.className = 'image-context-menu'
  menuEl.innerHTML = `
    <button data-action="resize"><i class="fas fa-expand"></i> Redimensionar</button>
    <button data-action="crop"><i class="fas fa-crop"></i> Cortar</button>
    <button data-action="resize-small"><i class="fas fa-search-minus"></i> Diminuir 20%</button>
    <button data-action="resize-large"><i class="fas fa-search-plus"></i> Aumentar 20%</button>
    <button data-action="reset"><i class="fas fa-undo"></i> Tamanho original</button>
    <button data-action="copy-src"><i class="fas fa-link"></i> Copiar URL</button>
    <button data-action="remove" class="danger"><i class="fas fa-trash"></i> Remover</button>
  `
  document.body.appendChild(menuEl)

  menuEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      hideMenu()
      handleAction(action)
    })
  })

  return menuEl
}

function ensureResizePanel() {
  if (resizePanelEl) return resizePanelEl

  resizePanelEl = document.createElement('div')
  resizePanelEl.className = 'image-resize-panel'
  resizePanelEl.innerHTML = `
    <div class="resize-row">
      <label>Largura</label>
      <input type="number" id="resize-width" min="20" max="4000" />
      <span>px</span>
    </div>
    <div class="resize-row">
      <label>Altura</label>
      <input type="number" id="resize-height" min="20" max="4000" />
      <span>px</span>
    </div>
    <label class="resize-lock">
      <input type="checkbox" id="resize-lock" checked />
      <span>Manter proporção</span>
    </label>
    <div class="resize-actions">
      <button type="button" class="btn-resize-cancel">Cancelar</button>
      <button type="button" class="btn-resize-apply">Aplicar</button>
    </div>
  `
  document.body.appendChild(resizePanelEl)

  const widthInput = resizePanelEl.querySelector('#resize-width')
  const heightInput = resizePanelEl.querySelector('#resize-height')
  const lockInput = resizePanelEl.querySelector('#resize-lock')

  let aspect = 1

  widthInput.addEventListener('input', () => {
    if (!lockInput.checked) return
    const w = parseInt(widthInput.value, 10)
    if (!w) return
    heightInput.value = Math.round(w / aspect)
  })

  heightInput.addEventListener('input', () => {
    if (!lockInput.checked) return
    const h = parseInt(heightInput.value, 10)
    if (!h) return
    widthInput.value = Math.round(h * aspect)
  })

  resizePanelEl.querySelector('.btn-resize-cancel').addEventListener('click', () => {
    hideResizePanel()
  })

  resizePanelEl.querySelector('.btn-resize-apply').addEventListener('click', () => {
    if (!activeImage) return
    const pos = getImagePos(activeImage)
    if (pos == null) return

    const w = parseInt(widthInput.value, 10)
    if (!w || w < 20) return

    replaceImageNode(pos, { width: w })
    hideResizePanel()
    hideFloatButton()
    notify('Imagem redimensionada.', 'success')
  })

  resizePanelEl.__setAspect = (a) => {
    aspect = a
  }

  return resizePanelEl
}

function showFloatButton(img) {
  const btn = ensureFloatButton()
  const rect = img.getBoundingClientRect()
  const btnSize = 32

  let left = rect.right - btnSize - 6
  let top = rect.top + 6

  if (left < 0) left = 6
  if (top < 0) top = 6
  if (top + btnSize > window.innerHeight - 6) {
    top = window.innerHeight - btnSize - 6
  }

  btn.style.left = `${left}px`
  btn.style.top = `${top}px`
  btn.style.display = 'flex'
}

function hideFloatButton() {
  if (floatBtnEl) floatBtnEl.style.display = 'none'
}

function showMenu(x, y) {
  const menu = ensureMenu()
  menu.style.display = 'block'
  menu.style.left = '0px'
  menu.style.top = '0px'

  const rect = menu.getBoundingClientRect()
  let left = x
  let top = y

  if (left + rect.width > window.innerWidth - 8) {
    left = window.innerWidth - rect.width - 8
  }
  if (top + rect.height > window.innerHeight - 8) {
    top = window.innerHeight - rect.height - 8
  }
  if (left < 8) left = 8
  if (top < 8) top = 8

  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
}

function hideMenu() {
  if (menuEl) menuEl.style.display = 'none'
}

function showResizePanel(img) {
  const panel = ensureResizePanel()
  const rect = img.getBoundingClientRect()

  const naturalW = img.naturalWidth || rect.width
  const naturalH = img.naturalHeight || rect.height
  const aspect = naturalW / naturalH

  panel.__setAspect(aspect)

  const currentW =
    parseInt(img.getAttribute('width'), 10) || Math.round(rect.width)
  const currentH = Math.round(currentW / aspect)

  panel.querySelector('#resize-width').value = currentW
  panel.querySelector('#resize-height').value = currentH

  let left = rect.right + 12
  let top = rect.top

  panel.style.display = 'block'
  panel.style.left = '0px'
  panel.style.top = '0px'

  const panelRect = panel.getBoundingClientRect()

  if (left + panelRect.width > window.innerWidth - 8) {
    left = rect.left - panelRect.width - 12
  }
  if (left < 8) left = 8
  if (top + panelRect.height > window.innerHeight - 8) {
    top = window.innerHeight - panelRect.height - 8
  }
  if (top < 8) top = 8

  panel.style.left = `${left}px`
  panel.style.top = `${top}px`

  setTimeout(() => panel.querySelector('#resize-width').focus(), 50)
}

function hideResizePanel() {
  if (resizePanelEl) resizePanelEl.style.display = 'none'
}

function getImagePos(img) {
  try {
    return editorRef.view.posAtDOM(img, 0)
  } catch {
    return null
  }
}

function replaceImageNode(pos, attrs) {
  editorRef.chain().focus().command(({ tr, state }) => {
    const node = state.doc.nodeAt(pos)
    if (!node || node.type.name !== 'image') return false
    const newNode = node.type.create({ ...node.attrs, ...attrs })
    tr.replaceWith(pos, pos + node.nodeSize, newNode)
    return true
  }).run()
}

function handleAction(action) {
  if (!editorRef || !activeImage) return
  const pos = getImagePos(activeImage)
  if (pos == null) return

  if (action === 'remove') {
    editorRef.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
    activeImage = null
    hideFloatButton()
    notify('Imagem removida.', 'error')
    return
  }

  if (action === 'copy-src') {
    const src = activeImage.src
    if (src && navigator.clipboard) {
      navigator.clipboard.writeText(src)
      notify('URL copiada.', 'success')
    }
    return
  }

  if (action === 'resize') {
    showResizePanel(activeImage)
    return
  }

  if (action === 'reset') {
    replaceImageNode(pos, { width: null })
    notify('Tamanho original restaurado.', 'success')
    return
  }

  if (action === 'resize-small' || action === 'resize-large') {
    const factor = action === 'resize-small' ? 0.8 : 1.2

    const widthAttr = parseInt(activeImage.getAttribute('width'), 10)
    const visibleWidth = Math.round(activeImage.getBoundingClientRect().width)
    const current = widthAttr || visibleWidth

    let newWidth = Math.round(current * factor)

    const minWidth = 40
    const naturalW = activeImage.naturalWidth || 2000
    const maxWidth = Math.min(naturalW * 2, 2000)
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

    replaceImageNode(pos, { width: newWidth })
    notify(
      action === 'resize-small' ? 'Imagem diminuída.' : 'Imagem aumentada.',
      'success'
    )
    return
  }

  if (action === 'crop') {
    openCropOverlay(activeImage, pos)
  }
}

function openCropOverlay(img, pos) {
  closeCropOverlay()

  const overlay = document.createElement('div')
  overlay.className = 'crop-overlay'
  overlay.innerHTML = `
    <div class="crop-box">
      <div class="crop-container">
        <img src="${img.src}" id="crop-image" />
        <div class="crop-selection" id="crop-selection"></div>
      </div>
      <div class="crop-actions">
        <button class="btn-crop-cancel" type="button">Cancelar</button>
        <button class="btn-crop-confirm" type="button">Cortar</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
  cropOverlayEl = overlay

  const cropImg = overlay.querySelector('#crop-image')
  const selection = overlay.querySelector('#crop-selection')

  let isDragging = false
  let startX = 0
  let startY = 0

  const getLocalPos = (e) => {
    const rect = cropImg.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top))
    }
  }

  const onStart = (e) => {
    e.preventDefault()
    isDragging = true
    const p = getLocalPos(e)
    startX = p.x
    startY = p.y
    selection.style.display = 'block'
    selection.style.left = `${p.x}px`
    selection.style.top = `${p.y}px`
    selection.style.width = '0px'
    selection.style.height = '0px'
  }

  const onMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const p = getLocalPos(e)
    const left = Math.min(startX, p.x)
    const top = Math.min(startY, p.y)
    const width = Math.abs(p.x - startX)
    const height = Math.abs(p.y - startY)
    selection.style.left = `${left}px`
    selection.style.top = `${top}px`
    selection.style.width = `${width}px`
    selection.style.height = `${height}px`
  }

  const onEnd = () => {
    isDragging = false
  }

  cropImg.addEventListener('mousedown', onStart)
  cropImg.addEventListener('touchstart', onStart, { passive: false })
  document.addEventListener('mousemove', onMove)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchend', onEnd)

  const cleanup = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchend', onEnd)
  }

  overlay.querySelector('.btn-crop-cancel').addEventListener('click', () => {
    cleanup()
    closeCropOverlay()
  })

  overlay.querySelector('.btn-crop-confirm').addEventListener('click', () => {
    const rect = selection.getBoundingClientRect()
    const imgRect = cropImg.getBoundingClientRect()

    const cropX = rect.left - imgRect.left
    const cropY = rect.top - imgRect.top
    const cropW = rect.width
    const cropH = rect.height

    if (cropW < 10 || cropH < 10) {
      notify('Selecione uma área maior.', 'error')
      cleanup()
      closeCropOverlay()
      return
    }

    const scaleX = cropImg.naturalWidth / imgRect.width
    const scaleY = cropImg.naturalHeight / imgRect.height

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(cropW * scaleX)
    canvas.height = Math.round(cropH * scaleY)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      cropImg,
      cropX * scaleX,
      cropY * scaleY,
      cropW * scaleX,
      cropH * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const newSrc = canvas.toDataURL('image/png')
    replaceImageNode(pos, { src: newSrc, width: null })

    cleanup()
    closeCropOverlay()
    hideFloatButton()
    notify('Imagem cortada.', 'success')
  })
}

function closeCropOverlay() {
  if (cropOverlayEl) {
    cropOverlayEl.remove()
    cropOverlayEl = null
  }
}

function notify(message, type) {
  const event = new CustomEvent('app-notification', {
    detail: { message, type }
  })
  document.dispatchEvent(event)
}