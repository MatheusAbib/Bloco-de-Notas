let currentNoteIndex = null;
let selectedColor = '#1a6d5e';
let newNoteColor = '#1a6d5e';
let undoStack = [];
let redoStack = [];
let isUndoRedo = false;
let isChecklistActive = false;
var checklistStates = {};
let currentEditIndex = null;
let newTags = [];
let editTags = [];
let selectedTagColor = '#e74c3c';
let selectedNewTagColor = '#e74c3c';

let filterTag = 'all';
let filterDate = 'all';
let allNotes = [];
let selectedImage = null;
let currentTab = 'active';

let saveTimeout = null;
let savedRange = null;
let savedSelection = null;

let fontColor = '#1a2a2a';
let isShadowActive = false;

let multiSelectMode = false;
let selectedNotes = new Set();

window.onload = function() {
  updateNoteList();
  updateSaveButtonText();
  loadTheme();
  updateStats();
  updateToolbarState();
  updateNoteStats();
  isChecklistActive = false;
  checklistStates = {};
  
  document.getElementById('note-content').addEventListener('mouseup', updateFontInfo);
  document.getElementById('note-content').addEventListener('keyup', updateFontInfo);
  document.getElementById('note-content').addEventListener('click', updateFontInfo);
};

function saveSelection() {
  var sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedSelection = sel;
    savedRange = sel.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (savedRange && savedSelection) {
    try {
      savedSelection.removeAllRanges();
      savedSelection.addRange(savedRange);
    } catch(e) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
  }
}

function toggleMultiSelect() {
  multiSelectMode = !multiSelectMode;
  var btn = document.querySelector('.multi-select-toggle');
  var actions = document.getElementById('multi-select-actions');
  
  btn.classList.toggle('active', multiSelectMode);
  actions.style.display = multiSelectMode ? 'flex' : 'none';
  
  if (multiSelectMode) {
    updateBatchButtons();
  }
  
  if (!multiSelectMode) {
    selectedNotes.clear();
    updateSelectedCount();
  }
  
  updateNoteList();
}

function toggleNoteSelection(index, event) {
  if (!multiSelectMode) return;
  
  event.stopPropagation();
  event.preventDefault();
  
  if (selectedNotes.has(index)) {
    selectedNotes.delete(index);
  } else {
    selectedNotes.add(index);
  }
  
  updateSelectedCount();
  updateNoteList();
}

function updateSelectedCount() {
  var count = document.getElementById('selected-count');
  count.textContent = selectedNotes.size;
}

function batchPin() {
  if (selectedNotes.size === 0) {
    showNotification('Nenhuma nota selecionada.', 'error');
    return;
  }
  
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var pinnedCount = savedNotes.filter(function(n) { return n.pinned === true; }).length;
  var toPin = selectedNotes.size;
  
  if (pinnedCount + toPin > 5) {
    showNotification('Limite de 5 notas fixadas!', 'error');
    return;
  }
  
  selectedNotes.forEach(function(index) {
    if (savedNotes[index]) {
      savedNotes[index].pinned = true;
    }
  });
  
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  selectedNotes.clear();
  updateSelectedCount();
  updateNoteList();
  loadFilterTags();
  applyFilters();
  showNotification(toPin + ' nota(s) fixada(s)!', 'success');
}

function batchArchive() {
  if (selectedNotes.size === 0) {
    showNotification('Nenhuma nota selecionada.', 'error');
    return;
  }
  
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var count = selectedNotes.size;
  
  selectedNotes.forEach(function(index) {
    if (savedNotes[index]) {
      savedNotes[index].archived = true;
    }
  });
  
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  selectedNotes.clear();
  updateSelectedCount();
  updateNoteList();
  loadFilterTags();
  applyFilters();
  showNotification(count + ' nota(s) arquivada(s)!', 'success');
}

function batchUnarchive() {
  if (selectedNotes.size === 0) {
    showNotification('Nenhuma nota selecionada.', 'error');
    return;
  }
  
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var count = selectedNotes.size;
  
  selectedNotes.forEach(function(index) {
    if (savedNotes[index]) {
      savedNotes[index].archived = false;
    }
  });
  
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  selectedNotes.clear();
  updateSelectedCount();
  updateNoteList();
  loadFilterTags();
  applyFilters();
  showNotification(count + ' nota(s) desarquivada(s)!', 'success');
}

function batchDelete() {
  if (selectedNotes.size === 0) {
    showNotification('Nenhuma nota selecionada.', 'error');
    return;
  }
  
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var names = [];
  selectedNotes.forEach(function(index) {
    if (savedNotes[index]) {
      names.push(savedNotes[index].name);
    }
  });
  
  var message = 'Tem certeza que deseja excluir ' + selectedNotes.size + ' nota(s)?';
  document.getElementById('batch-delete-message').textContent = message;
  
  var list = document.getElementById('batch-delete-list');
  list.innerHTML = names.map(function(name) {
    return '<div style="padding:2px 0;">• ' + name + '</div>';
  }).join('');
  
  document.getElementById('batch-delete-modal').style.display = 'flex';
}

function confirmBatchDelete() {
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var indices = Array.from(selectedNotes).sort(function(a, b) { return b - a; });
  
  indices.forEach(function(index) {
    savedNotes.splice(index, 1);
  });
  
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  selectedNotes.clear();
  updateSelectedCount();
  document.getElementById('batch-delete-modal').style.display = 'none';
  updateNoteList();
  loadFilterTags();
  applyFilters();
  showNotification('Notas excluídas com sucesso!', 'error');
}

function updateSaveIndicator(status, message) {
  var indicator = document.getElementById('save-indicator');
  indicator.className = 'save-indicator';
  
  if (status === 'saving') {
    indicator.classList.add('saving');
    indicator.innerHTML = '<i class="fas fa-circle-notch"></i><span>' + message + '</span>';
  } else if (status === 'saved') {
    indicator.classList.add('saved');
    indicator.innerHTML = '<i class="fas fa-check-circle"></i><span>' + message + '</span>';
  } else if (status === 'error') {
    indicator.classList.add('error');
    indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + message + '</span>';
  }
}

function showNoteDialog() {
  var editNoteIndex = localStorage.getItem('editNoteIndex');
  if (editNoteIndex !== null) {
    document.querySelector('#note-dialog h2').innerHTML = '<i class="fas fa-save"></i> Salvar Nota';
    saveNote();
  } else {
    document.querySelector('#note-dialog h2').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Nota';
    resetNewNoteColor();
    resetNewTags();
    document.getElementById('note-dialog').style.display = 'flex';
    document.getElementById('note-name').focus();
  }
}

function closeNoteDialog() {
  document.getElementById('note-dialog').style.display = 'none';
  document.getElementById('note-name').value = '';
  resetNewTags();
}

function toggleTagColorPicker(type) {
  var popoverId = type === 'edit' ? 'edit-tag-color-popover' : 'new-tag-color-popover';
  var popover = document.getElementById(popoverId);
  
  document.querySelectorAll('.tag-color-popover').forEach(function(el) {
    if (el.id !== popoverId) {
      el.style.display = 'none';
    }
  });
  
  popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
}

function selectTagColorEdit(el) {
  document.querySelectorAll('#edit-tag-color-popover .tag-color-option').forEach(function(btn) {
    btn.classList.remove('active');
  });
  el.classList.add('active');
  selectedTagColor = el.dataset.color;
  document.getElementById('edit-tag-color-preview').style.background = selectedTagColor;
  document.getElementById('edit-tag-color-popover').style.display = 'none';
}

function selectTagColorNew(el) {
  document.querySelectorAll('#new-tag-color-popover .tag-color-option').forEach(function(btn) {
    btn.classList.remove('active');
  });
  el.classList.add('active');
  selectedNewTagColor = el.dataset.color;
  document.getElementById('new-tag-color-preview').style.background = selectedNewTagColor;
  document.getElementById('new-tag-color-popover').style.display = 'none';
}

function updateNoteStats() {
  var editIndex = localStorage.getItem('editNoteIndex');
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  
  var createdSpan = document.getElementById('created-date');
  var editedSpan = document.getElementById('edited-date');
  
  if (editIndex !== null && savedNotes[editIndex]) {
    var note = savedNotes[editIndex];
    var createdDate = note.createdAt ? new Date(note.createdAt) : new Date(note.lastAccess);
    var editedDate = new Date(note.lastAccess);
    
    var createdStr = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString();
    var editedStr = editedDate.toLocaleDateString() + ' ' + editedDate.toLocaleTimeString();
    
    if (createdStr === editedStr) {
      createdSpan.innerHTML = '<i class="fas fa-calendar-plus"></i> Criado: ' + createdStr;
      editedSpan.innerHTML = '';
    } else {
      createdSpan.innerHTML = '<i class="fas fa-calendar-plus"></i> Criado: ' + createdStr;
      editedSpan.innerHTML = '<i class="fas fa-calendar-edit"></i> Editado: ' + editedStr;
    }
  } else {
    createdSpan.innerHTML = '';
    editedSpan.innerHTML = '';
  }
}

function saveNote() {
  var editNoteIndex = localStorage.getItem('editNoteIndex');
  var noteContent = document.getElementById('note-content').innerHTML;
  
  if (editNoteIndex !== null) {
    try {
      var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
      var noteName = savedNotes[editNoteIndex].name;
      savedNotes[editNoteIndex].content = noteContent;
      savedNotes[editNoteIndex].lastAccess = Date.now();
      if (!savedNotes[editNoteIndex].createdAt) {
        savedNotes[editNoteIndex].createdAt = savedNotes[editNoteIndex].lastAccess;
      }
      localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
      updateNoteList();
      updateNoteStats();
      showNotification('"' + noteName + '" atualizada com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao atualizar nota!', 'error');
    }
  } else {
    var noteName = document.getElementById('note-name').value.trim();
    if (!noteName) {
      showNotification('Insira um nome para a nota.', 'error');
      document.getElementById('note-name').focus();
      return;
    }
    try {
      var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
      var newIndex = savedNotes.length;
      var now = Date.now();
      savedNotes.push({
        name: noteName,
        content: noteContent,
        tags: newTags,
        color: newNoteColor,
        pinned: false,
        archived: false,
        createdAt: now,
        lastAccess: now
      });
      localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
      document.getElementById('note-name').value = '';
      document.getElementById('note-dialog').style.display = 'none';
      localStorage.setItem('editNoteIndex', newIndex);
      updateSaveButtonText();
      updateNoteTitle(noteName);
      updateNoteList();
      highlightActiveNote(newIndex);
      updateNoteStats();
      
      setTimeout(function() {
        var noteContent = document.getElementById('note-content');
        noteContent.focus();
        
        var sel = window.getSelection();
        var range = document.createRange();
        var lastNode = noteContent.lastChild;
        
        if (lastNode) {
          range.setStart(lastNode, lastNode.length || 0);
          range.setEnd(lastNode, lastNode.length || 0);
        } else {
          range.selectNodeContents(noteContent);
        }
        
        sel.removeAllRanges();
        sel.addRange(range);
      }, 100);
      
      showNotification('"' + noteName + '" criada com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao salvar nota!', 'error');
    }
  }
  loadFilterTags();
  applyFilters();
}

function updateSaveButtonText() {
  var editNoteIndex = localStorage.getItem('editNoteIndex');
  var saveBtn = document.querySelector('#note-buttons .btn-primary');
  if (editNoteIndex !== null) {
    saveBtn.innerHTML = '<i class="fas fa-save"></i><span>Atualizar</span>';
  } else {
    saveBtn.innerHTML = '<i class="fas fa-save"></i><span>Salvar</span>';
  }
}

function addTagToNew() {
  var input = document.getElementById('note-tags-input');
  var tagName = input.value.trim();
  if (!tagName) {
    showNotification('Digite o nome da tag.', 'error');
    return;
  }
  if (newTags.some(function(t) { return t.name === tagName; })) {
    showNotification('Tag já adicionada.', 'error');
    return;
  }
  newTags.push({ name: tagName, color: selectedNewTagColor });
  input.value = '';
  renderNewTags();
}

function renderNewTags() {
  var list = document.getElementById('new-tag-list');
  list.innerHTML = '';
  newTags.forEach(function(tag, index) {
    var item = document.createElement('span');
    item.className = 'tag-item';
    item.style.background = tag.color + '33';
    item.style.color = tag.color;
    item.innerHTML = tag.name + ' <button class="tag-remove" onclick="removeNewTag(' + index + ')"><i class="fas fa-times"></i></button>';
    list.appendChild(item);
  });
}

function removeNewTag(index) {
  newTags.splice(index, 1);
  renderNewTags();
}

function resetNewTags() {
  newTags = [];
  document.getElementById('note-tags-input').value = '';
  renderNewTags();
}

function addTagToEdit() {
  var input = document.getElementById('edit-note-tags');
  var tagName = input.value.trim();
  if (!tagName) {
    showNotification('Digite o nome da tag.', 'error');
    return;
  }
  if (editTags.some(function(t) { return t.name === tagName; })) {
    showNotification('Tag já adicionada.', 'error');
    return;
  }
  editTags.push({ name: tagName, color: selectedTagColor });
  input.value = '';
  renderEditTags();
}

function renderEditTags() {
  var list = document.getElementById('edit-tag-list');
  list.innerHTML = '';
  editTags.forEach(function(tag, index) {
    var item = document.createElement('span');
    item.className = 'tag-item';
    item.style.background = tag.color + '33';
    item.style.color = tag.color;
    item.innerHTML = tag.name + ' <button class="tag-remove" onclick="removeEditTag(' + index + ')"><i class="fas fa-times"></i></button>';
    list.appendChild(item);
  });
}

function removeEditTag(index) {
  editTags.splice(index, 1);
  renderEditTags();
}

function resetEditTags() {
  editTags = [];
  document.getElementById('edit-note-tags').value = '';
  renderEditTags();
}

var emojis = [
  { char: '☺', name: 'rosto sorridente', category: 'faces' },
  { char: 'ツ', name: 'rosto sorridente', category: 'faces' },
  { char: '♥', name: 'coração', category: 'faces' },
  { char: '✰', name: 'estrela', category: 'symbols' },
  { char: '♡', name: 'coração', category: 'symbols' },
  { char: '♪', name: 'nota musical', category: 'symbols' },
  { char: '☪', name: 'lua e estrela', category: 'symbols' },
  { char: '𓅪', name: 'pássaro', category: 'nature' },
  { char: '👁', name: 'olho', category: 'faces' },
  { char: '►', name: 'triângulo direito', category: 'symbols' },
  { char: '•', name: 'ponto', category: 'symbols' },
  { char: '©', name: 'copyright', category: 'symbols' },
  { char: '■', name: 'quadrado', category: 'symbols' },
  { char: '√', name: 'raiz quadrada', category: 'symbols' },
  { char: '☀', name: 'sol', category: 'nature' },
  { char: '𝛑', name: 'pi', category: 'symbols' },
  { char: '➳', name: 'flecha', category: 'symbols' },
  { char: '⚑', name: 'marcador', category: 'objects' },
  { char: 'ᵔᴥᵔ', name: 'rosto urso', category: 'faces' },
  { char: '☠', name: 'caveira', category: 'symbols' },
  { char: '†', name: 'cruz', category: 'objects' },
  { char: '🗓', name: 'calendário', category: 'objects' },
  { char: '☮', name: 'paz', category: 'symbols' },
  { char: '𓆏', name: 'ra', category: 'nature' },
  { char: '❀', name: 'planta', category: 'nature' },
  { char: '✿', name: 'flor', category: 'nature' },
  { char: '☀︎', name: 'arco-íris', category: 'nature' }
];

function renderEmojis(filter, category) {
  filter = filter || '';
  category = category || 'all';
  var grid = document.getElementById('emoji-grid');
  grid.innerHTML = '';
  var filtered = emojis.filter(function(e) {
    var matchSearch = e.name.includes(filter.toLowerCase()) || e.char.includes(filter);
    var matchCategory = category === 'all' || e.category === category;
    return matchSearch && matchCategory;
  });
  filtered.forEach(function(e) {
    var item = document.createElement('div');
    item.className = 'emoji-item';
    item.textContent = e.char;
    item.setAttribute('onclick', 'saveEmoji("' + e.char + '")');
    item.setAttribute('title', e.name);
    grid.appendChild(item);
  });
}

document.getElementById('emoji-search').addEventListener('input', function(e) {
  var search = e.target.value;
  var active = document.querySelector('.emoji-category.active');
  var cat = active ? active.dataset.category : 'all';
  renderEmojis(search, cat);
});

document.querySelectorAll('.emoji-category').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.emoji-category').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    var search = document.getElementById('emoji-search').value;
    renderEmojis(search, btn.dataset.category);
  });
});

renderEmojis();

function editNote(index, event) {
  event.stopPropagation();
  currentEditIndex = index;
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var note = savedNotes[index];
  document.getElementById('edit-note-name').value = note.name;
  editTags = note.tags ? JSON.parse(JSON.stringify(note.tags)) : [];
  renderEditTags();
  selectedColor = note.color || '#1a6d5e';
  document.querySelectorAll('#edit-modal .color-option').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.color === selectedColor);
  });
  document.getElementById('edit-modal').style.display = 'flex';
}

function selectColor(el) {
  document.querySelectorAll('.color-option').forEach(function(btn) {
    btn.classList.remove('active');
  });
  el.classList.add('active');
  selectedColor = el.dataset.color;
}

function selectColorNew(el) {
  document.querySelectorAll('#note-dialog .color-option').forEach(function(btn) {
    btn.classList.remove('active');
  });
  el.classList.add('active');
  newNoteColor = el.dataset.color;
}

function resetNewNoteColor() {
  newNoteColor = '#1a6d5e';
  document.querySelectorAll('#note-dialog .color-option').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.color === '#1a6d5e');
  });
}

function confirmEditNote() {
  var newName = document.getElementById('edit-note-name').value.trim();
  if (!newName) {
    showNotification('Insira um nome para a nota.', 'error');
    return;
  }
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var oldName = savedNotes[currentEditIndex].name;
  savedNotes[currentEditIndex].name = newName;
  savedNotes[currentEditIndex].tags = editTags;
  savedNotes[currentEditIndex].color = selectedColor;
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  document.getElementById('edit-modal').style.display = 'none';
  updateNoteList();
  showNotification('"' + oldName + '" alterado para "' + newName + '"!', 'success');
  var editIndex = localStorage.getItem('editNoteIndex');
  if (editIndex !== null && parseInt(editIndex) === currentEditIndex) {
    updateNoteTitle(newName);
  }
  loadFilterTags();
  applyFilters();
}

function openNote(index, event) {
  if (event) event.stopPropagation();
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var note = savedNotes[index];
  
  if (!note.createdAt) {
    note.createdAt = note.lastAccess;
    localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  }
  
  document.getElementById('note-content').innerHTML = note.content || '';
  localStorage.setItem('editNoteIndex', index);
  
  isChecklistActive = checklistStates[index] || false;
  updateToolbarState();
  
  updateSaveButtonText();
  updateNoteTitle(note.name);
  highlightActiveNote(index);
  updateNoteList();
  updateStats();
  updateNoteStats();
  updateToolbarState();
  undoStack = [];
  redoStack = [];
  saveState();
  
  setTimeout(function() {
    var noteContent = document.getElementById('note-content');
    noteContent.focus();
  }, 50);
  
  showNotification('"' + note.name + '" aberta!', 'success');
  updateSaveIndicator('saved', 'Salvo ✓');
}

function updateNoteTitle(name) {
  var display = document.getElementById('note-title-display');
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var editIndex = localStorage.getItem('editNoteIndex');
  var noteColor = '#1a6d5e';
  
  if (editIndex !== null && savedNotes[editIndex]) {
    noteColor = savedNotes[editIndex].color || '#1a6d5e';
  }
  
  if (name) {
    display.innerHTML = 'Bloco de Notas <span class="note-title-separator">•</span> <span class="note-title-name" style="color:' + noteColor + ';">' + name + '</span>';
  } else {
    display.innerHTML = 'Bloco de Notas';
  }
}

function clearNote() {
  document.getElementById('note-content').innerHTML = '';
  var editIndex = localStorage.getItem('editNoteIndex');
  if (editIndex !== null) {
    checklistStates[editIndex] = false;
  }
  isChecklistActive = false;
  localStorage.removeItem('editNoteIndex');
  updateSaveButtonText();
  updateNoteTitle(null);
  highlightActiveNote(null);
  updateStats();
  updateNoteStats();
  updateToolbarState();
  undoStack = [];
  redoStack = [];
  updateSaveIndicator('saved', 'Salvo ✓');
}

function highlightActiveNote(activeIndex) {
  var cards = document.querySelectorAll('.note-card');
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  
  cards.forEach(function(card) {
    card.classList.remove('active');
    card.style.boxShadow = '';
    var noteColor = savedNotes[activeIndex]?.color || '#1a6d5e';
    if (card.dataset.index && parseInt(card.dataset.index) === activeIndex) {
      card.classList.add('active');
      if (noteColor) {
        card.style.boxShadow = '0 0 0 2px ' + noteColor;
      }
    }
  });
}

function deleteNote(index, event) {
  event.stopPropagation();
  currentNoteIndex = index;
  document.getElementById('delete-modal').style.display = 'flex';
}

function confirmDeleteNote() {
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var noteName = savedNotes[currentNoteIndex].name;
  savedNotes.splice(currentNoteIndex, 1);
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  var editIndex = localStorage.getItem('editNoteIndex');
  if (editIndex && editIndex == currentNoteIndex) {
    clearNote();
  }
  document.getElementById('delete-modal').style.display = 'none';
  updateNoteList();
  showNotification('"' + noteName + '" excluída com sucesso!', 'error');
}

function togglePinNote(index, event) {
  event.stopPropagation();
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var pinnedCount = savedNotes.filter(function(n) { return n.pinned === true; }).length;
  if (!savedNotes[index].pinned && pinnedCount >= 5) {
    showNotification('Limite de 5 notas fixadas atingido!', 'error');
    return;
  }
  var noteName = savedNotes[index].name;
  savedNotes[index].pinned = !savedNotes[index].pinned;
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  updateNoteList();
  showNotification(savedNotes[index].pinned ? '"' + noteName + '" fixada com sucesso!' : '"' + noteName + '" desafixada!', 'success');
  loadFilterTags();
  applyFilters();
}

function updateNoteList() {
  var list = document.getElementById('saved-notes');
  var oldCards = list.querySelectorAll('.note-card');
  var oldNames = [];
  oldCards.forEach(function(card) {
    var name = card.querySelector('h3')?.textContent || '';
    oldNames.push(name);
  });
  
  list.innerHTML = '';
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  
  var filteredNotes = savedNotes.filter(function(note) {
    if (currentTab === 'active') return !note.archived;
    return note.archived;
  });
  
  document.getElementById('note-count').textContent = filteredNotes.length;
  
  if (filteredNotes.length === 0) {
    var msg = currentTab === 'active' ? 'Nenhuma nota ativa' : 'Nenhuma nota arquivada';
    list.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:0.85rem;padding:20px 0;">' + msg + '</p>';
    return;
  }
  
  var editIndex = localStorage.getItem('editNoteIndex');
  
  var sorted = filteredNotes.slice().sort(function(a, b) {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.lastAccess - a.lastAccess;
  });
  
  sorted.forEach(function(note, idx) {
    var originalIndex = savedNotes.indexOf(note);
    var card = document.createElement('div');
    card.className = 'note-card';
    card.setAttribute('data-index', originalIndex);
    if (note.pinned) card.classList.add('pinned-card');
    if (note.archived) card.classList.add('archived-card');
    
    var oldIndex = oldNames.indexOf(note.name);
    if (oldIndex !== -1) {
      var newPosition = idx;
      if (newPosition < oldIndex) {
        card.classList.add('moving-up');
      }
    }
    
    var isActive = (editIndex !== null && parseInt(editIndex) === originalIndex);
    if (isActive) {
      card.classList.add('active');
      if (note.color) {
        card.style.boxShadow = '0 0 0 2px ' + note.color;
        card.style.borderLeftColor = note.color;
      }
    }
    
    if (note.color) {
      card.style.borderLeftColor = note.color;
      var r = parseInt(note.color.slice(1,3), 16);
      var g = parseInt(note.color.slice(3,5), 16);
      var b = parseInt(note.color.slice(5,7), 16);
      card.style.backgroundColor = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.08)';
    }
    
    var checkboxOverlay = document.createElement('div');
    checkboxOverlay.className = 'checkbox-overlay';
    if (multiSelectMode) {
      checkboxOverlay.classList.add('show');
    }
    if (selectedNotes.has(originalIndex)) {
      checkboxOverlay.classList.add('checked');
      checkboxOverlay.innerHTML = '<i class="fas fa-check"></i>';
    } else {
      checkboxOverlay.innerHTML = '';
    }
    card.appendChild(checkboxOverlay);
    
    if (multiSelectMode) {
      card.classList.add('selectable');
      card.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleNoteSelection(originalIndex, e);
      };
      card.removeAttribute('onclick');
    } else {
      card.onclick = function(e) {
        openNote(originalIndex, e);
      };
      card.removeAttribute('onclick');
    }
    
    if (note.pinned) {
      var pinIcon = document.createElement('i');
      pinIcon.className = 'pin-icon pinned fa-solid fa-thumbtack';
      if (note.color) {
        pinIcon.style.color = note.color;
      }
      card.appendChild(pinIcon);
    }
    
    if (note.archived) {
      var archiveIcon = document.createElement('i');
      archiveIcon.className = 'archive-icon fa-solid fa-archive';
      card.appendChild(archiveIcon);
    }
    
    var title = document.createElement('h3');
    title.textContent = note.name;
    if (note.color) {
      title.style.color = note.color;
    }
    
    var date = document.createElement('p');
    date.textContent = new Date(note.lastAccess).toLocaleDateString() + ' ' + new Date(note.lastAccess).toLocaleTimeString();
    
    var tagsDiv = document.createElement('div');
    tagsDiv.className = 'tags';
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach(function(tag) {
        var span = document.createElement('span');
        span.textContent = tag.name || tag;
        if (tag.color) {
          span.style.background = tag.color + '33';
          span.style.color = tag.color;
        }
        tagsDiv.appendChild(span);
      });
    }
    
    var actions = document.createElement('div');
    actions.className = 'note-card-actions';
    
    if (!isActive && !multiSelectMode) {
      var openBtn = document.createElement('button');
      openBtn.innerHTML = '<i class="fas fa-folder-open"></i>';
      openBtn.setAttribute('onclick', 'openNote(' + originalIndex + ', event)');
      openBtn.setAttribute('title', 'Abrir nota');
      actions.appendChild(openBtn);
    }
    
    var pinBtn = document.createElement('button');
    pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
    pinBtn.setAttribute('onclick', 'togglePinNote(' + originalIndex + ', event)');
    pinBtn.setAttribute('title', note.pinned ? 'Desafixar' : 'Fixar');
    
    var editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-pen"></i>';
    editBtn.setAttribute('onclick', 'editNote(' + originalIndex + ', event)');
    editBtn.setAttribute('title', 'Editar nota');
    
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.setAttribute('onclick', 'deleteNote(' + originalIndex + ', event)');
    deleteBtn.setAttribute('title', 'Excluir');
    
    var archiveBtn = document.createElement('button');
    if (currentTab === 'archived') {
      archiveBtn.innerHTML = '<i class="fas fa-undo"></i>';
      archiveBtn.setAttribute('onclick', 'toggleArchiveNote(' + originalIndex + ', event)');
      archiveBtn.setAttribute('title', 'Desarquivar');
    } else {
      archiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
      archiveBtn.setAttribute('onclick', 'toggleArchiveNote(' + originalIndex + ', event)');
      archiveBtn.setAttribute('title', 'Arquivar');
    }
    
    actions.appendChild(pinBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(archiveBtn);
    
    card.appendChild(title);
    card.appendChild(date);
    if (note.tags && note.tags.length > 0) card.appendChild(tagsDiv);
    card.appendChild(actions);
    list.appendChild(card);
  });
  
  loadFilterTags();
  applyFilters();
}

function updateBatchButtons() {
  var archiveBtn = document.getElementById('batch-archive-btn');
  var unarchiveBtn = document.getElementById('batch-unarchive-btn');
  
  if (currentTab === 'archived') {
    archiveBtn.style.display = 'none';
    unarchiveBtn.style.display = 'inline-flex';
  } else {
    archiveBtn.style.display = 'inline-flex';
    unarchiveBtn.style.display = 'none';
  }
}

function createNewNote() {
  document.getElementById('note-content').innerHTML = '';
  localStorage.removeItem('editNoteIndex');
  
  isChecklistActive = false;
  updateToolbarState();
  
  updateSaveButtonText();
  updateNoteTitle(null);
  highlightActiveNote(null);
  updateStats();
  updateToolbarState();
  undoStack = [];
  redoStack = [];
  
  if (currentTab === 'archived') {
    switchTab('active');
  }
  
  document.querySelector('#note-dialog h2').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Nota';
  document.getElementById('note-dialog').style.display = 'flex';
  document.getElementById('note-name').focus();
  document.getElementById('note-tags').value = '';
  
  setTimeout(function() {
    var noteContent = document.getElementById('note-content');
    noteContent.focus();
  }, 50);
}

function saveNoteOnChange() {
  updateStats();
  updateToolbarState();
  var content = document.getElementById('note-content').innerHTML;
  var editIndex = localStorage.getItem('editNoteIndex');
  
  if (editIndex !== null) {
    updateSaveIndicator('saving', 'Salvando...');
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function() {
      try {
        var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
        savedNotes[editIndex].content = content;
        savedNotes[editIndex].lastAccess = Date.now();
        localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
        updateNoteList();
        updateNoteStats();
        updateSaveIndicator('saved', 'Salvo ✓');
        
        setTimeout(function() {
          var indicator = document.getElementById('save-indicator');
          if (indicator.classList.contains('saved')) {
            indicator.innerHTML = '<i class="fas fa-check-circle" style="color:#00b894;"></i><span>Salvo</span>';
          }
        }, 2000);
      } catch (error) {
        updateSaveIndicator('error', 'Erro!');
      }
    }, 500);
  }
  if (!isUndoRedo) {
    saveState();
  }
}

function saveState() {
  var content = document.getElementById('note-content').innerHTML;
  if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== content) {
    undoStack.push(content);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }
}

function insertChecklist() {
  var editIndex = localStorage.getItem('editNoteIndex');
  if (editIndex === null) {
    showNotification('Abra uma nota primeiro.', 'error');
    return;
  }
  
  isChecklistActive = !isChecklistActive;
  checklistStates[editIndex] = isChecklistActive;
  updateToolbarState();
  
  if (isChecklistActive) {
    showNotification('Modo checklist ativado!', 'success');
    insertCheckboxAtCursor();
  } else {
    showNotification('Modo checklist desativado!', 'success');
  }
}

function insertCheckboxAtCursor() {
  var editor = document.getElementById('note-content');
  editor.focus();
  
  var sel = window.getSelection();
  var range = sel.getRangeAt(0);
  
  var div = document.createElement('div');
  div.style.display = 'flex';
  div.style.alignItems = 'flex-start';
  div.style.gap = '8px';
  div.style.marginBottom = '4px';
  div.style.width = '100%';
  
  var checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.width = '16px';
  checkbox.style.height = '16px';
  checkbox.style.marginTop = '4px';
  checkbox.style.cursor = 'pointer';
  checkbox.style.accentColor = 'var(--primary)';
  checkbox.style.flexShrink = '0';
  checkbox.checked = false;
  
  var textSpan = document.createElement('span');
  textSpan.textContent = '\u00A0';
  textSpan.style.flex = '1';
  textSpan.style.display = 'inline-block';
  textSpan.style.minHeight = '1.5em';
  textSpan.style.width = '100%';
  
  div.appendChild(checkbox);
  div.appendChild(textSpan);
  
  range.insertNode(div);
  
  range.setStart(textSpan, 0);
  range.setEnd(textSpan, 0);
  sel.removeAllRanges();
  sel.addRange(range);
  
  saveNoteOnChange();
  saveState();
  updateToolbarState();
}

function undoAction() {
  if (undoStack.length <= 1) return;
  isUndoRedo = true;
  redoStack.push(undoStack.pop());
  document.getElementById('note-content').innerHTML = undoStack[undoStack.length - 1];
  updateStats();
  updateToolbarState();
  saveNoteOnChange();
  isUndoRedo = false;
}

function redoAction() {
  if (redoStack.length === 0) return;
  isUndoRedo = true;
  undoStack.push(redoStack.pop());
  document.getElementById('note-content').innerHTML = undoStack[undoStack.length - 1];
  updateStats();
  updateToolbarState();
  saveNoteOnChange();
  isUndoRedo = false;
}

function saveEmoji(emoji) {
  var editor = document.getElementById('note-content');
  var sel = window.getSelection();
  var range = sel.getRangeAt(0);
  var textNode = document.createTextNode(emoji);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  sel.removeAllRanges();
  sel.addRange(range);
  editor.focus();
  saveNoteOnChange();
  saveState();
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  if (modalId === 'attachment-modal') {
    document.getElementById('file-input').value = '';
  }
  currentNoteIndex = null;
}

function showNotification(message, type) {
  type = type || 'success';
  var notification = document.getElementById('notification');
  var progress = document.createElement('div');
  progress.className = 'notification-progress';
  notification.innerHTML = '';
  notification.appendChild(progress);
  notification.insertAdjacentHTML('beforeend', message);
  notification.className = 'notification-modal';
  notification.classList.add(type);
  setTimeout(function() {
    notification.classList.add('show');
  }, 10);
  setTimeout(function() {
    notification.classList.remove('show');
    setTimeout(function() {
      notification.className = 'notification-modal';
    }, 500);
  }, 3000);
}

function formatText(command) {
  restoreSelection();
  var editor = document.getElementById('note-content');
  editor.focus();
  
  var sel = window.getSelection();
  if (sel.rangeCount === 0 || sel.isCollapsed) {
    showNotification('Selecione um texto primeiro.', 'error');
    return;
  }
  
  document.execCommand(command, false, null);
  editor.focus();
  saveNoteOnChange();
  saveState();
  updateToolbarState();
}

function changeFont() {
  restoreSelection();
  
  var editor = document.getElementById('note-content');
  editor.focus();
  
  var sel = window.getSelection();
  if (sel.rangeCount === 0 || sel.isCollapsed) {
    showNotification('Selecione um texto primeiro.', 'error');
    return;
  }
  
  var font = document.getElementById('font-select').value;
  document.execCommand('fontName', false, font);
  editor.focus();
  saveNoteOnChange();
  saveState();
}

function changeFontSize() {
  restoreSelection();
  
  var editor = document.getElementById('note-content');
  editor.focus();
  
  var sel = window.getSelection();
  if (sel.rangeCount === 0 || sel.isCollapsed) {
    showNotification('Selecione um texto primeiro.', 'error');
    return;
  }
  
  var size = document.getElementById('font-size-select').value;
  document.execCommand('fontSize', false, '7');
  
  var spans = document.querySelectorAll('#note-content font[size="7"]');
  spans.forEach(function(span) {
    span.style.fontSize = size + 'px';
    span.removeAttribute('size');
  });
  
  editor.focus();
  saveNoteOnChange();
  saveState();
}

function transformText(type) {
  restoreSelection();
  
  setTimeout(function() {
    var editor = document.getElementById('note-content');
    editor.focus();
    
    var sel = window.getSelection();
    var range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      showNotification('Selecione um texto primeiro.', 'error');
      return;
    }
    
    var text = range.toString();
    var transformed = '';
    
    if (type === 'uppercase') {
      transformed = text.toUpperCase();
    } else if (type === 'lowercase') {
      transformed = text.toLowerCase();
    } else if (type === 'capitalize') {
      transformed = text.toLowerCase().replace(/\b\w/g, function(c) { 
        return c.toUpperCase(); 
      });
    }
    
    range.deleteContents();
    var textNode = document.createTextNode(transformed);
    range.insertNode(textNode);
    
    range.setStart(textNode, 0);
    range.setEnd(textNode, transformed.length);
    sel.removeAllRanges();
    sel.addRange(range);
    
    editor.focus();
    saveNoteOnChange();
    saveState();
    
    setTimeout(function() {
      updateToolbarState();
      updateFontInfo();
    }, 10);
  }, 10);
}

function updateFontInfo() {
  var sel = window.getSelection();
  var node = sel.anchorNode;
  
  if (node && node.parentElement) {
    var parent = node.parentElement;
    var fontSize = window.getComputedStyle(parent).fontSize;
    var fontFamily = window.getComputedStyle(parent).fontFamily;
    
    if (fontSize) {
      var size = parseInt(fontSize);
      var select = document.getElementById('font-size-select');
      select.value = size;
    }
    
    if (fontFamily) {
      var select = document.getElementById('font-select');
      var font = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
      select.value = font;
    }
  }
}

function updateToolbarState() {
  var editIndex = localStorage.getItem('editNoteIndex');
  var buttons = document.querySelectorAll('.toolbar-btn');
  
  buttons.forEach(function(btn) {
    var command = btn.dataset.command;
    if (command) {
      try {
        var isActive = document.queryCommandState(command);
        btn.classList.toggle('active', isActive);
      } catch(e) {
        btn.classList.remove('active');
      }
    }
    
    var cmd = btn.getAttribute('onclick');
    if (cmd && cmd.includes('formatText')) {
      var match = cmd.match(/formatText\('([^']+)'\)/);
      if (match) {
        try {
          var isActive = document.queryCommandState(match[1]);
          btn.classList.toggle('active', isActive);
        } catch(e) {
          btn.classList.remove('active');
        }
      }
    }
    if (cmd && cmd.includes('insertChecklist')) {
      btn.classList.toggle('active', isChecklistActive);
    }
    if (cmd && cmd.includes('toggleShadow')) {
      btn.classList.toggle('active', isShadowActive);
    }
  });
  
  if (editIndex !== null) {
    var sel = window.getSelection();
    var hasHighlight = false;
    
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      var range = sel.getRangeAt(0);
      
      var tempDiv = document.createElement('div');
      tempDiv.appendChild(range.cloneContents());
      var highlightSpans = tempDiv.querySelectorAll('.highlight');
      if (highlightSpans.length > 0) {
        hasHighlight = true;
      }
    }
    
    var highlightBtn = document.querySelector('[onclick*="toggleHighlight"]');
    if (highlightBtn) {
      highlightBtn.classList.toggle('active', hasHighlight);
    }
    
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      var text = sel.toString();
      
      var uppercaseBtn = document.getElementById('transform-uppercase');
      var lowercaseBtn = document.getElementById('transform-lowercase');
      var capitalizeBtn = document.getElementById('transform-capitalize');
      
      var isUppercase = text === text.toUpperCase() && text.length > 0;
      var isLowercase = text === text.toLowerCase() && text.length > 0;
      var isMixedCase = !isUppercase && !isLowercase && text.length > 0;
      
      var words = text.split(' ');
      var isCapitalized = words.every(function(word) {
        return word.length > 0 && word[0] === word[0].toUpperCase();
      });
      
      if (uppercaseBtn) {
        uppercaseBtn.classList.toggle('active', isUppercase);
      }
      if (lowercaseBtn) {
        lowercaseBtn.classList.toggle('active', isLowercase);
      }
      if (capitalizeBtn) {
        capitalizeBtn.classList.toggle('active', isCapitalized && isMixedCase && text.length > 0);
      }
    } else {
      document.getElementById('transform-uppercase')?.classList.remove('active');
      document.getElementById('transform-lowercase')?.classList.remove('active');
      document.getElementById('transform-capitalize')?.classList.remove('active');
    }
  }
  
  updateFontInfo();
}

function selectFontColor(el) {
  document.querySelectorAll('#font-color-popover .color-swatch').forEach(function(btn) {
    btn.classList.remove('active');
  });
  el.classList.add('active');
  var color = el.dataset.color;
  
  if (color === 'transparent' || color === 'sem-cor') {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    color = isDark ? '#e8edf0' : '#1a2a2a';
  }
  
  document.getElementById('font-preview').style.background = color;
  document.getElementById('font-color-popover').style.display = 'none';
  
  var editor = document.getElementById('note-content');
  editor.focus();
  
  document.execCommand('foreColor', false, color);
  saveNoteOnChange();
  saveState();
}

function toggleFontColorMenu() {
  var popover = document.getElementById('font-color-popover');
  popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
}

function toggleHighlight() {
  var editor = document.getElementById('note-content');
  editor.focus();
  
  var sel = window.getSelection();
  if (sel.rangeCount > 0 && !sel.isCollapsed) {
    var range = sel.getRangeAt(0);
    
    var hasHighlight = false;
    var container = range.commonAncestorContainer;
    
    if (container.nodeType === Node.ELEMENT_NODE && container.classList && container.classList.contains('highlight')) {
      hasHighlight = true;
    } else {
      var parent = container.parentElement;
      while (parent) {
        if (parent.classList && parent.classList.contains('highlight')) {
          hasHighlight = true;
          break;
        }
        parent = parent.parentElement;
      }
    }
    
    if (!hasHighlight) {
      var tempDiv = document.createElement('div');
      tempDiv.appendChild(range.cloneContents());
      var highlightSpans = tempDiv.querySelectorAll('.highlight');
      if (highlightSpans.length > 0) {
        hasHighlight = true;
      }
    }
    
    if (hasHighlight) {
      var allHighlights = editor.querySelectorAll('.highlight');
      allHighlights.forEach(function(span) {
        var text = span.textContent;
        span.replaceWith(text);
      });
      saveNoteOnChange();
      saveState();
      updateToolbarState();
    } else {
      try {
        var text = range.toString();
        if (!text) return;
        
        range.deleteContents();
        var span = document.createElement('span');
        span.className = 'highlight';
        span.textContent = text;
        
        range.insertNode(span);
        
        range.setStart(span, 0);
        range.setEnd(span, span.childNodes.length);
        sel.removeAllRanges();
        sel.addRange(range);
        
        saveNoteOnChange();
        saveState();
        updateToolbarState();
      } catch(e) {
        document.execCommand('backColor', false, '#ffeb3b');
        updateToolbarState();
      }
    }
  } else {
    showNotification('Selecione um texto primeiro.', 'error');
  }
}

function insertLink() {
  var editor = document.getElementById('note-content');
  var sel = window.getSelection();
  var range = sel.getRangeAt(0);
  
  window.savedRange = range;
  window.savedSelection = sel;
  
  document.getElementById('link-modal').style.display = 'flex';
  document.getElementById('link-url').value = '';
  
  if (range && !range.collapsed) {
    document.getElementById('link-text').value = range.toString();
  } else {
    document.getElementById('link-text').value = '';
  }
  
  document.getElementById('link-url').focus();
}

function confirmLink() {
  var url = document.getElementById('link-url').value.trim();
  var text = document.getElementById('link-text').value.trim() || url;
  
  if (!url) {
    showNotification('Insira uma URL.', 'error');
    return;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  var editor = document.getElementById('note-content');
  editor.focus();
  
  var sel = window.getSelection();
  var range = sel.getRangeAt(0);
  
  // Se não tiver seleção, insere no cursor
  if (range.collapsed) {
    var linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';
    linkElement.textContent = text;
    linkElement.style.color = 'var(--primary)';
    linkElement.style.textDecoration = 'underline';
    linkElement.style.cursor = 'pointer';
    
    range.insertNode(linkElement);
    range.setStartAfter(linkElement);
    range.setEndAfter(linkElement);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    var selectedText = range.toString();
    var linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';
    linkElement.textContent = text || selectedText;
    linkElement.style.color = 'var(--primary)';
    linkElement.style.textDecoration = 'underline';
    linkElement.style.cursor = 'pointer';
    
    range.deleteContents();
    range.insertNode(linkElement);
    range.setStartAfter(linkElement);
    range.setEndAfter(linkElement);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  editor.focus();
  document.getElementById('link-modal').style.display = 'none';
  document.getElementById('link-url').value = '';
  document.getElementById('link-text').value = '';
  saveNoteOnChange();
  saveState();
  updateToolbarState();
  showNotification('Link inserido com sucesso!', 'success');
}

function searchNotes() {
  var query = document.getElementById('search-notes').value.toLowerCase();
  var cards = document.querySelectorAll('.note-card');
  var clearBtn = document.querySelector('.search-clear');
  var found = false;
  
  if (query.length > 0) {
    clearBtn.style.display = 'flex';
    clearBtn.classList.add('visible');
  } else {
    clearBtn.style.display = 'none';
    clearBtn.classList.remove('visible');
  }
  
  var emptyMsg = document.querySelector('.empty-search');
  if (emptyMsg) emptyMsg.remove();
  
  cards.forEach(function(card) {
    var text = card.textContent.toLowerCase();
    var match = text.includes(query);
    card.style.display = match ? '' : 'none';
    if (match) found = true;
  });
  
  if (query.length > 0 && !found) {
    var list = document.getElementById('saved-notes');
    var msg = document.createElement('div');
    msg.className = 'empty-search';
    msg.innerHTML = '<i class="fas fa-search"></i> Nenhuma nota encontrada com "<strong>' + query + '</strong>"';
    list.appendChild(msg);
  }
}

function clearSearch() {
  document.getElementById('search-notes').value = '';
  var clearBtn = document.querySelector('.search-clear');
  clearBtn.style.display = 'none';
  clearBtn.classList.remove('visible');
  searchNotes();
}

function loadFilterTags() {
  var select = document.getElementById('filter-tag');
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var tags = new Set();
  
  savedNotes.forEach(function(note) {
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach(function(tag) {
        tags.add(tag.name || tag);
      });
    }
  });
  
  select.innerHTML = '<option value="all">Todas as tags</option>';
  tags.forEach(function(tag) {
    var option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    select.appendChild(option);
  });
}

function applyFilters() {
  filterTag = document.getElementById('filter-tag').value;
  filterDate = document.getElementById('filter-date').value;
  
  var clearBtn = document.querySelector('.filter-clear');
  if (filterTag !== 'all' || filterDate !== 'all') {
    clearBtn.classList.remove('hidden');
    clearBtn.classList.add('visible');
  } else {
    clearBtn.classList.remove('visible');
    clearBtn.classList.add('hidden');
  }
  
  filterNotes();
}

function filterNotes() {
  var cards = document.querySelectorAll('.note-card');
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  var monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  cards.forEach(function(card) {
    var index = parseInt(card.dataset.index);
    var note = savedNotes[index];
    if (!note) {
      card.style.display = 'none';
      return;
    }
    
    var show = true;
    
    if (filterTag !== 'all') {
      var hasTag = false;
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach(function(tag) {
          if ((tag.name || tag) === filterTag) {
            hasTag = true;
          }
        });
      }
      if (!hasTag) show = false;
    }
    
    if (filterDate !== 'all' && show) {
      var date = new Date(note.lastAccess);
      if (filterDate === 'today') {
        if (date < today || date > new Date(today.getTime() + 86400000)) show = false;
      } else if (filterDate === 'week') {
        if (date < weekAgo) show = false;
      } else if (filterDate === 'month') {
        if (date < monthAgo) show = false;
      }
    }
    
    card.style.display = show ? '' : 'none';
  });
}

function clearFilters() {
  document.getElementById('filter-tag').value = 'all';
  document.getElementById('filter-date').value = 'all';
  filterTag = 'all';
  filterDate = 'all';
  
  var clearBtn = document.querySelector('.filter-clear');
  clearBtn.classList.remove('visible');
  clearBtn.classList.add('hidden');
  
  var cards = document.querySelectorAll('.note-card');
  cards.forEach(function(card) {
    card.style.display = '';
  });
}

function updateStats() {
  var editor = document.getElementById('note-content');
  var text = editor.innerText || '';
  var words = text.trim() ? text.trim().split(/\s+/).length : 0;
  var chars = text.length;
  document.getElementById('word-count').textContent = 'Palavras: ' + words;
  document.getElementById('char-count').textContent = 'Caracteres: ' + chars;
}

function toggleFocusMode() {
  document.getElementById('app').classList.toggle('focus-mode');
  var btn = document.getElementById('focus-mode-btn');
  if (document.getElementById('app').classList.contains('focus-mode')) {
    btn.innerHTML = '<i class="fas fa-compress"></i>';
    showNotification('Modo Foco ativado!', 'success');
  } else {
    btn.innerHTML = '<i class="fas fa-expand"></i>';
    showNotification('Modo Foco desativado!', 'success');
  }
}

function toggleNoteSearch() {
  var bar = document.getElementById('note-search-bar');
  if (bar.style.display === 'none') {
    bar.style.display = 'flex';
    document.getElementById('note-search-input').focus();
  } else {
    bar.style.display = 'none';
    clearNoteSearch();
  }
}

function searchInNote() {
  var query = document.getElementById('note-search-input').value;
  var editor = document.getElementById('note-content');
  var content = editor.innerHTML;
  var temp = document.createElement('div');
  temp.innerHTML = content;
  var spans = temp.querySelectorAll('.highlight-search');
  spans.forEach(function(span) {
    span.replaceWith(span.textContent);
  });
  if (query.length < 2) {
    editor.innerHTML = temp.innerHTML;
    return;
  }
  var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  var newContent = temp.innerHTML.replace(regex, '<span class="highlight-search">$1</span>');
  editor.innerHTML = newContent;
}

function switchTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  updateBatchButtons();
  updateNoteList();
  loadFilterTags();
  applyFilters();
}

function toggleArchiveNote(index, event) {
  event.stopPropagation();
  var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
  var noteName = savedNotes[index].name;
  savedNotes[index].archived = !savedNotes[index].archived;
  localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  updateNoteList();
  showNotification(savedNotes[index].archived ? '"' + noteName + '" arquivada!' : '"' + noteName + '" desarquivada!', 'success');
  loadFilterTags();
  applyFilters();
}

function toggleShadow() {
  isShadowActive = !isShadowActive;
  updateToolbarState();
  
  var sel = window.getSelection();
  if (sel.rangeCount > 0 && !sel.isCollapsed) {
    var range = sel.getRangeAt(0);
    var span = document.createElement('span');
    span.style.boxShadow = isShadowActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none';
    span.style.display = 'inline-block';
    span.style.padding = isShadowActive ? '4px 8px' : '0';
    span.style.borderRadius = isShadowActive ? '4px' : '0';
    
    range.surroundContents(span);
    saveNoteOnChange();
    saveState();
  }
}

function clearNoteSearch() {
  document.getElementById('note-search-input').value = '';
  var editor = document.getElementById('note-content');
  var temp = document.createElement('div');
  temp.innerHTML = editor.innerHTML;
  var spans = temp.querySelectorAll('.highlight-search');
  spans.forEach(function(span) {
    span.replaceWith(span.textContent);
  });
  editor.innerHTML = temp.innerHTML;
  document.getElementById('note-search-bar').style.display = 'none';
}

document.getElementById('toggle-sidebar').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('open');
});

document.addEventListener('click', function(e) {
  var sidebar = document.getElementById('sidebar');
  var toggle = document.getElementById('toggle-sidebar');
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('.color-picker-wrapper')) {
    document.querySelectorAll('.color-popover').forEach(function(el) {
      el.style.display = 'none';
    });
  }
});

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redoAction();
    } else {
      undoAction();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    redoAction();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    showNoteDialog();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    createNewNote();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    formatText('bold');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    formatText('italic');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
    e.preventDefault();
    formatText('underline');
  }
});

function loadTheme() {
  var theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
  }
  var editIndex = localStorage.getItem('editNoteIndex');
  if (editIndex !== null) {
    var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
    if (savedNotes[editIndex]) {
      updateNoteTitle(savedNotes[editIndex].name);
      document.getElementById('note-content').innerHTML = savedNotes[editIndex].content || '';
      updateStats();
      updateToolbarState();
      updateNoteStats(); 
    }
  }
}

function openAttachmentModal() {
  document.getElementById('attachment-modal').style.display = 'flex';
  document.getElementById('file-input').value = '';
}

function handleFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    var fileData = e.target.result;
    
    var editor = document.getElementById('note-content');
    editor.focus();
    
    var sel = window.getSelection();
    var range;
    
    if (sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    
    if (file.type.startsWith('image/')) {
      var container = document.createElement('span');
      container.className = 'image-container';
      container.style.display = 'inline-flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '8px';
      container.style.alignItems = 'flex-start';
      container.style.margin = '4px 0';
      
      var img = document.createElement('img');
      img.src = fileData;
      img.style.maxWidth = '200px';
      img.style.maxHeight = '200px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.border = '1px solid var(--border)';
      img.style.cursor = 'pointer';
      img.style.display = 'inline-block';
      
      container.appendChild(img);
      range.insertNode(container);
      
      range.setStartAfter(container);
      range.setEndAfter(container);
      sel.removeAllRanges();
      sel.addRange(range);
      
      showNotification('Imagem inserida com sucesso!', 'success');
    } else {
      var linkElement = document.createElement('a');
      linkElement.href = fileData;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      linkElement.download = file.name;
      linkElement.style.display = 'inline-block';
      linkElement.style.padding = '6px 12px';
      linkElement.style.background = 'var(--primary-bg)';
      linkElement.style.borderRadius = '6px';
      linkElement.style.margin = '4px 0';
      linkElement.style.color = 'var(--primary)';
      linkElement.style.textDecoration = 'none';
      linkElement.style.cursor = 'pointer';
      linkElement.innerHTML = '<i class="fas fa-paperclip" style="margin-right:6px;"></i> ' + file.name;
      
      linkElement.addEventListener('click', function(e) {
        e.stopPropagation();
        var a = document.createElement('a');
        a.href = fileData;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
      
      range.insertNode(linkElement);
      
      range.setStartAfter(linkElement);
      range.setEndAfter(linkElement);
      sel.removeAllRanges();
      sel.addRange(range);
      
      showNotification('Arquivo anexado com sucesso!', 'success');
    }
    
    document.getElementById('attachment-modal').style.display = 'none';
    document.getElementById('file-input').value = '';
    saveNoteOnChange();
    saveState();
    updateToolbarState();
  };
  
  reader.readAsDataURL(file);
}


function toggleToolbar() {
  var toolbar = document.getElementById('editor-toolbar');
  var btn = document.getElementById('toolbar-toggle');
  
  toolbar.classList.toggle('open');
  btn.classList.toggle('active');
}

function showContextMenu(x, y) {
  var menu = document.getElementById('image-context-menu');
  menu.style.display = 'block';
  
  var menuWidth = 180;
  var menuHeight = 220;
  
  if (x + menuWidth > window.innerWidth) {
    x = x - menuWidth;
  }
  if (y + menuHeight > window.innerHeight) {
    y = y - menuHeight;
  }
  if (x < 10) x = 10;
  if (y < 10) y = 10;
  
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function removeImage() {
  if (selectedImage) {
    selectedImage.remove();
    selectedImage = null;
    document.getElementById('image-context-menu').style.display = 'none';
    saveNoteOnChange();
    saveState();
    showNotification('Imagem removida!', 'success');
  }
}

var cropData = null;

function showResizeControls() {
  var menu = document.getElementById('image-context-menu');
  
  var existingControls = menu.querySelector('.resize-controls');
  if (existingControls) {
    existingControls.remove();
    return;
  }
  
  var controls = document.createElement('div');
  controls.className = 'resize-controls';
  controls.innerHTML = `
    <div class="resize-row">
      <label>Largura:</label>
      <input type="number" id="resize-width" value="${selectedImage ? Math.round(parseFloat(selectedImage.style.width) || selectedImage.naturalWidth || 400) : 400}" min="10" max="2000">
    </div>
    <div class="resize-row">
      <label>Altura:</label>
      <input type="number" id="resize-height" value="${selectedImage ? Math.round(parseFloat(selectedImage.style.height) || selectedImage.naturalHeight || 300) : 300}" min="10" max="2000">
    </div>
    <div class="resize-actions">
      <button onclick="applyManualResize()">Aplicar</button>
      <button onclick="closeResizeControls()">Fechar</button>
    </div>
  `;
  
  menu.appendChild(controls);
}

function closeResizeControls() {
  var controls = document.querySelector('.resize-controls');
  if (controls) controls.remove();
}

function applyManualResize() {
  if (!selectedImage) return;
  
  var width = parseInt(document.getElementById('resize-width').value);
  var height = parseInt(document.getElementById('resize-height').value);
  
  if (isNaN(width) || isNaN(height) || width < 10 || height < 10) {
    showNotification('Valores inválidos. Mínimo 10px.', 'error');
    return;
  }
  
  selectedImage.style.width = width + 'px';
  selectedImage.style.height = height + 'px';
  selectedImage.style.maxWidth = 'none';
  selectedImage.style.maxHeight = 'none';
  
  closeResizeControls();
  document.getElementById('image-context-menu').style.display = 'none';
  saveNoteOnChange();
  saveState();
  showNotification('Imagem redimensionada!', 'success');
}

function cropImage() {
  if (!selectedImage) return;
  
  cropData = selectedImage;
  document.getElementById('image-context-menu').style.display = 'none';
  
  var overlay = document.createElement('div');
  overlay.className = 'crop-overlay';
  overlay.id = 'crop-overlay';
  overlay.innerHTML = `
    <div class="crop-box">
      <div class="crop-container">
        <img src="${selectedImage.src}" id="crop-image">
      </div>
      <div class="crop-actions">
        <button class="btn-crop-cancel" onclick="cancelCrop()">Cancelar</button>
        <button class="btn-crop-confirm" onclick="confirmCrop()">Cortar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  overlay.style.display = 'flex';
  
  setupCrop();
}

function setupCrop() {
  var img = document.getElementById('crop-image');
  var container = img.parentElement;
  var startX, startY, endX, endY, isDragging = false;
  var cropBox = document.createElement('div');
  cropBox.className = 'crop-selection';
  cropBox.style.cssText = `
    position: absolute;
    border: 2px dashed #fff;
    background: rgba(0,0,0,0.3);
    display: none;
    cursor: crosshair;
  `;
  container.style.position = 'relative';
  container.appendChild(cropBox);
  
  var rect = container.getBoundingClientRect();
  var scaleX = img.naturalWidth / img.offsetWidth;
  var scaleY = img.naturalHeight / img.offsetHeight;
  
  img.addEventListener('mousedown', function(e) {
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = true;
    cropBox.style.display = 'block';
    cropBox.style.left = startX + 'px';
    cropBox.style.top = startY + 'px';
    cropBox.style.width = '0px';
    cropBox.style.height = '0px';
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    endX = e.clientX - rect.left;
    endY = e.clientY - rect.top;
    
    var left = Math.min(startX, endX);
    var top = Math.min(startY, endY);
    var width = Math.abs(endX - startX);
    var height = Math.abs(endY - startY);
    
    cropBox.style.left = left + 'px';
    cropBox.style.top = top + 'px';
    cropBox.style.width = width + 'px';
    cropBox.style.height = height + 'px';
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
  
  window.cropData = {
    img: img,
    cropBox: cropBox,
    scaleX: scaleX,
    scaleY: scaleY,
    rect: rect,
    container: container
  };
}

function confirmCrop() {
  var data = window.cropData;
  if (!data) return;
  
  var box = data.cropBox;
  var rect = box.getBoundingClientRect();
  var containerRect = data.container.getBoundingClientRect();
  
  var x = (rect.left - containerRect.left) * data.scaleX;
  var y = (rect.top - containerRect.top) * data.scaleY;
  var width = rect.width * data.scaleX;
  var height = rect.height * data.scaleY;
  
  if (width < 10 || height < 10) {
    showNotification('Selecione uma área maior para cortar.', 'error');
    return;
  }
  
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  
  var img = data.img;
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  
  var croppedSrc = canvas.toDataURL('image/png');
  
  var newImg = document.createElement('img');
  newImg.src = croppedSrc;
  newImg.style.maxWidth = '100%';
  newImg.style.maxHeight = '400px';
  newImg.style.borderRadius = '8px';
  newImg.style.margin = '8px 0';
  newImg.style.display = 'block';
  newImg.style.border = '1px solid var(--border)';
  
  selectedImage.parentNode.replaceChild(newImg, selectedImage);
  selectedImage = newImg;
  
  document.getElementById('crop-overlay').remove();
  window.cropData = null;
  
  saveNoteOnChange();
  saveState();
  showNotification('Imagem cortada com sucesso!', 'success');
}

function cancelCrop() {
  var overlay = document.getElementById('crop-overlay');
  if (overlay) overlay.remove();
  window.cropData = null;
}

function copyImage() {
  if (selectedImage) {
    var img = document.createElement('img');
    img.src = selectedImage.src;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '400px';
    img.style.borderRadius = '8px';
    img.style.margin = '8px 0';
    img.style.display = 'block';
    img.style.border = '1px solid var(--border)';
    
    var range = window.getSelection().getRangeAt(0);
    range.insertNode(img);
    
    document.getElementById('image-context-menu').style.display = 'none';
    saveNoteOnChange();
    saveState();
    showNotification('Imagem copiada!', 'success');
  }
}

function resizeImage(factor) {
  if (selectedImage) {
    var currentWidth = parseFloat(selectedImage.style.width) || selectedImage.naturalWidth || 400;
    var currentHeight = parseFloat(selectedImage.style.height) || selectedImage.naturalHeight || 300;
    
    if (factor === 1) {
      selectedImage.style.width = '';
      selectedImage.style.height = '';
      selectedImage.style.maxWidth = '100%';
      selectedImage.style.maxHeight = '400px';
    } else {
      var newWidth = currentWidth * factor;
      var newHeight = currentHeight * factor;
      
      if (newWidth > 800) {
        newWidth = 800;
        newHeight = (800 / currentWidth) * currentHeight;
      }
      if (newWidth < 50) {
        newWidth = 50;
        newHeight = (50 / currentWidth) * currentHeight;
      }
      
      selectedImage.style.width = newWidth + 'px';
      selectedImage.style.height = newHeight + 'px';
      selectedImage.style.maxWidth = 'none';
      selectedImage.style.maxHeight = 'none';
    }
    
    document.getElementById('image-context-menu').style.display = 'none';
    saveNoteOnChange();
    saveState();
    showNotification(factor === 1 ? 'Tamanho redefinido!' : 'Tamanho ajustado!', 'success');
  }
}

document.getElementById('theme-toggle').addEventListener('click', function() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    this.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    this.innerHTML = '<i class="fas fa-sun"></i>';
  }
});

document.getElementById('note-content').addEventListener('mouseup', function() {
  updateToolbarState();
  updateFontInfo();
});

document.getElementById('note-content').addEventListener('keyup', function() {
  updateToolbarState();
  updateFontInfo();
});

document.getElementById('note-content').addEventListener('click', function() {
  updateToolbarState();
  updateFontInfo();
});

document.getElementById('note-content').addEventListener('selectionchange', function() {
  updateToolbarState();
  updateFontInfo();
});

document.getElementById('note-content').addEventListener('click', function(e) {
  var target = e.target;
  var menu = document.getElementById('image-context-menu');
  menu.style.display = 'none';
  
  if (target.tagName === 'A' && target.href) {
    e.preventDefault();
    window.open(target.href, '_blank');
    return;
  }
  
  if (target.tagName === 'IMG') {
    selectedImage = target;
    showContextMenu(e.clientX, e.clientY);
  }
});

document.addEventListener('click', function(e) {
  var menu = document.getElementById('image-context-menu');
  if (!menu.contains(e.target) && e.target.tagName !== 'IMG') {
    menu.style.display = 'none';
  }
});

document.getElementById('note-content').addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    saveNoteOnChange();
    saveState();
    return;
  }
  
  if (e.key === 'Enter' && e.target.tagName === 'A') {
    e.preventDefault();
    window.open(e.target.href, '_blank');
    return;
  }
  
  if (e.key === 'Enter' && isChecklistActive) {
    var sel = window.getSelection();
    var range = sel.getRangeAt(0);
    var node = range.startContainer;
    
    var parentDiv = node.parentElement;
    while (parentDiv && parentDiv.tagName !== 'DIV') {
      parentDiv = parentDiv.parentElement;
    }
    
    if (parentDiv && parentDiv.querySelector('input[type="checkbox"]')) {
      e.preventDefault();
      
      var currentDiv = parentDiv;
      var parent = currentDiv.parentElement;
      
      var newDiv = document.createElement('div');
      newDiv.style.display = 'flex';
      newDiv.style.alignItems = 'flex-start';
      newDiv.style.gap = '8px';
      newDiv.style.marginBottom = '4px';
      newDiv.style.width = '100%';
      
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.width = '16px';
      checkbox.style.height = '16px';
      checkbox.style.marginTop = '4px';
      checkbox.style.cursor = 'pointer';
      checkbox.style.accentColor = 'var(--primary)';
      checkbox.style.flexShrink = '0';
      checkbox.checked = false;
      
      var textSpan = document.createElement('span');
      textSpan.textContent = '\u00A0';
      textSpan.style.flex = '1';
      textSpan.style.display = 'inline-block';
      textSpan.style.minHeight = '1.5em';
      textSpan.style.width = '100%';
      
      newDiv.appendChild(checkbox);
      newDiv.appendChild(textSpan);
      
      if (currentDiv.nextSibling) {
        parent.insertBefore(newDiv, currentDiv.nextSibling);
      } else {
        parent.appendChild(newDiv);
      }
      
      var newRange = document.createRange();
      newRange.setStart(textSpan, 0);
      newRange.setEnd(textSpan, 0);
      sel.removeAllRanges();
      sel.addRange(newRange);
      
      saveNoteOnChange();
      saveState();
    }
  }
});

function toggleColorPicker(type) {
  var popoverId = type === 'highlight' ? 'highlight-color-popover' : 'font-color-popover';
  var popover = document.getElementById(popoverId);
  
  if (!popover) {
    var allPopovers = document.querySelectorAll('.color-popover');
    allPopovers.forEach(function(el) {
      el.style.display = 'none';
    });
    return;
  }
  
  document.querySelectorAll('.color-popover').forEach(function(el) {
    if (el.id !== popoverId) {
      el.style.display = 'none';
    }
  });
  
  popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
}

document.getElementById('note-content').addEventListener('change', function(e) {
  if (e.target.type === 'checkbox') {
    var div = e.target.parentElement;
    var textSpan = div.querySelector('span');
    
    if (e.target.checked) {
      if (textSpan) {
        textSpan.style.textDecoration = 'line-through';
        textSpan.style.opacity = '0.6';
      }
    } else {
      if (textSpan) {
        textSpan.style.textDecoration = 'none';
        textSpan.style.opacity = '1';
      }
    }
    saveNoteOnChange();
    saveState();
  }
});

document.getElementById('note-content').addEventListener('input', function(e) {
  var divs = this.querySelectorAll('div:has(input[type="checkbox"]) span');
  divs.forEach(function(span) {
    if (span.textContent === '\u00A0' && span.parentElement.querySelector('input[type="checkbox"]')) {
      span.textContent = '';
    }
  });
});

document.getElementById('note-content').addEventListener('paste', function(e) {
  e.preventDefault();
  
  var clipboardData = e.clipboardData || window.clipboardData;
  var pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
  
  if (!pastedData) return;
  
  var tempDiv = document.createElement('div');
  tempDiv.innerHTML = pastedData;
  
  var sel = window.getSelection();
  var range = sel.getRangeAt(0);
  
  range.deleteContents();
  
  var fragment = document.createDocumentFragment();
  
  function processNodes(node) {
    var childNodes = Array.from(node.childNodes);
    
    childNodes.forEach(function(child) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        var newElement = document.createElement(child.tagName);
        
        var styles = window.getComputedStyle(child);
        var cssText = '';
        
        if (child.tagName === 'P') {
          cssText += 'margin:0;padding:0;';
        }
        
        if (child.tagName === 'SPAN') {
          var color = styles.color;
          var bgColor = styles.backgroundColor;
          var fontSize = styles.fontSize;
          var fontWeight = styles.fontWeight;
          var fontStyle = styles.fontStyle;
          var textDecoration = styles.textDecoration;
          
          if (color && color !== 'rgb(0, 0, 0)') {
            cssText += 'color:' + color + ';';
          }
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            cssText += 'background-color:' + bgColor + ';';
          }
          if (fontSize) {
            cssText += 'font-size:' + fontSize + ';';
          }
          if (fontWeight && fontWeight !== '400') {
            cssText += 'font-weight:' + fontWeight + ';';
          }
          if (fontStyle && fontStyle !== 'normal') {
            cssText += 'font-style:' + fontStyle + ';';
          }
          if (textDecoration && textDecoration !== 'none') {
            cssText += 'text-decoration:' + textDecoration + ';';
          }
        }
        
        if (child.tagName === 'A') {
          newElement.href = child.href;
          newElement.target = '_blank';
          newElement.rel = 'noopener noreferrer';
          cssText += 'color:var(--primary);text-decoration:underline;cursor:pointer;';
        }
        
        if (child.tagName === 'B' || child.tagName === 'STRONG') {
          cssText += 'font-weight:bold;';
        }
        
        if (child.tagName === 'I' || child.tagName === 'EM') {
          cssText += 'font-style:italic;';
        }
        
        if (child.tagName === 'U') {
          cssText += 'text-decoration:underline;';
        }
        
        if (child.tagName === 'STRIKE' || child.tagName === 'S') {
          cssText += 'text-decoration:line-through;';
        }
        
        if (child.tagName === 'UL' || child.tagName === 'OL') {
          cssText += 'padding-left:20px;margin:4px 0;';
        }
        
        if (child.tagName === 'LI') {
          cssText += 'margin:2px 0;';
        }
        
        if (cssText) {
          newElement.style.cssText = cssText;
        }
        
        processNodes(child, newElement);
        fragment.appendChild(newElement);
      } else if (child.nodeType === Node.TEXT_NODE) {
        fragment.appendChild(document.createTextNode(child.textContent));
      }
    });
  }
  
  processNodes(tempDiv);
  
  range.insertNode(fragment);
  
  range.setStartAfter(fragment);
  range.setEndAfter(fragment);
  sel.removeAllRanges();
  sel.addRange(range);
  
  document.getElementById('note-content').focus();
  saveNoteOnChange();
  saveState();
});

document.getElementById('note-content').addEventListener('focusout', function(e) {
  var editIndex = localStorage.getItem('editNoteIndex');
  if (editIndex !== null) {
    var relatedTarget = e.relatedTarget;
    
    if (relatedTarget) {
      var isToolbar = relatedTarget.closest('#editor-toolbar');
      var isToolbarBtn = relatedTarget.closest('#editor-toolbar button');
      var isToolbarSelect = relatedTarget.closest('#editor-toolbar select');
      var isEmoji = relatedTarget.closest('.emoji-container');
      var isButtons = relatedTarget.closest('#note-buttons');
      var isSearch = relatedTarget.closest('#note-search-bar');
      var isSidebar = relatedTarget.closest('#sidebar');
      var isModal = relatedTarget.closest('.modal');
      var isMenu = relatedTarget.closest('.image-context-menu');
      var isStats = relatedTarget.closest('#note-stats');
      var isHeader = relatedTarget.closest('#top-bar');
      var isToggleSidebar = relatedTarget.closest('#toggle-sidebar');
      
      if (isToolbar || isToolbarBtn || isToolbarSelect || isEmoji || isButtons || isSearch || isSidebar || isModal || isMenu || isStats || isHeader || isToggleSidebar) {
        return;
      }
    }
    
    setTimeout(function() {
      var noteContent = document.getElementById('note-content');
      if (document.activeElement !== noteContent) {
        noteContent.focus();
      }
    }, 10);
  }
});

document.querySelectorAll('#editor-toolbar .toolbar-btn[data-command]').forEach(function(btn) {
  btn.addEventListener('mousedown', function(e) {
    saveSelection();
  });
  btn.addEventListener('click', function() {
    var command = this.dataset.command;
    formatText(command);
  });
});

document.getElementById('insert-link-btn').addEventListener('click', function() {
  insertLink();
});

document.getElementById('toggle-note-search-btn').addEventListener('click', function() {
  toggleNoteSearch();
});

document.getElementById('open-attachment-btn').addEventListener('click', function() {
  openAttachmentModal();
});

document.getElementById('undo-btn').addEventListener('click', function() {
  undoAction();
});

document.getElementById('redo-btn').addEventListener('click', function() {
  redoAction();
});

document.getElementById('font-select').addEventListener('mousedown', function(e) {
  saveSelection();
});

document.getElementById('font-select').addEventListener('change', function() {
  changeFont();
});

document.getElementById('font-size-select').addEventListener('mousedown', function(e) {
  saveSelection();
});

document.getElementById('font-size-select').addEventListener('change', function() {
  changeFontSize();
});

document.getElementById('transform-uppercase').addEventListener('click', function() {
  transformText('uppercase');
});

document.getElementById('transform-lowercase').addEventListener('click', function() {
  transformText('lowercase');
});

document.getElementById('transform-capitalize').addEventListener('click', function() {
  transformText('capitalize');
});