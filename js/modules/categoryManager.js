/*
 ██████  █████  ████████ ███████  ██████   ██████  ██████  ██    ██ 
██      ██   ██    ██    ██      ██       ██    ██ ██   ██  ██  ██  
██      ███████    ██    █████   ██   ███ ██    ██ ██████    ████   
██      ██   ██    ██    ██      ██    ██ ██    ██ ██   ██    ██    
 ██████ ██   ██    ██    ███████  ██████   ██████  ██   ██    ██    
*/

const CategoryManager = {
    /**
     * Default categories for each transaction type
     * Each category has a unique ID, name, icon, and color
     * @type {Object.<string, Array>}
     */
    categories: {
        income: [
            { id: 1, name: 'Salary', icon: 'fa-briefcase', color: 'var(--green-bright)' },
            { id: 2, name: 'Dividends', icon: 'fa-chart-line', color: 'var(--green-bright)' }
        ],
        expense: [
            { id: 3, name: 'Rent', icon: 'fa-key', color: 'var(--pink-soft)' },
            { id: 4, name: 'Food', icon: 'fa-utensils', color: 'var(--pink-soft)' },
            { id: 5, name: 'Entertainment', icon: 'fa-star', color: 'var(--pink-soft)' }
        ],
        saving: [
            { id: 6, name: 'Gifts', icon: 'fa-gift', color: 'var(--orange-medium)' },
            { id: 7, name: 'Investment', icon: 'fa-piggy-bank', color: 'var(--orange-medium)' }
        ]
    },

    /**
     * Color scheme for different transaction types
     * @type {Object.<string, string>}
     */
    typeColors: {
        'income': 'var(--green-bright)',
        'expense': 'var(--pink-soft)',
        'saving': 'var(--orange-medium)'
    },

    /**
     * Currently selected category type
     * @type {string|null}
     */
    selectedType: null,

    /**
     * Initializes category management functionality
     * Loads saved categories and sets up event handlers
     */
    init() {
        this.loadCategories();
        this.bindEvents();
        this.displayCategories();
        this.handleTypeSelection('income');
    },

    /**
     * Loads categories from local storage
     * Falls back to default categories if none saved
     */
    loadCategories() {
        const saved = StorageManager.get(STORAGE_KEYS.CATEGORIES);
        if (saved) {
            this.categories = saved;
        }
    },

    /**
     * Saves current categories to local storage
     */
    saveCategories() {
        StorageManager.set(STORAGE_KEYS.CATEGORIES, this.categories);
    },

    /**
     * Retrieves details of a specific category
     * @param {number} categoryId - ID of the category
     * @param {string} type - Transaction type (income/expense/saving)
     * @returns {Object|undefined} Category details if found
     */
    getCategoryDetails(categoryId, type) {
        const categoryList = this.categories[type] || [];
        return categoryList.find(cat => cat.id.toString() === categoryId.toString());
    },

    /**
     * Adds a new category to the specified type
     * @param {string} type - Transaction type
     * @param {Object} categoryData - Category details (name, icon)
     * @returns {Object} Newly created category
     */
    addCategory(type, categoryData) {
        const newCategory = {
            id: Date.now(),
            ...categoryData,
            color: this.typeColors[type]
        };
        
        this.categories[type].push(newCategory);
        this.saveCategories();
        this.displayCategories();
        return newCategory;
    },

    /**
     * Updates the category list display in the UI
     * Groups categories by type and adds delete buttons
     */
    displayCategories() {
        const categoryList = document.getElementById('category-list');
        if (!categoryList) return;

        categoryList.innerHTML = '';

        const sections = {
            'Incomes': this.categories.income,
            'Expenses': this.categories.expense,
            'Savings': this.categories.saving
        };

        Object.entries(sections).forEach(([title, items]) => {
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'category-section-title';
            sectionTitle.textContent = title;
            categoryList.appendChild(sectionTitle);

            items.forEach(category => {
                const type = title.toLowerCase().slice(0, -1);
                const color = this.typeColors[type];
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item';
                categoryElement.innerHTML = `
                    <i class="fa-solid ${category.icon}" style="color: ${color}"></i>
                    <span>${category.name}</span>
                    <button class="delete-category" data-type="${title}" data-id="${category.id}">×</button>
                `;
                categoryList.appendChild(categoryElement);
            });
        });
    },

    /**
     * Populates category select dropdown for a specific type
     * @param {string} type - Transaction type
     */
    populateCategorySelect(type) {
        const categorySelect = document.getElementById('category-select');
        if (!categorySelect) return;
        
        categorySelect.innerHTML = '';
        const categoryList = this.categories[type] || [];
        
        categoryList.forEach((category, index) => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (index === 0) option.selected = true;
            categorySelect.appendChild(option);
        });
    },

    /**
     * Sets up event listeners for category management
     * Handles type selection, icon selection, and category addition/deletion
     */
    bindEvents() {
        // Type selection buttons
        ['income', 'expense', 'saving'].forEach(type => {
            const btn = document.getElementById(`${type}-category-btn`);
            if (!btn) return;
    
            btn.addEventListener('click', () => {
                this.handleTypeSelection(type);
            });
        });
    
        // Icon selection
        document.querySelectorAll('.category-icons-row i').forEach(icon => {
            icon.addEventListener('click', (e) => this.handleIconSelection(e));
            // Add keyboard accessibility
            icon.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleIconSelection(e);
                }
            });
        });
    
        // Category form submission
        const categoryForm = document.getElementById('add-category-container');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddCategory(e);
            });
        }
    
        // Add button click (as backup for form submission)
        const addBtn = document.getElementById('add-data-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddCategory(e);
            });
        }
    
        // Delete category handling
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-category')) {
                this.handleDeleteCategory(e);
            }
        });
    
        // Form input validation
        const categoryDescInput = document.getElementById('add-category-desc');
        if (categoryDescInput) {
            categoryDescInput.addEventListener('input', () => {
                categoryDescInput.setCustomValidity('');
                categoryDescInput.checkValidity();
            });
    
            categoryDescInput.addEventListener('invalid', () => {
                if (categoryDescInput.value.length === 0) {
                    categoryDescInput.setCustomValidity('Please enter a category name');
                }
            });
        }
    },

    /**
     * Handles category type selection
     * Updates UI state and button styles
     * @param {string} type - Selected transaction type
     */
    handleTypeSelection(type) {
        const color = this.typeColors[type];
        this.selectedType = type;
        
        ['income', 'expense', 'saving'].forEach(t => {
            const btn = document.getElementById(`${t}-category-btn`);
            if (btn) {
                btn.classList.toggle('selected', t === type);
                btn.style.borderColor = t === type ? color : 'transparent';
            }
        });

        const addBtn = document.getElementById('add-data-category-btn');
        if (addBtn) addBtn.style.borderColor = color;

        this.resetIconSelection();
        this.displayCategories();
    },

    /**
     * Handles icon selection for new categories
     * @param {Event} e - Click event
     */
    handleIconSelection(e) {
        const selectedType = this.getSelectedType() || 'income';
        this.resetIconSelection();
        e.target.classList.add('selected');
        e.target.style.color = this.typeColors[selectedType];
    },

    /**
     * Handles adding a new category
     * Validates input and updates category list
     */
    handleAddCategory(event) {
        // Prevent form submission
        if (event) {
            event.preventDefault();
        }
    
        const selectedType = this.getSelectedType() || 'income';
        const selectedIcon = document.querySelector('.category-icons-row i.selected');
        const nameInput = document.getElementById('add-category-desc');
    
        // If no icon is selected, flash all icons in gold
        if (!selectedIcon) {
            const icons = document.querySelectorAll('.category-icons-row i');
            icons.forEach(icon => {
                icon.style.color = 'var(--orange-dark)';  
                setTimeout(() => {
                    icon.style.color = 'var(--text-primary)';
                }, 300);  
            });
            return;
        }
    
        if (!nameInput.value) {
            return;
        }
    
        this.addCategory(selectedType, {
            name: nameInput.value,
            icon: selectedIcon.className.split(' ')[1]
        });
    
        nameInput.value = '';
        this.resetIconSelection();
        this.populateCategorySelect(selectedType);
    },

    /**
     * Handles category deletion
     * Removes category and updates storage/display
     * @param {Event} e - Click event
     */
    handleDeleteCategory(e) {
        const typeMap = {
            'Incomes': 'income',
            'Expenses': 'expense',
            'Savings': 'saving'
        };
        
        const type = typeMap[e.target.dataset.type];
        const id = parseInt(e.target.dataset.id);
        
        this.categories[type] = this.categories[type].filter(cat => cat.id !== id);
        this.saveCategories();
        this.displayCategories();
    },

    /**
     * Gets currently selected category type
     * @returns {string|null} Selected type or null if none selected
     */
    getSelectedType() {
        return this.selectedType || null;
    },

    /**
     * Resets icon selection state
     * Removes selection styling from all icons
     */
    resetIconSelection() {
        document.querySelectorAll('.category-icons-row i').forEach(icon => {
            icon.style.color = 'var(--text-primary)';
            icon.classList.remove('selected');
        });
    }
};