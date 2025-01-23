const BudgetManager = {
    data: null,
    isEditMode: false,
    typeColors: {
        'income': 'var(--green-bright)',
        'expense': 'var(--pink-soft)',
        'saving': 'var(--orange-medium)'
    },


    init() {
        this.data = { income: [], expense: [], saving: [] };
        this.loadData();
        this.initializeTypeButtons();
        this.initializeEditButton();
        this.initializeAddButton();
        this.setDefaultDate();
    },

    // Data Management
    loadData() {
        const savedData = StorageManager.get(STORAGE_KEYS.BUDGET);
        if (savedData?.income && savedData?.expense && savedData?.saving) {
            this.data = savedData;
        }
        this.updateDisplay();
    },

    saveData() {
        StorageManager.set(STORAGE_KEYS.BUDGET, this.data);
    },

    // Entry Management
    addEntry(type, entryData) {
        if (!this.validateEntry(entryData)) return false;

        const entry = {
            id: Date.now(),
            ...entryData,
            amount: parseFloat(entryData.amount),
            frequency: entryData.frequency || 'single'
        };

        this.data[type].push(entry);
        this.saveData();
        this.updateDisplay();
        return true;
    },

    updateEntry(entryId, updates) {
        ['income', 'expense', 'saving'].forEach(type => {
            const entry = this.data[type].find(e => e.id === entryId);
            if (entry) {
                Object.assign(entry, updates);
            }
        });
        this.saveData();
        this.updateDisplay();
    },
    
    deleteEntry(entryId) {
        ['income', 'expense', 'saving'].forEach(type => {
            this.data[type] = this.data[type].filter(entry => entry.id !== entryId);
        });
        this.saveData();
        this.updateDisplay();
    },

    validateEntry(entry) {
        return Validator.validateBudgetEntry(entry);
    },

    // UI Event Handlers
    initializeTypeButtons() {
        ['income', 'expense', 'saving'].forEach(type => {
            const btn = document.getElementById(`${type}-data-btn`);
            if (btn) btn.addEventListener('click', () => this.handleTypeSelection(type));
        });
    },

    handleTypeSelection(type) {
        const color = this.typeColors[type];
        
        ['income', 'expense', 'saving'].forEach(t => {
            const btn = document.getElementById(`${t}-data-btn`);
            if (btn) {
                btn.classList.toggle('selected', t === type);
                btn.style.borderColor = t === type ? color : 'transparent';
            }
        });

        const addBtn = document.getElementById('add-data-btn');
        const categoriesBtn = document.getElementById('categories-btn');
        if (addBtn) addBtn.style.borderColor = color;
        if (categoriesBtn) categoriesBtn.style.borderColor = color;
        
        CategoryManager.populateCategorySelect(type);
    },

    initializeEditButton() {
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }
    },

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.classList.toggle('active');
            editBtn.innerHTML = this.isEditMode ? 
                '<i class="fa-solid fa-xmark"></i>' : 
                '<i class="fa-solid fa-pen-to-square"></i>';
        }
        this.updateDisplay();
    },


    bindEditEvents() {
        if (!this.isEditMode) return;
    
        // Bind delete buttons
        document.querySelectorAll('.delete-transaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Delete this transaction?')) {
                    const entryRow = e.target.closest('.entry-row');
                    const entryId = parseInt(entryRow.dataset.id);
                    this.deleteEntry(entryId);
                }
            });
        });
    
        // Bind input change events
        document.querySelectorAll('.entry-row.edit-mode').forEach(row => {
            const entryId = parseInt(row.dataset.id);
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    const updates = {
                        date: row.querySelector('.edit-date')?.value,
                        description: row.querySelector('.edit-desc')?.value,
                        amount: parseFloat(row.querySelector('.edit-amount')?.value)
                    };
                    this.updateEntry(entryId, updates);
                });
            });
        });
    },

    initializeAddButton() {
        const addDataBtn = document.getElementById('add-data-btn');
        if (!addDataBtn) return;

        addDataBtn.addEventListener('click', () => {
            const selectedTypeBtn = document.querySelector('#add-data-container button.selected');
            if (!selectedTypeBtn) {
                alert('Please select a type (Income/Expense/Saving)');
                return;
            }

            const type = selectedTypeBtn.id.split('-')[0];
            const entryData = {
                category: document.getElementById('category-select').value,
                description: document.getElementById('add-desc').value,
                amount: document.getElementById('add-amount').value,
                date: document.getElementById('add-date').value,
                frequency: document.getElementById('add-frequency').value
            };

            if (this.addEntry(type, entryData)) {
                this.clearAddForm();
            }
        });
    },

    clearAddForm() {
        document.getElementById('add-desc').value = '';
        document.getElementById('add-date').value = this.getTodayDate();
        document.getElementById('add-amount').value = '';
        document.getElementById('add-frequency').value = 'single';
    },

    // Display Methods
    createEntryHTML(entry) {
        return `
            <div class="entry-row ${this.isEditMode ? 'edit-mode' : ''}" data-id="${entry.id}">
                <div class="entry-date">
                    ${this.isEditMode ? 
                        `<input type="date" class="edit-date" value="${entry.date}">` :
                        Formatter.date(entry.date)
                    }
                    ${entry.frequency !== 'single' ? `(${entry.frequency})` : ''}
                </div>
                <div class="entry-desc">
                    ${this.isEditMode ? 
                        `<input type="text" class="edit-desc" value="${entry.description}">` :
                        entry.description
                    }
                </div>
                <div class="entry-amount">
                    ${this.isEditMode ? 
                        `<input type="number" class="edit-amount" value="${entry.amount}">` :
                        Formatter.currency(entry.amount)
                    }
                </div>
                ${this.isEditMode ? '<button class="delete-transaction">×</button>' : ''}
            </div>
        `;
    },

    createCategoryGroupHTML(categoryId, data, type) {
        const categoryDetails = CategoryManager.getCategoryDetails(categoryId, type);
        const icon = categoryDetails ? `<i class="fa-solid ${categoryDetails.icon}"></i>` : '';
        const name = categoryDetails ? categoryDetails.name : 'Uncategorized';
        
        return `
            <div class="category-group">
                <div class="category-header">
                    ${icon}
                    <span class="category-name">${name}</span>
                    <span class="category-total">${Formatter.currency(data.total)}</span>
                </div>
                <div class="category-entries">
                    ${data.items
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(item => this.createEntryHTML(item))
                        .join('')}
                </div>
            </div>
        `;
    },

    calculateCategoryTotals(entries = []) {
        return entries.reduce((acc, entry) => {
            if (!acc[entry.category]) {
                acc[entry.category] = { total: 0, items: [] };
            }
            acc[entry.category].total += entry.amount;
            acc[entry.category].items.push(entry);
            return acc;
        }, {});
    },

    updateDisplay() {
        if (!this.data) return;

        const totals = {
            income: this.calculateCategoryTotals(this.data.income),
            expense: this.calculateCategoryTotals(this.data.expense),
            saving: this.calculateCategoryTotals(this.data.saving)
        };

        ['income', 'expense', 'saving'].forEach(type => {
            const container = document.getElementById(`${type}s-data-table`);
            if (container) {
                container.innerHTML = this.createSectionHTML(
                    type.charAt(0).toUpperCase() + type.slice(1) + 's',
                    totals[type],
                    type
                );
            }
        });

        this.updateBalance(totals);
    },

    createSectionHTML(title, totals, type) {
        if (Object.keys(totals).length === 0) return '';
        
        return `
            <div class="section-header">
                <h2>${title}</h2>
            </div>
            ${Object.entries(totals)
                .map(([categoryId, data]) => 
                    this.createCategoryGroupHTML(categoryId, data, type))
                .join('')}
        `;
    },

    updateBalance(totals) {
        const totalIncome = Object.values(totals.income)
            .reduce((sum, data) => sum + data.total, 0);
        const totalExpenses = Object.values(totals.expense)
            .reduce((sum, data) => sum + data.total, 0);
        const totalSavings = Object.values(totals.saving)
            .reduce((sum, data) => sum + data.total, 0);
        
        const balance = totalIncome - (totalExpenses + totalSavings);
        
        const balanceContainer = document.getElementById('balance');
        if (balanceContainer) {
            balanceContainer.innerHTML = `
                <div class="balance-row">
                    <span>Balance = </span>
                    <span class="balance-amount ${balance >= 0 ? 'positive' : 'negative'}">
                        ${balance >= 0 ? '+' : ''} ${Formatter.currency(balance)}
                    </span>
                </div>
            `;
        }
    },

    // Utility Methods
    getTodayDate() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    },

    setDefaultDate() {
        const dateInput = document.getElementById('add-date');
        if (dateInput) dateInput.value = this.getTodayDate();
    }
};

document.addEventListener('DOMContentLoaded', () => BudgetManager.init());