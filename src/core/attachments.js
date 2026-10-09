import localforage from 'localforage'

const STORE_NAME = 'bloco-de-notas-attachments'

const store = localforage.createInstance({
  name: 'bloco-de-notas',
  storeName: STORE_NAME
})

export async function saveAttachment(file) {
  const id = generateId()
  const blob = new Blob([file], { type: file.type || 'application/octet-stream' })
  await store.setItem(id, {
    blob,
    name: file.name,
    size: file.size,
    type: file.type,
    createdAt: Date.now()
  })
  return id
}

export async function getAttachment(id) {
  return store.getItem(id)
}

export async function deleteAttachment(id) {
  return store.removeItem(id)
}

export async function listAttachments() {
  const keys = await store.keys()
  return keys
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}