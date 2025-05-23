 // Função para adicionar uma nova tarefa
        function addTask() {
            const input = document.getElementById("new-task");
            const description = document.getElementById("description");
            const dueDate = document.getElementById("due-date");
            const priority = document.getElementById("priority");
            const tasksWrapper = document.getElementById("tasks-wrapper");
            const emptyState = document.getElementById("empty-state");

            const taskName = input.value.trim();
            const taskDescription = description.value.trim();
            const taskDueDate = dueDate.value;
            const taskPriority = priority.value;

            if (taskName !== "") {
                // Esconder estado vazio se for a primeira tarefa
                if (emptyState) {
                    emptyState.style.display = "none";
                }

                // Criar elemento da tarefa
                const taskElement = document.createElement("div");
                taskElement.className = "task";
                
                // Formatando a data
                let formattedDate = "Sem data definida";
                if (taskDueDate) {
                    const dateObj = new Date(taskDueDate);
                    formattedDate = dateObj.toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                }

                // Definindo classe de prioridade
                let priorityClass = "";
                let priorityText = "";
                switch(taskPriority) {
                    case "high":
                        priorityClass = "priority-high";
                        priorityText = "Alta Prioridade";
                        break;
                    case "medium":
                        priorityClass = "priority-medium";
                        priorityText = "Média Prioridade";
                        break;
                    case "low":
                        priorityClass = "priority-low";
                        priorityText = "Baixa Prioridade";
                        break;
                }

                // HTML da tarefa
                taskElement.innerHTML = `
                    <div class="task-header">
                        <input type="checkbox" class="task-item" onchange="toggleTaskComplete(this)">
                        
                        <div class="task-content">
                            <h3 class="task-title">${taskName}</h3>
                            ${taskDescription ? `<p class="task-description">${taskDescription}</p>` : ''}
                            
                            <div class="task-meta">
                                <span class="task-date">${formattedDate}</span>
                                <span class="task-priority ${priorityClass}">${priorityText}</span>
                                
                                <div class="task-actions">
                                    <button class="task-btn delete-btn" onclick="deleteTask(this)" title="Excluir tarefa">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Adicionar a tarefa no início da lista
                tasksWrapper.insertBefore(taskElement, tasksWrapper.firstChild);

                // Limpar os campos (exceto prioridade)
                input.value = "";
                description.value = "";
                dueDate.value = "";
                input.focus();

                // Atualizar contador
                updateTasksCount();

                // Salvar tarefas
                saveTasks();
            } else {
                // Efeito de erro no campo vazio
                input.style.borderColor = "var(--error)";
                input.focus();
                
                setTimeout(() => {
                    input.style.borderColor = "var(--border)";
                }, 1000);
            }
        }

        // Função para marcar/desmarcar tarefa como concluída
        function toggleTaskComplete(checkbox) {
            const task = checkbox.closest(".task");
            task.classList.toggle("completed", checkbox.checked);
            
            // Reordenar tarefas (concluídas vão para baixo)
            reorderTasks();
            
            // Salvar estado
            saveTasks();
        }

        function reorderTasks() {
            const tasksWrapper = document.getElementById("tasks-wrapper");
            const tasks = Array.from(tasksWrapper.children).filter(el => el.classList.contains("task"));
            
            // Ordenar: não concluídas primeiro, depois por prioridade (alta > média > baixa)
            tasks.sort((a, b) => {
                const aCompleted = a.classList.contains("completed");
                const bCompleted = b.classList.contains("completed");
                
                // Primeiro ordena por status (não concluídas primeiro)
                if (aCompleted !== bCompleted) {
                    return aCompleted - bCompleted;
                }
                
                // Depois ordena por prioridade
                const aPriority = getPriorityValue(a);
                const bPriority = getPriorityValue(b);
                return bPriority - aPriority;
            });
            
            // Reinserir na ordem correta
            tasks.forEach(task => {
                tasksWrapper.appendChild(task);
            });
        }

        function getPriorityValue(taskElement) {
            const priorityElement = taskElement.querySelector(".task-priority");
            if (!priorityElement) return 1;
            
            if (priorityElement.classList.contains("priority-high")) return 3;
            if (priorityElement.classList.contains("priority-medium")) return 2;
            return 1; // Baixa
        }

        // Função para excluir tarefa
        function deleteTask(button) {
            const task = button.closest(".task");
            task.style.opacity = "0";
            task.style.transform = "translateX(-20px)";
            
            setTimeout(() => {
                task.remove();
                updateTasksCount();
                checkEmptyState();
                saveTasks();
            }, 200);
        }

        // Função para verificar estado vazio
        function checkEmptyState() {
            const tasksWrapper = document.getElementById("tasks-wrapper");
            const emptyState = document.getElementById("empty-state");
            const hasTasks = tasksWrapper.querySelector(".task");
            
            if (!hasTasks && emptyState) {
                emptyState.style.display = "flex";
            }
        }

        // Função para atualizar contador de tarefas
        function updateTasksCount() {
            const countElement = document.getElementById("tasks-count");
            const tasks = document.querySelectorAll(".task");
            
            const completedTasks = document.querySelectorAll(".task.completed").length;
            const totalTasks = tasks.length;
            
            countElement.textContent = `${totalTasks} ${totalTasks === 1 ? 'item' : 'itens'} (${completedTasks} concluídos)`;
        }

        // Função para salvar tarefas no localStorage
        function saveTasks() {
            const tasksWrapper = document.getElementById("tasks-wrapper");
            const tasks = tasksWrapper.querySelectorAll(".task");
            const tasksData = [];
            
            tasks.forEach(task => {
                tasksData.push({
                    title: task.querySelector(".task-title").textContent,
                    description: task.querySelector(".task-description")?.textContent || "",
                    date: task.querySelector(".task-date").textContent,
                    priority: task.querySelector(".task-priority")?.textContent || "Média Prioridade",
                    completed: task.classList.contains("completed")
                });
            });
            
            localStorage.setItem("tasks", JSON.stringify(tasksData));
            updateTasksCount();
        }

        // Função para carregar tarefas salvas
        function loadTasks() {
            const savedTasks = localStorage.getItem("tasks");
            const tasksWrapper = document.getElementById("tasks-wrapper");
            const emptyState = document.getElementById("empty-state");
            
            if (savedTasks) {
                const tasksData = JSON.parse(savedTasks);
                
                if (tasksData.length > 0) {
                    emptyState.style.display = "none";
                    
                    tasksData.forEach(taskData => {
                        const taskElement = document.createElement("div");
                        taskElement.className = `task ${taskData.completed ? 'completed' : ''}`;
                        
                        // Determinar classe de prioridade
                        let priorityClass = "";
                        if (taskData.priority.includes("Alta")) priorityClass = "priority-high";
                        else if (taskData.priority.includes("Média")) priorityClass = "priority-medium";
                        else priorityClass = "priority-low";
                        
                        taskElement.innerHTML = `
                            <div class="task-header">
                                <input type="checkbox" class="task-item" ${taskData.completed ? 'checked' : ''} onchange="toggleTaskComplete(this)">
                                
                                <div class="task-content">
                                    <h3 class="task-title">${taskData.title}</h3>
                                    ${taskData.description ? `<p class="task-description">${taskData.description}</p>` : ''}
                                    
                                    <div class="task-meta">
                                        <span class="task-date">${taskData.date}</span>
                                        <span class="task-priority ${priorityClass}">${taskData.priority}</span>
                                        
                                        <div class="task-actions">
                                            <button class="task-btn delete-btn" onclick="deleteTask(this)" title="Excluir tarefa">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        tasksWrapper.appendChild(taskElement);
                    });
                    
                    updateTasksCount();
                }
            }
        }

        // Carregar tarefas ao iniciar
        document.addEventListener("DOMContentLoaded", () => {
            loadTasks();
            
            // Configurar data mínima como hoje
            const today = new Date().toISOString().split('T')[0];
            document.getElementById("due-date").min = today;
            
            // Adicionar tarefa ao pressionar Enter no campo principal
            document.getElementById("new-task").addEventListener("keypress", (e) => {
                if (e.key === "Enter") addTask();
            });
            
            // Botão flutuante para mobile
            document.getElementById("fab-button").addEventListener("click", () => {
                document.getElementById("new-task").focus();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });
