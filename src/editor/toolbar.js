const ACTIONS = {
  bold: (editor) => editor.chain().focus().toggleBold().run(),
  italic: (editor) => editor.chain().focus().toggleItalic().run(),
  underline: (editor) => editor.chain().focus().toggleUnderline().run(),
  strike: (editor) => editor.chain().focus().toggleStrike().run(),
  highlight: (editor) => editor.chain().focus().toggleHighlight().run(),
  bulletList: (editor) => editor.chain().focus().toggleBulletList().run(),
  orderedList: (editor) => editor.chain().focus().toggleOrderedList().run(),
  taskList: (editor) => editor.chain().focus().toggleTaskList().run(),
  undo: (editor) => editor.chain().focus().undo().run(),
  redo: (editor) => editor.chain().focus().redo().run(),
  'align-left': (editor) => editor.chain().focus().setTextAlign('left').run(),
  'align-center': (editor) => editor.chain().focus().setTextAlign('center').run(),
  'align-right': (editor) => editor.chain().focus().setTextAlign('right').run(),
  'align-justify': (editor) => editor.chain().focus().setTextAlign('justify').run(),
  indent: (editor) => editor.chain().focus().indent().run(),
  outdent: (editor) => editor.chain().focus().outdent().run(),
  uppercase: (editor) => transformSelection(editor, 'uppercase'),
  lowercase: (editor) => transformSelection(editor, 'lowercase'),
  capitalize: (editor) => transformSelection(editor, 'capitalize'),
  link: () => {
    const event = new CustomEvent('open-link-dialog')
    document.dispatchEvent(event)
  },
  image: () => {
    const event = new CustomEvent('open-image-dialog')
    document.dispatchEvent(event)
  },
  attachment: () => {
    const event = new CustomEvent('open-file-dialog')
    document.dispatchEvent(event)
  }
}

const STATE_CHECKS = {
  bold: (editor) => editor.isActive('bold'),
  italic: (editor) => editor.isActive('italic'),
  underline: (editor) => editor.isActive('underline'),
  strike: (editor) => editor.isActive('strike'),
  highlight: (editor) => editor.isActive('highlight'),
  bulletList: (editor) => editor.isActive('bulletList'),
  orderedList: (editor) => editor.isActive('orderedList'),
  taskList: (editor) => editor.isActive('taskList'),
  'align-left': (editor) => editor.isActive({ textAlign: 'left' }),
  'align-center': (editor) => editor.isActive({ textAlign: 'center' }),
  'align-right': (editor) => editor.isActive({ textAlign: 'right' }),
  'align-justify': (editor) => editor.isActive({ textAlign: 'justify' })
}

function getSelectedText(editor) {
  const { state } = editor
  const { from, to } = state.selection
  if (from === to) return null
  return state.doc.textBetween(from, to, '\n', '\n')
}

function isAllUppercase(text) {
  if (!text) return false
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return false
  return letters === letters.toUpperCase()
}

function isAllLowercase(text) {
  if (!text) return false
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return false
  return letters === letters.toLowerCase()
}

function isCapitalized(text) {
  if (!text) return false
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return false
  if (isAllUppercase(text)) return false
  if (isAllLowercase(text)) return false
  const words = text.trim().split(/\s+/)
  if (!words.length) return false
  return words.every((word) => {
    const firstLetter = word.match(/[a-zA-ZÀ-ÿ]/)
    if (!firstLetter) return true
    return firstLetter[0] === firstLetter[0].toUpperCase()
  })
}

function transformSelection(editor, mode) {
  const { state } = editor
  const { from, to } = state.selection
  if (from === to) return

  const text = state.doc.textBetween(from, to, '\n', '\n')
  let transformed = text

  if (mode === 'uppercase') {
    transformed = text.toUpperCase()
  } else if (mode === 'lowercase') {
    transformed = text.toLowerCase()
  } else if (mode === 'capitalize') {
    transformed = text
      .toLowerCase()
      .replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toUpperCase())
  }

  editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, transformed)
    .setTextSelection({ from, to })
    .run()
}

export function bindToolbar(editor) {
  const buttons = document.querySelectorAll('.toolbar-btn[data-command]')

  buttons.forEach((btn) => {
    const command = btn.dataset.command
    const action = ACTIONS[command]
    if (!action) return
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault()
    })
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      action(editor)
    })
  })

  const fontColorPicker = document.getElementById('font-color-picker')
  if (fontColorPicker) {
    fontColorPicker.addEventListener('input', (e) => {
      editor.chain().focus().setColor(e.target.value).run()
    })
  }

  const fontFamilySelect = document.getElementById('font-family-select')
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', (e) => {
      const value = e.target.value
      if (!value) {
        editor.chain().focus().unsetFontFamily().run()
      } else {
        editor.chain().focus().setFontFamily(value).run()
      }
    })
  }

  const fontSizeSelect = document.getElementById('font-size-select')
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (e) => {
      const value = e.target.value
      if (!value) {
        editor.chain().focus().setFontSize(null).run()
      } else {
        editor.chain().focus().setFontSize(value).run()
      }
    })
  }

  updateToolbarState(editor)
}

export function updateToolbarState(editor) {
  if (!editor) return

  const buttons = document.querySelectorAll('.toolbar-btn[data-command]')
  buttons.forEach((btn) => {
    const command = btn.dataset.command
    const check = STATE_CHECKS[command]
    if (check) {
      btn.classList.toggle('active', check(editor))
    }
  })

  const selectedText = getSelectedText(editor)

  const uppercaseBtn = document.querySelector('[data-command="uppercase"]')
  const lowercaseBtn = document.querySelector('[data-command="lowercase"]')
  const capitalizeBtn = document.querySelector('[data-command="capitalize"]')

  if (uppercaseBtn) {
    uppercaseBtn.classList.toggle('active', !!selectedText && isAllUppercase(selectedText))
  }
  if (lowercaseBtn) {
    lowercaseBtn.classList.toggle('active', !!selectedText && isAllLowercase(selectedText))
  }
  if (capitalizeBtn) {
    capitalizeBtn.classList.toggle('active', !!selectedText && isCapitalized(selectedText))
  }

  const fontFamilySelect = document.getElementById('font-family-select')
  if (fontFamilySelect) {
    const current = editor.getAttributes('textStyle').fontFamily || ''
    if (current && fontFamilySelect.value !== current) {
      fontFamilySelect.value = current
    }
  }

  const fontSizeSelect = document.getElementById('font-size-select')
  if (fontSizeSelect) {
    const current = editor.getAttributes('textStyle').fontSize || ''
    if (current && fontSizeSelect.value !== current) {
      fontSizeSelect.value = current
    }
  }

  const fontColorPicker = document.getElementById('font-color-picker')
  if (fontColorPicker) {
    const current = editor.getAttributes('textStyle').color
    if (current && current.startsWith('#') && fontColorPicker.value !== current) {
      fontColorPicker.value = current
    }
  }
}