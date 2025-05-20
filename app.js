// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const categoryButtons = document.querySelectorAll('.category-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentSearch = '';

// Theme
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);
updateThemeIcon();

// Event Listeners
todoForm.addEventListener('submit', handleSubmit);
themeToggle.addEventListener('click', toggleTheme);
searchInput.addEventListener('input', handleSearch);
searchBtn.addEventListener('click', () => handleSearch({ target: searchInput }));

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderTodos();
    });
});

// Functions
function handleSubmit(e) {
    e.preventDefault();
    const todoText = todoInput.value.trim();
    
    if (todoText) {
        const dueDate = document.getElementById('due-date').value;
        const priority = document.getElementById('priority').value;
        const category = document.getElementById('category').value;
        const notes = document.getElementById('task-notes').value.trim();
        
        const todo = {
            id: Date.now(),
            text: todoText,
            completed: false,
            dueDate: dueDate || null,
            priority: priority || 'medium',
            category: category || 'other',
            notes: notes || '',
            createdAt: new Date().toISOString()
        };
        
        todos.push(todo);
        saveTodos();
        renderTodos();
        todoInput.value = '';
        document.getElementById('due-date').value = '';
        document.getElementById('priority').value = 'medium';
        document.getElementById('category').value = 'personal';
        document.getElementById('task-notes').value = '';
    }
}

function handleSearch(e) {
    currentSearch = e.target.value.toLowerCase().trim();
    renderTodos();
}

function isOverdue(date) {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    themeToggle.innerHTML = theme === 'light' 
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
}

function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    const newText = prompt('Edit task:', todo.text);
    const newDueDate = prompt('Edit due date (YYYY-MM-DD):', todo.dueDate || '');
    const newPriority = prompt('Edit priority (high/medium/low):', todo.priority);
    const newCategory = prompt('Edit category (personal/work/shopping/health/other):', todo.category);
    const newNotes = prompt('Edit notes:', todo.notes);
    
    if (newText && newText.trim()) {
        todos = todos.map(todo =>
            todo.id === id ? { 
                ...todo, 
                text: newText.trim(),
                dueDate: newDueDate || null,
                priority: newPriority || 'medium',
                category: newCategory || 'other',
                notes: newNotes || ''
            } : todo
        );
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    let filteredTodos = todos.filter(todo => {
        // Apply search filter
        if (currentSearch && !todo.text.toLowerCase().includes(currentSearch)) {
            return false;
        }
        
        // Apply category filter
        if (currentCategory !== 'all' && todo.category !== currentCategory) {
            return false;
        }
        
        // Apply status filter
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        if (currentFilter === 'overdue') return !todo.completed && isOverdue(todo.dueDate);
        return true;
    });

    // Sort todos based on priority and due date
    filteredTodos.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });

    todoList.innerHTML = filteredTodos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority} category-${todo.category}" data-id="${todo.id}">
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
                aria-label="Mark task as ${todo.completed ? 'incomplete' : 'complete'}"
            >
            <div class="todo-content">
                <div class="todo-header">
                    <span class="todo-text">${todo.text}</span>
                    <span class="category-badge">${todo.category}</span>
                </div>
                ${todo.dueDate ? `
                    <span class="due-date ${isOverdue(todo.dueDate) ? 'overdue' : ''}">
                        <i class="far fa-calendar"></i> ${formatDate(todo.dueDate)}
                    </span>
                ` : ''}
                ${todo.notes ? `
                    <div class="todo-notes">
                        <i class="fas fa-sticky-note"></i> ${todo.notes}
                    </div>
                ` : ''}
            </div>
            <div class="todo-actions">
                <button class="edit-btn" aria-label="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');

    // Add event listeners to the newly created elements
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = parseInt(e.target.closest('.todo-item').dataset.id);
            toggleTodo(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('.todo-item').dataset.id);
            editTodo(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('.todo-item').dataset.id);
            deleteTodo(id);
        });
    });
}

// Initial render
renderTodos(); 