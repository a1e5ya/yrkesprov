// budgetManager.js - Part 1: Core Setup and Initialization

const BudgetManager = {
    data: null,
    isEditMode: false,
    typeColors: {
        'income': 'var(--green-bright)',
        'expense': 'var(--pink-soft)',
        'saving': 'var(--orange-medium)'
    },

    _debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    init() {
        this.data = { income: [], expense: [], saving: [] };
        this.loadData();
        this.initializeTypeButtons();
        this.initializeEditButton();
        this.initializeAddButton();
        this.handleTypeSelection('income');
        
        // Attach table balance event listener
        const tableBalanceSelect = document.getElementById('table-balance');
        if (tableBalanceSelect) {
            tableBalanceSelect.addEventListener('change', (e) => {
                const container = document.querySelector('#budget-table .period-balance');
                if (container) {
                    const months = parseInt(e.target.value);
                    const years = months / 12;
                    const balance = this.calculateMultiYearBalance(years);
                    
                    container.innerHTML = `
                        <span class="balance-total ${balance >= 0 ? 'positive' : 'negative'}">
                            ${balance >= 0 ? '+' : ''} ${Formatter.currency(balance)}
                        </span>
                    `;
                }
            });
        }
        
        this.updateDisplay();
    },

    updateTableBalance(months) {
        const container = document.querySelector('#budget-table .period-balance');
        if (!container) return;
    
        // Cache the calculation
        const key = `balance_${months}`;
        if (!this._balanceCache) this._balanceCache = {};
        
        if (!this._balanceCache[key]) {
            const years = parseInt(months) / 12;
            this._balanceCache[key] = this.calculateMultiYearBalance(years);
        }
    
        const balance = this._balanceCache[key];
        container.innerHTML = `
            <span class="balance-total ${balance >= 0 ? 'positive' : 'negative'}">
                ${balance >= 0 ? '+' : ''} ${Formatter.currency(balance)}
            </span>
        `;
    },

    clearBalanceCache() {
        this._balanceCache = {};
    },

    saveData() {
        StorageManager.set(STORAGE_KEYS.BUDGET, this.data);
        this.clearBalanceCache();
        document.dispatchEvent(new Event('budgetUpdated'));
    },

    loadData() {
        const savedData = StorageManager.get(STORAGE_KEYS.BUDGET);
        this.data = {
            income: savedData?.income || [],
            expense: savedData?.expense || [],
            saving: savedData?.saving || []
        };
        this.updateDisplay();
    },

    // budgetManager.js - Part 2: Balance Calculations

    calculateMultiYearBalance(years) {
        const startDate = new Date();
        const numberOfMonths = years * 12;
        
        // Calculate totals for each type
        const calculateTotal = (entries) => {
            return entries.reduce((total, entry) => {
                let entryTotal = 0;
                
                if (entry.frequency === 'single') {
                    // Single entries only count if they're in the future period
                    const entryDate = new Date(entry.date);
                    if (entryDate <= new Date(startDate.getTime() + years * 365 * 24 * 60 * 60 * 1000)) {
                        entryTotal = entry.amount;
                    }
                } 
                else if (entry.frequency === 'monthly') {
                    // Monthly entries
                    entryTotal = entry.amount * numberOfMonths;
                }
                else if (entry.frequency === 'yearly') {
                    // Yearly entries
                    entryTotal = entry.amount * years;
                }
                
                return total + entryTotal;
            }, 0);
        };
    
        // Calculate totals for each type
        const incomeTotal = calculateTotal(this.data.income || []);
        const expenseTotal = calculateTotal(this.data.expense || []);
        const savingsTotal = calculateTotal(this.data.saving || []);
    
        // Debug output
    
        return incomeTotal - (expenseTotal + savingsTotal);
    },

// In budgetManager.js, update the getEntriesForPeriod method:

getEntriesForPeriod(type, dateType, dateValue, forBalance = false) {
    const entries = [];
    if (!dateValue || !this.data[type]) return entries;
    
    const selectedDate = new Date(dateValue);
    const endDate = dateType === 'all' ? new Date(2100, 11, 31) : this.getPeriodEndDate(selectedDate, dateType);
    
    this.data[type].forEach(entry => {
        const entryDate = new Date(entry.date);
        
        if (entryDate > endDate) return;
        
        if (entry.frequency === 'single') {
            if (this.isDateInPeriod(entryDate, selectedDate, dateType)) {
                entries.push(entry);
            }
            return;
        }
        
        // Handle recurring entries
        if (entry.frequency === 'monthly') {
            let currentDate = new Date(entry.date);
            const entryEndDate = entry.endDate ? new Date(entry.endDate) : endDate;
            
            while (currentDate <= endDate && currentDate <= entryEndDate) {
                if (this.isDateInPeriod(currentDate, selectedDate, dateType)) {
                    entries.push({
                        ...entry,
                        date: currentDate.toISOString().split('T')[0]
                    });
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        } else if (entry.frequency === 'yearly') {
            let currentDate = new Date(entry.date);
            while (currentDate <= endDate) {
                if (this.isDateInPeriod(currentDate, selectedDate, dateType)) {
                    entries.push({
                        ...entry,
                        date: currentDate.toISOString().split('T')[0]
                    });
                }
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
        }
    });
    
    return entries;
},

    isDateInPeriod(date, selectedDate, periodType) {
        switch (periodType) {
            case 'day':
                return date.toDateString() === selectedDate.toDateString();
            case 'month':
                return date.getMonth() === selectedDate.getMonth() 
                    && date.getFullYear() === selectedDate.getFullYear();
            case 'year':
                return date.getFullYear() === selectedDate.getFullYear();
            default:
                return true;
        }
    },

    getPeriodEndDate(date, periodType) {
        const endDate = new Date(date);
        switch (periodType) {
            case 'day':
                return endDate;
            case 'month':
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(0);
                return endDate;
            case 'year':
                endDate.setFullYear(endDate.getFullYear() + 1);
                endDate.setMonth(0, 0);
                return endDate;
            default:
                return new Date(2100, 11, 31);
        }
    },

    // budgetManager.js - Part 3: Entry Management

    addEntry(type, entryData) {
        if (type === 'saving') {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            const targetDate = new Date(entryData.date);
            const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            
            const timeDiff = targetStart - todayStart;
            if (timeDiff <= 0) {
                return false;
            }
        
            const monthlyAmount = entryData.amount / Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30.44)));
            
            entryData.date = todayStart.toISOString().split('T')[0];
            entryData.endDate = targetStart.toISOString().split('T')[0];
            entryData.amount = monthlyAmount;
            entryData.frequency = 'monthly';
        }

        if (!this.validateEntry(entryData)) return false;

        const entry = {
            id: Date.now(),
            category: entryData.category,
            description: entryData.description,
            amount: parseFloat(entryData.amount),
            date: entryData.date,
            frequency: entryData.frequency || 'single',
            endDate: entryData.endDate
        };

        if (!this.data[type]) {
            this.data[type] = [];
        }

        this.data[type].push(entry);
        this.saveData();
        this.updateDisplay();
        return true;
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

    // budgetManager.js - Part 4: UI Event Handlers

    handleTypeSelection(type) {
        const color = this.typeColors[type];
        
        ['income', 'expense', 'saving'].forEach(t => {
            const btn = document.getElementById(`${t}-data-btn`);
            if (btn) {
                btn.classList.toggle('selected', t === type);
                btn.style.borderColor = t === type ? color : 'transparent';
            }
        });

        const frequencySelect = document.getElementById('add-frequency');
        if (frequencySelect) {
            frequencySelect.style.display = type === 'saving' ? 'none' : 'block';
        }

        const addBtn = document.getElementById('add-data-btn');
        const categoriesBtn = document.getElementById('categories-btn');
        if (addBtn) addBtn.style.borderColor = color;
        if (categoriesBtn) categoriesBtn.style.borderColor = color;
        
        CategoryManager.populateCategorySelect(type);
    },

    initializeTypeButtons() {
        ['income', 'expense', 'saving'].forEach(type => {
            const btn = document.getElementById(`${type}-data-btn`);
            if (btn) btn.addEventListener('click', () => this.handleTypeSelection(type));
        });
    },

    initializeEditButton() {
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
            editBtn.replaceWith(editBtn.cloneNode(true));
            const newEditBtn = document.getElementById('edit-btn');
            newEditBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }
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

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.classList.toggle('active');
            editBtn.innerHTML = this.isEditMode ? 
                '<i class="fa-solid fa-check"></i>' : 
                '<i class="fa-solid fa-pen-to-square"></i>';
        }
        this.updateDisplay();
    },

    bindEditEvents() {
        if (!this.isEditMode) return;
    
        // Handle delete events
        document.querySelectorAll('.delete-transaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Delete this transaction?')) {
                    const entryRow = e.target.closest('.entry-row');
                    const entryId = parseInt(entryRow.dataset.id);
                    this.deleteEntry(entryId);
                }
            });
        });
    
        // Handle edit events
        document.querySelectorAll('.entry-row.edit-mode').forEach(row => {
            const entryId = parseInt(row.dataset.id);
            
            // Find the entry in data
            let entry;
            ['income', 'expense', 'saving'].forEach(type => {
                const found = this.data[type].find(e => e.id === entryId);
                if (found) entry = found;
            });
    
            if (!entry) return;
    
            const inputs = row.querySelectorAll('input');
            
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    const updates = {};
                    
                    if (input.classList.contains('edit-date')) {
                        updates.date = input.value;
                    }
                    if (input.classList.contains('edit-desc')) {
                        updates.description = input.value;
                    }
                    if (input.classList.contains('edit-amount')) {
                        updates.amount = parseFloat(input.value);
                    }
                    if (input.classList.contains('edit-target-date')) {
                        updates.endDate = input.value;
                        
                        // Recalculate monthly amount based on new target date
                        const startDate = new Date(entry.date);
                        const endDate = new Date(input.value);
                        const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                        const totalAmountInput = row.querySelector('.edit-total-amount');
                        if (totalAmountInput) {
                            updates.amount = parseFloat(totalAmountInput.value) / months;
                        }
                    }
                    if (input.classList.contains('edit-total-amount')) {
                        const startDate = new Date(entry.date);
                        const endDate = new Date(row.querySelector('.edit-target-date')?.value || entry.endDate);
                        const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                        updates.amount = parseFloat(input.value) / months;
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        this.updateEntry(entryId, updates);
                    }
                });
            });
        });
    },

    updateEntry(entryId, updates) {
        ['income', 'expense', 'saving'].forEach(type => {
            this.data[type] = this.data[type].map(entry => {
                if (entry.id === entryId) {
                    return { ...entry, ...updates };
                }
                return entry;
            });
        });
        this.saveData();
        this.updateDisplay();
    },

    // budgetManager.js - Part 5: Display and Update Methods

    updateDisplay() {
        if (!this.data) return;
    
        // Calculate and display category totals
        ['income', 'expense', 'saving'].forEach(type => {
            const container = document.getElementById(`${type}s-data-table`);
            if (container) {
                const entries = this.data[type] || [];
                const totals = this.calculateCategoryTotals(entries);
                container.innerHTML = this.createSectionHTML(
                    type.charAt(0).toUpperCase() + type.slice(1) + 's',
                    totals,
                    type
                );
            }
        });
    
        // Initial balance display for table
        const tableBalanceSelect = document.getElementById('table-balance');
        const tableBalanceContainer = document.querySelector('#budget-table .period-balance');
        if (tableBalanceSelect && tableBalanceContainer) {
            const months = parseInt(tableBalanceSelect.value);
            const years = months / 12;
            const balance = this.calculateMultiYearBalance(years);
            
            tableBalanceContainer.innerHTML = `
                <span class="balance-total ${balance >= 0 ? 'positive' : 'negative'}">
                    ${balance >= 0 ? '+' : ''} ${Formatter.currency(balance)}
                </span>
            `;
        }
    
        this.bindEditEvents();
        document.dispatchEvent(new Event('budgetUpdated'));
    },

    calculateCategoryTotals(entries = []) {
        const totals = {};
        entries.forEach(entry => {
            if (!totals[entry.category]) {
                totals[entry.category] = {
                    total: 0,
                    items: []
                };
            }
            totals[entry.category].items.push(entry);
            totals[entry.category].total += parseFloat(entry.amount);
        });
        return totals;
    },

    clearAddForm() {
        document.getElementById('add-desc').value = '';
        document.getElementById('add-date').value = this.getTodayDate();
        document.getElementById('add-amount').value = '';
        document.getElementById('add-frequency').value = 'single';
    },


    // budgetManager.js - Part 6: HTML Generation Methods

    createSectionHTML(title, totals, type) {
        if (Object.keys(totals).length === 0) return '';
        
        const categoryGroups = Object.entries(totals).map(([categoryId, data]) => {
            return this.createCategoryGroupHTML(categoryId, data, type);
        }).join('');

        return `
            <div class="section-header">
                <h2>${title}</h2>
            </div>
            ${categoryGroups}
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

    createEntryHTML(entry) {
// In budgetManager.js, find createEntryHTML method and replace the savings part (the first if block):

if (entry.frequency === 'monthly' && entry.endDate) {
    const startDate = new Date(entry.date);
    const endDate = new Date(entry.endDate);
    const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
    const totalAmount = entry.amount * months;

    return `
        <div class="entry-row ${this.isEditMode ? 'edit-mode' : ''}" data-id="${entry.id}">
            <div class="saving-details">
                <span class="description">
                    ${this.isEditMode ? 
                        `<input type="text" class="edit-desc" value="${entry.description}" style="border: 1px solid var(--text-primary);">` :
                        entry.description}
                </span>
                <span class="total-amount">
                    ${this.isEditMode ? 
                        `<input type="number" class="edit-total-amount" value="${totalAmount}" style="border: 1px solid var(--text-primary);">` :
                        Formatter.currency(totalAmount)}
                </span>
            </div>
            <div class="saving-schedule">
                <span class="target-date">
                    ${this.isEditMode ? 
                        `<input type="date" class="edit-target-date" value="${entry.endDate}" style="border: 1px solid var(--text-primary);">` :
                        Formatter.date(entry.endDate)}
                </span>
                <span class="duration">${months} months</span>
                <span class="monthly-amount">
                    ${this.isEditMode ? 
                        `<input type="number" class="edit-amount" value="${entry.amount}" style="border: 1px solid var(--text-primary);">` :
                        `${Formatter.currency(entry.amount)}/month`}
                </span>
            </div>
            <div class="progress-bar">
                ${Array(months).fill('<div class="progress-segment"></div>').join('')}
            </div>
            ${this.isEditMode ? '<button class="delete-transaction">×</button>' : ''}
        </div>
    `;
}

        return `
            <div class="entry-row ${this.isEditMode ? 'edit-mode' : ''}" data-id="${entry.id}">
                <div class="entry-date">
                    ${this.isEditMode ? 
                        `<input type="date" class="edit-date" value="${entry.date}">` :
                        Formatter.date(entry.date)}
                    ${entry.frequency && entry.frequency !== 'single' ? ` (${entry.frequency})` : ''}
                </div>
                <div class="entry-desc">
                    ${this.isEditMode ? 
                        `<input type="text" class="edit-desc" value="${entry.description}">` :
                        entry.description}
                </div>
                <div class="entry-amount">
                    ${this.isEditMode ? 
                        `<input type="number" class="edit-amount" value="${entry.amount}">` :
                        Formatter.currency(entry.amount)}
                </div>
                ${this.isEditMode ? '<button class="delete-transaction">×</button>' : ''}
            </div>
        `;
    },

    getTodayDate() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    },
};

document.addEventListener('DOMContentLoaded', () => BudgetManager.init());