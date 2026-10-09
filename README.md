# 🗒️ Bloco de Notas

Um bloco de notas moderno, responsivo e offline-first, construído com **Vite** e **TipTap**.  
Permite **criar, editar, fixar, arquivar e organizar notas**, com suporte a **formatação**, **imagens com editor**, **anexos de arquivos**, **tags coloridas**, **filtros avançados**, **seleção múltipla** e muito mais.

> 🔗 **Acesse online:** (https://matheusabib.github.io/Bloco-de-Notas/)

---

## ✨ Funcionalidades

### 📝 Notas
- ✅ Criar, editar e excluir notas
- ✅ **Seleção múltipla** de notas para ações em lote
- 📌 Fixar até **5 notas** no topo da lista
- 📂 Arquivar/desarquivar notas (abas Ativas/Arquivadas)
- 🔄 Ordenação automática por última modificação
- 🎨 Cor personalizada para cada nota
- 🏷️ Tags atribuídas no momento da criação ou depois
- 💾 **Auto-save** com debounce (salva enquanto você digita)

### 🏷️ Organização
- 🏷️ **Tags coloridas** com cor independente
- 🔍 Filtro por **tag** e por **data** (Hoje, Esta semana, Este mês)
- 📅 Data de criação e última edição visíveis no rodapé
- 🔎 Busca por **nome e conteúdo** das notas

### ✍️ Editor (TipTap)
- **Formatação**: Negrito, Itálico, Sublinhado, Tachado
- 🖍️ **Marcador de texto** (highlight) em amarelo
- 🎨 **Cor da fonte** com paleta completa
- 🔤 **Fontes e tamanhos** personalizáveis
- 📋 Listas comuns, numeradas e **checklists interativas**
- ⬅️ **Alinhamento** (esquerda, centro, direita, justificado)
- ➡️ **Recuo** com indent/outdent (Tab e Shift+Tab)
- 🔠 **Transformação de texto** (MAIÚSCULO, minúsculo, Primeira Letra Maiúscula)
- 🔗 **Links** com modal dedicado
- 🖼️ **Imagens** (URL, upload ou arrastar-e-soltar)
- 📎 **Anexos** de arquivos (PDF, DOCX, XLSX, ZIP, etc.)
- 🔄 **Desfazer/Refazer** nativo (Ctrl+Z e Ctrl+Y)
- 🔍 Busca dentro da nota com destaque de resultados

### 🖼️ Editor de imagens
- 🔧 Menu flutuante (⋮) que aparece ao passar o mouse (desktop) ou tocar (mobile)
- ✂️ **Cortar** com seleção por arrastar
- 📐 **Redimensionar** com painel flutuante e proporção travada
- ➕ **Aumentar/Diminuir 20%** com um clique
- ↩️ **Restaurar tamanho original**
- 🔗 Copiar URL da imagem
- 🗑️ Remover imagem

### 🎨 Interface
- 🌗 **Tema claro/escuro** com persistência
- 🎯 **Modo Foco** para escrita sem distrações
- 📊 **Estatísticas**: Palavras, Caracteres, data de criação e edição
- 💾 **Indicador de salvamento** (Salvando... / Salvo ✓)
- 😀 **Seletor de emojis** moderno com busca e categorias
- 🔔 **Notificações toast** animadas
- ✅ **Modais customizados** (sem usar `alert`/`confirm`/`prompt` do navegador)
- 📱 **100% responsivo** — mobile, tablet e desktop

### 🚀 Extras
- 🔤 **Autocomplete de tags** — sugere tags existentes enquanto digita
- 🌈 **Ícone dinâmico por tipo de anexo** (PDF, Word, Excel, etc.)
- 💾 **Armazenamento IndexedDB** (via `localForage`)
- 📦 Anexos armazenados como **Blob** (não inflam o HTML)
- 🎨 **Tema do sistema operacional** respeitado
- ⚡ **Mobile-first** com touch targets de 44px
- ♿ **Acessibilidade**: foco visível, prefers-reduced-motion, sem `user-scalable=no`

---

## 🛠️ Tecnologias utilizadas

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

### Core
- **[Vite](https://vitejs.dev/)** — bundler e dev server
- **[TipTap v3](https://tiptap.dev/)** — editor rich text baseado em ProseMirror
- **[localForage](https://localforage.github.io/localForage/)** — wrapper moderno do IndexedDB

### Extensões do TipTap
- `@tiptap/starter-kit` — formatação básica, listas, histórico
- `@tiptap/extension-underline` — sublinhado
- `@tiptap/extension-highlight` — marcador de texto
- `@tiptap/extension-text-style` + `extension-color` — cor da fonte
- `@tiptap/extension-font-family` — família de fonte
- `@tiptap/extension-link` — links
- `@tiptap/extension-image` — imagens
- `@tiptap/extension-text-align` — alinhamento
- `@tiptap/extension-task-list` + `extension-task-item` — checklists

### Recursos adicionais
- **[emoji-picker-element](https://github.com/nolanlawson/emoji-picker-element)** — seletor de emojis
- **Fontes do Google Fonts** (Inter, Roboto, Poppins, Montserrat, Open Sans, Lato, Nunito, Playfair Display, Source Code Pro, Oswald)
- **Ícones Font Awesome 6**

---