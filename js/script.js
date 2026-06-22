let currentNoteIndex = null;

window.onload = function() {
    updateNoteList();
    updateSaveButtonText();
};

function showNoteDialog() {
    var editNoteIndex = localStorage.getItem('editNoteIndex');
    
    if (editNoteIndex !== null) {
        saveNote();
    } else {
        var dialog = document.getElementById('note-dialog');
        dialog.style.display = 'block';
        document.getElementById('note-name').focus();
    }
}

function closeNoteDialog() {
    var dialog = document.getElementById('note-dialog');
    dialog.style.display = 'none';
    document.getElementById("note-name").value = '';
}

function saveNote() {
    var editNoteIndex = localStorage.getItem('editNoteIndex');
    var noteContent = document.getElementById("note-content").value;
    
    if (editNoteIndex !== null) {
        try {
            var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
            savedNotes[editNoteIndex].content = noteContent;
            savedNotes[editNoteIndex].lastAccess = Date.now();
            localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
            updateNoteList();
            showNotification("Nota salva com sucesso!", 'success');
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
            showNotification("Erro ao atualizar nota!", true);
        }
    } else {
        var noteName = document.getElementById("note-name").value.trim();
        
        if (!noteName) {
            showNotification("Por favor, insira um nome para a nota.", true);
            document.getElementById("note-name").focus();
            return;
        }
        
        try {
            var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
            savedNotes.push({
                name: noteName,
                content: noteContent,
                lastAccess: Date.now()
            });
            
            localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
            document.getElementById("note-name").value = '';
            document.getElementById('note-dialog').style.display = 'none';
            updateNoteList();
            showNotification("Nota salva com sucesso!", 'success');
        } catch (error) {
            console.error("Erro ao criar nova nota:", error);
            showNotification("Erro ao salvar nota!", true);
        }
    }
}

function updateSaveButtonText() {
    var editNoteIndex = localStorage.getItem('editNoteIndex');
    var saveButton = document.querySelector('#note-buttons .note-button:first-child');
    
    if (editNoteIndex !== null) {
        saveButton.textContent = 'Salvar Alterações';
    } else {
        saveButton.textContent = 'Salvar';
    }
}

const emojis = [
    { char: '☺', name: 'rosto sorridente', category: 'faces' },
    { char: 'ツ', name: 'rosto sorridente com olhos sorridentes', category: 'faces' },
    { char: '♥', name: 'rosto apaixonado', category: 'faces' }, 
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

function renderEmojis(filter = '', category = 'all') {
    const emojiGrid = document.getElementById('emoji-grid');
    emojiGrid.innerHTML = '';
    
    const filteredEmojis = emojis.filter(emoji => {
        const matchesSearch = emoji.name.includes(filter.toLowerCase()) || 
                             emoji.char.includes(filter);
        const matchesCategory = category === 'all' || emoji.category === category;
        return matchesSearch && matchesCategory;
    });
    
    filteredEmojis.forEach(emoji => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'emoji-item';
        emojiItem.innerHTML = emoji.char;
        emojiItem.setAttribute('onclick', `saveEmoji('${emoji.char}')`);
        emojiItem.setAttribute('title', emoji.name);
        emojiGrid.appendChild(emojiItem);
    });
}

document.getElementById('emoji-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const activeCategory = document.querySelector('.emoji-category.active').dataset.category;
    renderEmojis(searchTerm, activeCategory);
});

document.querySelectorAll('.emoji-category').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        const searchTerm = document.getElementById('emoji-search').value;
        renderEmojis(searchTerm, button.dataset.category);
    });
});


renderEmojis();

function editNoteName(index, event) {
event.stopPropagation();
currentNoteIndex = index;

var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
document.getElementById('edit-note-name').value = savedNotes[index].name;

openModal('edit-modal');
}

function confirmEditNote() {
    var newName = document.getElementById('edit-note-name').value.trim();

    if (newName === "") {
        showNotification("Por favor, insira um nome para a nota.", 'error');
        return;
    }

    var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
    savedNotes[currentNoteIndex].name = newName;
    localStorage.setItem('savedNotes', JSON.stringify(savedNotes));

    closeModal('edit-modal');
    updateNoteList();
    showNotification("Nome atualizado com sucesso!", 'success');


}

function openNote(index, event) {
    if (event) {
        event.stopPropagation(); 
    }
    var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
    var noteContent = document.getElementById("note-content");
    noteContent.value = savedNotes[index].content;
    localStorage.setItem('editNoteIndex', index);
    updateSaveButtonText();
}

function clearNote() {
var noteContent = document.getElementById("note-content");
noteContent.value = '';
localStorage.removeItem('editNoteIndex');

updateSaveButtonText();

}

function deleteNote(index, event) {
event.stopPropagation(); 
currentNoteIndex = index;
openModal('delete-modal');
}

function confirmDeleteNote() {
    var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
    savedNotes.splice(currentNoteIndex, 1);
    localStorage.setItem('savedNotes', JSON.stringify(savedNotes));

    var editNoteIndex = localStorage.getItem('editNoteIndex');
    if (editNoteIndex && editNoteIndex == currentNoteIndex) {
        clearNote();
    }

    closeModal('delete-modal');
    updateNoteList();
    showNotification("Nota excluída com sucesso!", 'error');
}

function updateNoteList() {
    var noteList = document.getElementById("saved-notes");
    noteList.innerHTML = '';

    var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];

    if (savedNotes.length === 0) {
        noteList.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma nota salva ainda.</p>';
        return;
    }

    savedNotes.forEach(function(note, index) {
        var noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.setAttribute('onclick', 'openNote(' + index + ')');

        var folderIcon = document.createElement('div');
        folderIcon.classList.add('folder-icon');
        var img = document.createElement('img');
        img.src = "img/notas.png";
        img.alt = "Folder Icon";
        folderIcon.appendChild(img);

        var noteContent = document.createElement('div');
        noteContent.classList.add('note-content');

        var title = document.createElement('h3');
        title.textContent = note.name;

        var date = document.createElement('p');
        date.textContent = 'Último acesso: ' + new Date(note.lastAccess).toLocaleDateString();

        var openButton = document.createElement('button');
        openButton.classList.add('note-button');
        openButton.innerHTML = `
        <i class="fa-solid fa-folder-open"></i>
        <span>Abrir</span>
        `;
        openButton.setAttribute('onclick', 'openNote(' + index + ', event)');

        var editButton = document.createElement('button');
        editButton.classList.add('note-button');
        editButton.innerHTML = `
        <i class="fa-solid fa-pen-to-square"></i>
        <span>Editar nome</span>
        `;
        editButton.setAttribute('onclick', 'editNoteName(' + index + ', event)');

        var deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.setAttribute('onclick', 'deleteNote(' + index + ', event)');
        deleteButton.setAttribute('title', 'Excluir nota');

        noteContent.appendChild(title);
        noteContent.appendChild(date);
        noteContent.appendChild(openButton); 
        noteContent.appendChild(editButton);
        noteContent.appendChild(deleteButton);

        noteCard.appendChild(folderIcon);
        noteCard.appendChild(noteContent);
        noteCard.appendChild(deleteButton);

        noteList.appendChild(noteCard);
    });
}

function saveNoteOnChange() {
var noteContent = document.getElementById("note-content").value;
var editNoteIndex = localStorage.getItem('editNoteIndex');

if (editNoteIndex !== null) {
var savedNotes = JSON.parse(localStorage.getItem('savedNotes')) || [];
savedNotes[editNoteIndex].content = noteContent;
savedNotes[editNoteIndex].lastAccess = Date.now();
localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
}
}

function saveEmoji(emoji) {
    const noteContent = document.getElementById("note-content");
    const cursorPos = noteContent.selectionStart;
    const textBefore = noteContent.value.substring(0, cursorPos);
    const textAfter = noteContent.value.substring(cursorPos);
    
    noteContent.value = textBefore + emoji + textAfter;
    
    noteContent.selectionStart = cursorPos + emoji.length;
    noteContent.selectionEnd = cursorPos + emoji.length;
    noteContent.focus();
    
    saveNoteOnChange();
}

function openModal(modalId) {
document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
document.getElementById(modalId).style.display = 'none';
currentNoteIndex = null;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    
    const progress = document.createElement('div');
    progress.className = 'notification-progress';
    
    notification.innerHTML = '';
    notification.appendChild(progress);
    notification.insertAdjacentHTML('beforeend', message);
    notification.className = 'notification-modal';
    notification.classList.add(type);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.className = 'notification-modal';
        }, 500);
    }, 5000);
}

