const CategoryManager = {
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

    typeColors: {
        'income': 'var(--green-bright)',
        'expense': 'var(--pink-soft)',
        'saving': 'var(--orange-medium)'
    },

    selectedType: null,

    init() {
        this.loadCategories();
        this.bindEvents();
        this.displayCategories();
    },

    loadCategories() {
        const saved = StorageManager.get(STORAGE_KEYS.CATEGORIES);
        if (saved) {
            this.categories = saved;
        }
    },

    saveCategories() {
        StorageManager.set(STORAGE_KEYS.CATEGORIES, this.categories);
    },

    getCategoryDetails(categoryId, type) {
        const categoryList = this.categories[type] || [];
        return categoryList.find(cat => cat.id.toString() === categoryId.toString());
    },

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
                const type = title.toLowerCase().slice(0, -1); // Convert 'Incomes' to 'income'
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

    bindEvents() {
        ['income', 'expense', 'saving'].forEach(type => {
            const btn = document.getElementById(`${type}-category-btn`);
            if (!btn) return;

            btn.addEventListener('click', () => {
                this.handleTypeSelection(type);
            });
        });

        document.querySelectorAll('.category-icons-row i').forEach(icon => {
            icon.addEventListener('click', (e) => this.handleIconSelection(e));
        });

        const addBtn = document.getElementById('add-data-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleAddCategory());
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-category')) {
                this.handleDeleteCategory(e);
            }
        });
    },

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

    handleIconSelection(e) {
        const selectedType = this.getSelectedType() || 'income';
        this.resetIconSelection();
        e.target.classList.add('selected');
        e.target.style.color = this.typeColors[selectedType];
    },

    handleAddCategory() {
        const selectedType = this.getSelectedType() || 'income';
        const selectedIcon = document.querySelector('.category-icons-row i.selected');
        const nameInput = document.getElementById('add-category-desc');

        if (!selectedIcon || !nameInput.value) {

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

    getSelectedType() {
        return this.selectedType || null;
    },

    resetIconSelection() {
        document.querySelectorAll('.category-icons-row i').forEach(icon => {
            icon.style.color = 'var(--text-primary)';
            icon.classList.remove('selected');
        });
    }
};