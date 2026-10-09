import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import BaseImage from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { FontFamily } from '@tiptap/extension-font-family'
import { Node, mergeAttributes, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        }
      }
    }
  }
})

const Image = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width') || element.style.width
          if (!width) return null
          return parseInt(width, 10) || null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width, style: `width: ${attributes.width}px;` }
        }
      }
    }
  }
})

function getFileIcon(type, name) {
  const lowerName = (name || '').toLowerCase()
  const lowerType = (type || '').toLowerCase()

  if (lowerType.includes('pdf') || lowerName.endsWith('.pdf')) return 'fa-file-pdf'
  if (
    lowerType.includes('word') ||
    lowerType.includes('officedocument.wordprocessingml') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx')
  ) {
    return 'fa-file-word'
  }
  if (
    lowerType.includes('excel') ||
    lowerType.includes('spreadsheet') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.csv')
  ) {
    return 'fa-file-excel'
  }
  if (
    lowerType.includes('powerpoint') ||
    lowerType.includes('presentation') ||
    lowerName.endsWith('.ppt') ||
    lowerName.endsWith('.pptx')
  ) {
    return 'fa-file-powerpoint'
  }
  if (
    lowerType.includes('zip') ||
    lowerType.includes('rar') ||
    lowerType.includes('7z') ||
    lowerType.includes('compressed') ||
    lowerName.endsWith('.zip') ||
    lowerName.endsWith('.rar') ||
    lowerName.endsWith('.7z')
  ) {
    return 'fa-file-archive'
  }
  if (lowerType.includes('audio') || lowerName.match(/\.(mp3|wav|ogg|m4a|flac)$/)) {
    return 'fa-file-audio'
  }
  if (lowerType.includes('video') || lowerName.match(/\.(mp4|mov|avi|mkv|webm)$/)) {
    return 'fa-file-video'
  }
  if (lowerType.includes('image') || lowerName.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    return 'fa-file-image'
  }
  if (lowerType.includes('json') || lowerName.endsWith('.json')) return 'fa-file-code'
  if (lowerType.includes('xml') || lowerName.endsWith('.xml')) return 'fa-file-code'
  if (lowerType.includes('text') || lowerName.match(/\.(txt|md|log)$/)) {
    return 'fa-file-lines'
  }
  return 'fa-paperclip'
}

const Attachment = Node.create({
  name: 'attachment',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => {
          if (!attributes.attachmentId) return {}
          return { 'data-attachment-id': attributes.attachmentId }
        }
      },
      fileName: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-attachment-name'),
        renderHTML: (attributes) => {
          if (!attributes.fileName) return {}
          return { 'data-attachment-name': attributes.fileName }
        }
      },
      fileSize: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-attachment-size'),
        renderHTML: (attributes) => {
          if (!attributes.fileSize) return {}
          return { 'data-attachment-size': attributes.fileSize }
        }
      },
      fileIcon: {
        default: 'fa-paperclip',
        parseHTML: (element) => element.getAttribute('data-attachment-icon') || 'fa-paperclip',
        renderHTML: (attributes) => {
          const icon = attributes.fileIcon || 'fa-paperclip'
          return { 'data-attachment-icon': icon }
        }
      }
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-attachment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const name = HTMLAttributes['data-attachment-name'] || 'arquivo'
    const size = HTMLAttributes['data-attachment-size'] || ''
    const icon = HTMLAttributes['data-attachment-icon'] || 'fa-paperclip'
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'attachment-link',
        title: name
      }),
      ['i', { class: `fas ${icon} attachment-icon` }],
      ['span', { class: 'attachment-name' }, name],
      ['span', { class: 'attachment-size' }, size]
    ]
  },

  addCommands() {
    return {
      setAttachment:
        (attrs) =>
        ({ commands }) => {
          const icon = getFileIcon(attrs.fileType, attrs.fileName)
          return commands.insertContent({
            type: this.name,
            attrs: {
              attachmentId: attrs.attachmentId,
              fileName: attrs.fileName,
              fileSize: attrs.fileSize,
              fileIcon: icon
            }
          })
        }
    }
  }
})

const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const padding = element.style.paddingLeft
              if (!padding) return 0
              const value = parseInt(padding, 10)
              if (isNaN(value)) return 0
              return Math.round(value / 40)
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {}
              return { style: `padding-left: ${attributes.indent * 40}px` }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          let changed = false
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return
            const currentIndent = node.attrs.indent || 0
            if (currentIndent >= this.options.maxLevel) return
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: currentIndent + 1
            })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          let changed = false
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return
            const currentIndent = node.attrs.indent || 0
            if (currentIndent <= this.options.minLevel) return
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: currentIndent - 1
            })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        }
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.indent()
      },
      'Shift-Tab': () => {
        return this.editor.commands.outdent()
      },
      Backspace: () => {
        const { state } = this.editor
        const { selection } = state
        const { $from, empty } = selection

        if (!empty) return false

        if ($from.parentOffset !== 0) return false

        const node = $from.parent
        if (!this.options.types.includes(node.type.name)) return false

        const indent = node.attrs.indent || 0
        if (indent <= 0) return false

        return this.editor.commands.outdent()
      }
    }
  }
})

const Placeholder = Extension.create({
  name: 'placeholder',

  addOptions() {
    return {
      placeholder: 'Escreva suas notas aqui...'
    }
  },

  addProseMirrorPlugins() {
    const options = this.options

    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations(state) {
            const doc = state.doc
            if (
              doc.childCount === 1 &&
              doc.firstChild &&
              doc.firstChild.isTextblock &&
              doc.firstChild.content.size === 0
            ) {
              const firstChild = doc.firstChild
              const deco = Decoration.node(0, firstChild.nodeSize, {
                class: 'is-editor-empty',
                'data-placeholder': options.placeholder
              })
              return DecorationSet.create(doc, [deco])
            }
            return DecorationSet.empty
          }
        }
      })
    ]
  }
})

export function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
      horizontalRule: false
    }),
    Underline,
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank'
      }
    }),
    Image.configure({
      inline: false,
      allowBase64: true
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    TaskList,
    TaskItem.configure({
      nested: true
    }),
    Attachment,
    Indent,
    Placeholder.configure({
      placeholder: 'Escreva suas notas aqui...'
    })
  ]
}