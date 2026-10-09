let dialogEl = null
let resolverAtual = null

export function initConfirmDialog() {
  const existing = document.getElementById('confirm-dialog')
  if (existing) {
    existing.remove()
  }
  dialogEl = null
  ensureDialog()
}

export function confirmar({ titulo, mensagem, confirmarTexto, cancelarTexto, tipo }) {
  return new Promise((resolve) => {
    const dialog = ensureDialog()
    const isDanger = tipo === 'danger'

    dialog.querySelector('.confirm-title').textContent = titulo || 'Confirmar'
    dialog.querySelector('.confirm-message').textContent = mensagem || ''

    const iconWrap = dialog.querySelector('.confirm-icon-wrap')
    iconWrap.className = `confirm-icon-wrap ${isDanger ? 'danger' : ''}`
    iconWrap.innerHTML = `<i class="fas ${isDanger ? 'fa-exclamation-triangle' : 'fa-question-circle'}"></i>`

    const confirmBtn = dialog.querySelector('.confirm-ok')
    const cancelBtn = dialog.querySelector('.confirm-cancel')

    confirmBtn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'} confirm-ok`
    confirmBtn.innerHTML = `<i class="fas fa-check"></i><span>${confirmarTexto || 'Confirmar'}</span>`

    cancelBtn.innerHTML = `<i class="fas fa-times"></i><span>${cancelarTexto || 'Cancelar'}</span>`

    dialog.style.display = 'flex'

    resolverAtual = (result) => {
      dialog.style.display = 'none'
      resolverAtual = null
      resolve(result)
    }
  })
}

function ensureDialog() {
  if (dialogEl && document.body.contains(dialogEl)) return dialogEl

  const stale = document.getElementById('confirm-dialog')
  if (stale) stale.remove()

  dialogEl = document.createElement('div')
  dialogEl.id = 'confirm-dialog'
  dialogEl.className = 'modal'
  dialogEl.innerHTML = `
    <div class="modal-content confirm-content">
      <div class="confirm-icon-wrap">
        <i class="fas fa-question-circle"></i>
      </div>
      <span class="confirm-title">Confirmar</span>
      <p class="confirm-message"></p>
      <div class="confirm-buttons">
        <button class="btn btn-secondary confirm-cancel" type="button">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
        <button class="btn btn-primary confirm-ok" type="button">
          <i class="fas fa-check"></i>
          <span>Confirmar</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(dialogEl)

  dialogEl.querySelector('.confirm-cancel').addEventListener('click', () => {
    if (resolverAtual) resolverAtual(false)
  })

  dialogEl.querySelector('.confirm-ok').addEventListener('click', () => {
    if (resolverAtual) resolverAtual(true)
  })

  dialogEl.addEventListener('click', (e) => {
    if (e.target === dialogEl && resolverAtual) resolverAtual(false)
  })

  document.addEventListener('keydown', (e) => {
    if (!resolverAtual) return
    if (e.key === 'Escape') resolverAtual(false)
    if (e.key === 'Enter') resolverAtual(true)
  })

  return dialogEl
}