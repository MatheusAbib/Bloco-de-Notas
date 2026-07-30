# 🗒️ Bloco de Notas

Um bloco de notas completo e responsivo feito com HTML, CSS e JavaScript puro.  
Permite **criar, editar, fixar, arquivar e organizar notas**, com suporte a **formatação de texto**, **imagens**, **tags coloridas**, **filtros**, **seleção múltipla** e muito mais.  

---

## ✨ Funcionalidades

### 📝 Notas
- ✅ Criar, editar e excluir notas
- ✅ **Seleção múltipla** de notas para ações em lote
- 📌 Fixar até **5 notas** no topo da lista
- 📂 Arquivar/desarquivar notas (abas Ativas/Arquivadas)
- 🔄 Ordenação automática por última modificação
- 🎨 Cor personalizada para cada nota

### 🏷️ Organização
- 🏷️ **Tags coloridas** com seletor de cores em balão
- 🔍 Filtro por **tag** e por **data** (Hoje, Esta semana, Este mês)
- 📅 Data de criação e última edição visíveis

### ✍️ Editor de texto
- **Formatação** (Negrito, Itálico, Sublinhado, Tachado)
- 🎨 **Cor da fonte** com paleta de cores e tons
- 📋 Listas (comum e numerada)
- ✅ **Checklists** com modo ativável (Enter cria novo checkbox)
- 🔗 **Links** clicáveis (abrem em nova guia)
- 📎 **Imagens e arquivos** anexados (com visualização)
- 🖼️ **Editor de imagens** (Redimensionar, Cortar, Copiar, Remover)
- 🔤 **Fontes e tamanhos** personalizáveis
- 🔄 **Desfazer/Refazer** (Ctrl+Z e Ctrl+Y)
- 🔍 Busca dentro da nota com highlight
- 📋 Mantém formatação ao colar texto
- 🎯 **Marcador de texto** (highlight) amarelo


### 🎨 Interface
- 🌗 **Tema escuro** com persistência
- 🎯 **Modo Foco** para escrita sem distrações
- 📊 Estatísticas da nota (Palavras, Caracteres)
- 💾 **Indicador de salvamento** (Salvando... / Salvo ✓)
- 📱 **Responsivo** (Desktop, Tablet, Celular)
- 🔄 Animações suaves ao reordenar notas

### 🚀 Extras
- 😀 **Emojis** com busca e categorias
- 🔍 Busca por notas salvas
- 🎨 Paleta de cores para notas e tags
- ⏰ Notificações com nome da nota

---

## 🛠️ Tecnologias utilizadas

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

- **Armazenamento local** com `localStorage`
- **Fontes** do Google Fonts (Inter, Roboto, Poppins, Montserrat, Open Sans, Lato, Nunito, Playfair Display, Source Code Pro, Oswald)
- **Ícones** Font Awesome
- **Responsividade** com `media queries` e Flexbox/Grid

---

## 🚀 Como usar

1. **Abrir uma nota** → clique no card ou no botão "Abrir"
2. **Criar nota** → clique no botão `+` na sidebar ou use `Ctrl+N`
3. **Salvar** → clique em "Salvar" ou use `Ctrl+S`
4. **Fixar** → use o ícone de alfinete no card (máx 5)
5. **Arquivar** → use o ícone de arquivo no card
6. **Seleção múltipla** → clique no ícone de check duplo e selecione várias notas
7. **Ações em lote** → Fixar, Arquivar, Desarquivar ou Excluir várias notas de uma vez
8. **Formatar texto** → selecione o texto e use os botões da toolbar
9. **Inserir imagem** → clique no ícone de clipe na toolbar
10. **Buscar** → use a barra de busca na sidebar ou dentro da nota

---

## ⌨️ Atalhos de teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+S` | Salvar nota |
| `Ctrl+N` | Nova nota |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` | Refazer |
| `Ctrl+B` | Negrito |
| `Ctrl+I` | Itálico |
| `Ctrl+U` | Sublinhado |

---

## 🔧 Funcionalidades em lote

| Ação | Descrição |
|------|-----------|
| **Fixar** | Fixa todas as notas selecionadas (respeita limite de 5) |
| **Arquivar** | Arquiva todas as notas selecionadas |
| **Desarquivar** | Desarquiva todas as notas selecionadas |
| **Excluir** | Exclui todas as notas selecionadas (com confirmação) |

---