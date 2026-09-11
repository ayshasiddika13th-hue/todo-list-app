class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.sortBy = 'date';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Add task
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.closest('.filter-btn').dataset.filter));
        });

        // Action buttons
        document.getElementById('sortBtn').addEventListener('click', () => this.toggleSort());
        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.clearCompleted());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportTasks());
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const category = document.getElementById('categorySelect').value;
        const text = input.value.trim();

        if (text === '') {
            alert('Please enter a task!');
            input.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            category: category,
            completed: false,
            createdAt: new Date().toLocaleDateString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        input.value = '';
        this.render();
        this.showNotification('✅ Task added successfully!');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toLocaleDateString() : null;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.showNotification('🗑️ Task deleted!');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.render();
    }

    toggleSort() {
        const sorts = ['date', 'name', 'category'];
        const currentIndex = sorts.indexOf(this.sortBy);
        this.sortBy = sorts[(currentIndex + 1) % sorts.length];
        this.render();
        this.showNotification(`📊 Sorted by ${this.sortBy}`);
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            alert('No completed tasks to clear!');
            return;
        }
        if (confirm(`Delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.showNotification(`🧹 Cleared ${completedCount} completed task(s)!`);
        }
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            alert('No tasks to export!');
            return;
        }

        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todo-list-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        this.showNotification('📥 Tasks exported successfully!');
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            case 'pending':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'work':
            case 'personal':
            case 'shopping':
            case 'health':
            case 'other':
                filtered = filtered.filter(t => t.category === this.currentFilter);
                break;
        }

        return this.sortTasks(filtered);
    }

    sortTasks(tasksToSort) {
        const sorted = [...tasksToSort];
        switch (this.sortBy) {
            case 'name':
                sorted.sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'category':
                sorted.sort((a, b) => a.category.localeCompare(b.category));
                break;
            case 'date':
            default:
                // Keep original order (by creation date)
                break;
        }
        return sorted;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const remaining = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('remainingTasks').textContent = remaining;
    }

    render() {
        this.updateStats();
        const tasksList = document.getElementById('tasksList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>${this.currentFilter === 'all' ? 'No tasks yet. Add one to get started! 🚀' : 'No tasks in this category! ✨'}</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => this.createTaskElement(task)).join('');
        this.attachTaskListeners();
    }

    createTaskElement(task) {
        const categoryEmoji = {
            work: '💼',
            personal: '👤',
            shopping: '🛒',
            health: '🏥',
            other: '📌'
        };

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    data-id="${task.id}"
                >
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-category ${task.category}">
                            ${categoryEmoji[task.category]} ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                        </span>
                        <span class="task-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${task.createdAt}
                        </span>
                        ${task.completedAt ? `<span class="task-date" style="color: var(--success-color);"><i class="fas fa-check-circle"></i> ${task.completedAt}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit" title="Edit" data-id="${task.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete" title="Delete" data-id="${task.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachTaskListeners() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleTask(parseInt(e.target.dataset.id)));
        });

        document.querySelectorAll('.task-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteTask(parseInt(e.currentTarget.dataset.id)));
        });

        document.querySelectorAll('.task-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.editTask(parseInt(e.currentTarget.dataset.id)));
        });
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
            this.render();
            this.showNotification('✏️ Task updated!');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : [];
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);