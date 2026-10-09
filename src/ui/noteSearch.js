let editorRef = null
let currentQuery = ''

export function initNoteSearch(editor) {
  editorRef = editor

  const toggleBtn = document.getElementById('toggle-note-search-btn')
  const bar = document.getElementById('note-search-bar')
  const input = document.getElementById('note-search-input')
  const closeBtn = bar ? bar.querySelector('button') : null

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (!bar) return
      const isOpen = bar.style.display !== 'none'
      if (isOpen) {
        closeBar()
      } else {
        openBar()
      }
    })
  }

  if (input) {
    input.addEventListener('input', (e) => {
      currentQuery = e.target.value
      runSearch()
    })
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeBar()
      }
    })
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeBar)
  }
}

function openBar() {
  const bar = document.getElementById('note-search-bar')
  const input = document.getElementById('note-search-input')
  if (!bar || !input) return
  bar.style.display = 'flex'
  setTimeout(() => input.focus(), 50)
}

function closeBar() {
  const bar = document.getElementById('note-search-bar')
  const input = document.getElementById('note-search-input')
  if (!bar) return
  bar.style.display = 'none'
  if (input) input.value = ''
  currentQuery = ''
  clearHighlights()
}

function runSearch() {
  clearHighlights()
  if (!editorRef) return
  if (currentQuery.length < 2) return

  const regex = new RegExp(escapeRegExp(currentQuery), 'gi')
  editorRef.commands.command(({ tr, state, dispatch }) => {
    const { doc } = state
    let found = 0
    doc.descendants((node, pos) => {
      if (!node.isText) return
      const text = node.text || ''
      let match
      while ((match = regex.exec(text)) !== null) {
        const from = pos + match.index
        const to = from + match[0].length
        if (dispatch) {
          tr.addMark(from, to, state.schema.marks.highlight.create({ color: '#ffeb3b' }))
        }
        found++
        if (match.index === regex.lastIndex) regex.lastIndex++
      }
    })
    if (dispatch) dispatch(tr)
    return found > 0
  })
}

function clearHighlights() {
  if (!editorRef) return
  editorRef.commands.unsetMark('highlight')
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}