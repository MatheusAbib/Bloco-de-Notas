import { getAttachment } from '../core/attachments.js'

export function initAttachmentHandler() {
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('span[data-attachment-id]')
    if (!el) return

    e.preventDefault()
    e.stopPropagation()

    const id = el.getAttribute('data-attachment-id')
    if (!id) return

    const item = await getAttachment(id)
    if (!item) {
      notify('Anexo não encontrado.', 'error')
      return
    }

    const url = URL.createObjectURL(item.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.name
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(() => URL.revokeObjectURL(url), 300000)

    notify(`Baixando "${item.name}"...`, 'success')
  })
}

function notify(message, type) {
  const event = new CustomEvent('app-notification', {
    detail: { message, type }
  })
  document.dispatchEvent(event)
}