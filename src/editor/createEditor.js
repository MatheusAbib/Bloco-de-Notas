import { Editor } from '@tiptap/core'
import { buildExtensions } from './extensions.js'

export function createEditor({ element, content = '', onUpdate, onSelectionChange }) {
  const editor = new Editor({
    element,
    extensions: buildExtensions(),
    content,
    editable: false,
    editorProps: {
      attributes: {
        spellcheck: 'false'
      },
      handleClick: (view, pos, event) => {
        const target = event.target
        if (target.tagName === 'A') {
          const href = target.getAttribute('href') || ''
          if (href.startsWith('attachment://')) {
            event.preventDefault()
            return true
          }
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      if (onSelectionChange) onSelectionChange(editor)
    },
    onTransaction: ({ editor }) => {
      if (onSelectionChange) onSelectionChange(editor)
    }
  })

  return editor
}