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
        this.initializeDateSelectors();
        this.setDefaultDate();
        this.handleTypeSelection('income');
        this.updateDisplay();
    },
 
    initializeDateSelectors() {
        const today = new Date();
        document.getElementById('table-date-value').value = this.getTodayDate();
        document.getElementById('pie-date-value').value = this.getTodayDate();
        
        document.getElementById('table-date-type').addEventListener('change', () => this.updateDisplay());
        document.getElementById('table-date-value').addEventListener('change', () => this.updateDisplay());
    },
 
    calculateRecurringEntries(entry, startDate, endDate) {
        const entries = [];
        let currentDate = new Date(entry.date);
        
        while (currentDate <= endDate) {
            if (currentDate >= startDate) {
                entries.push({
                    ...entry,
                    date: currentDate.toISOString().split('T')[0]
                });
            }
    
            switch (entry.frequency) {
                case 'monthly':
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    // Check if date is valid (handles month overflow)
                    if (newDate.getMonth() !== (currentDate.getMonth() + 1) % 12) {
                        newDate.setDate(0); // Set to last day of previous month
                    }
                    currentDate = newDate;
                    break;
                case 'yearly':
                    currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
                    break;
                default:
                    currentDate = new Date(endDate.getTime() + 1);
            }
        }
        
        return entries;
    },
    
    getEntriesForPeriod(type, dateType, dateValue, forBalance = false) {
        const entries = [];
        if (!dateValue || !this.data[type]) return entries;
        
        const selectedDate = new Date(dateValue);
        const endDate = new Date(selectedDate);
        endDate.setFullYear(endDate.getFullYear() + 2);

        this.data[type].forEach(entry => {
            // For table display - show original entry only
            if (!forBalance) {
                entries.push(entry);
                return;
            }

            // For balance calculation - calculate all occurrences
            if (entry.frequency === 'single') {
                if (this.isDateInPeriod(new Date(entry.date), selectedDate, dateType)) {
                    entries.push(entry);
                }
                return;
            }

            let currentDate = new Date(entry.date);
            while (currentDate <= endDate) {
                if (this.isDateInPeriod(currentDate, selectedDate, dateType)) {
                    entries.push({
                        ...entry,
                        date: currentDate.toISOString().split('T')[0]
                    });
                }
                
                if (entry.frequency === 'monthly') {
                    currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
                } else if (entry.frequency === 'yearly') {
                    currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
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
        // Dispatch event for real-time updates
        document.dispatchEvent(new Event('budgetUpdated'));
    },
 
    // Entry Management
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
            entryData.description = entryData.description;
        }
    
        if (!this.validateEntry(entryData)) return false;
    
        const entry = {
            id: Date.now(),
            ...entryData,
            amount: parseFloat(entryData.amount)
        };
    
        this.data[type].push(entry);
        this.saveData();
        this.updateDisplay();
        return true;
    },
    











    // Update getEntriesForPeriod method to respect end dates for savings
    getEntriesForPeriod(type, dateType, dateValue, forBalance = false) {
        const entries = [];
        if (!dateValue || !this.data[type]) return entries;
        
        const selectedDate = new Date(dateValue);
        const endDate = new Date(selectedDate);
        endDate.setFullYear(endDate.getFullYear() + 2);
    
        this.data[type].forEach(entry => {
            if (!forBalance) {
                entries.push(entry);
                return;
            }
    
            if (entry.frequency === 'single') {
                if (this.isDateInPeriod(new Date(entry.date), selectedDate, dateType)) {
                    entries.push(entry);
                }
                return;
            }
    
            let currentDate = new Date(entry.date);
            const entryEndDate = entry.endDate ? new Date(entry.endDate) : endDate;
    
            while (currentDate <= endDate && currentDate <= entryEndDate) {
                if (this.isDateInPeriod(currentDate, selectedDate, dateType)) {
                    entries.push({
                        ...entry,
                        date: currentDate.toISOString().split('T')[0]
                    });
                }
                
                if (entry.frequency === 'monthly') {
                    currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
                } else if (entry.frequency === 'yearly') {
                    currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
                }
            }
        });
    
        return entries;
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

    // Add this new code
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
 
    initializeEditButton() {
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
            // Remove any existing event listeners
            editBtn.replaceWith(editBtn.cloneNode(true));
            // Get the new button reference
            const newEditBtn = document.getElementById('edit-btn');
            // Add the event listener
            newEditBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }
    },

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        console.log('Edit mode:', this.isEditMode); // Debug log
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
            const inputs = row.querySelectorAll('input');
            
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    const updates = {
                        date: row.querySelector('.edit-date')?.value,
                        description: row.querySelector('.edit-desc')?.value,
                        amount: parseFloat(row.querySelector('.edit-amount')?.value)
                    };
                    
                    // Filter out undefined values
                    Object.keys(updates).forEach(key => 
                        updates[key] === undefined && delete updates[key]
                    );
                    
                    if (Object.keys(updates).length > 0) {
                        this.updateEntry(entryId, updates);
                    }
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
        if (entry.frequency === 'monthly' && entry.endDate) {
            const startDate = new Date(entry.date);
            const endDate = new Date(entry.endDate);
            const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
            const totalAmount = entry.amount * months;  // This calculates the real total
        
            return `
<div class="entry-row ${this.isEditMode ? 'edit-mode' : ''}" data-id="${entry.id}">
    <div class="saving-details">
        <span class="description">
            ${this.isEditMode ? 
                `<input type="text" class="edit-desc" value="${entry.description}">` :
                entry.description}
        </span>
        <span class="total-amount">${Formatter.currency(totalAmount)}</span>
    </div>
    <div class="saving-schedule">
        <span class="target-date">${Formatter.date(entry.endDate)}</span>
        <span class="duration">${months} months</span>
        <span class="monthly-amount">
            ${this.isEditMode ? 
                `<input type="number" class="edit-amount" value="${entry.amount}">` :
                `${Formatter.currency(entry.amount)}/month`}
        </span>
    </div>
    <div class="progress-bar">
        ${Array(months).fill('<div class="progress-segment" style="width: 20px"></div>').join('')}
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
                    ${entry.frequency !== 'single' ? `(${entry.frequency})` : ''}
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

    updateEntry(entryId, updates) {
        ['income', 'expense', 'saving'].forEach(type => {
            const entryIndex = this.data[type].findIndex(e => e.id === entryId);
            if (entryIndex !== -1) {
                // Validate the updates
                const updatedEntry = {
                    ...this.data[type][entryIndex],
                    ...updates
                };
                
                if (this.validateEntry(updatedEntry)) {
                    Object.assign(this.data[type][entryIndex], updates);
                } else {
                    alert('Invalid update values');
                }
            }
        });
        this.saveData();
        this.updateDisplay();
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
            let amount = entry.amount;
            if (entry.frequency === 'monthly' && entry.endDate) {
                const startDate = new Date(entry.date);
                const endDate = new Date(entry.endDate);
                const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                amount = entry.amount * months;
            }
            acc[entry.category].total += amount;
            acc[entry.category].items.push(entry);
            return acc;
        }, {});
    },
 
    updateDisplay() {
        if (!this.data) return;
    
        const dateType = document.getElementById('table-date-type').value;
        const dateValue = document.getElementById('table-date-value').value;
    
        // For display - show original entries
        const displayTotals = {
            income: this.calculateCategoryTotals(
                this.getEntriesForPeriod('income', dateType, dateValue, false)
            ),
            expense: this.calculateCategoryTotals(
                this.getEntriesForPeriod('expense', dateType, dateValue, false)
            ),
            saving: this.calculateCategoryTotals(
                this.getEntriesForPeriod('saving', dateType, dateValue, false)
            )
        };
    
        // For balance - calculate all recurring entries
        const balanceTotals = {
            income: this.calculateCategoryTotals(
                this.getEntriesForPeriod('income', dateType, dateValue, true)
            ),
            expense: this.calculateCategoryTotals(
                this.getEntriesForPeriod('expense', dateType, dateValue, true)
            ),
            saving: this.calculateCategoryTotals(
                this.getEntriesForPeriod('saving', dateType, dateValue, true)
            )
        };
    
        ['income', 'expense', 'saving'].forEach(type => {
            const container = document.getElementById(`${type}s-data-table`);
            if (container) {
                container.innerHTML = this.createSectionHTML(
                    type.charAt(0).toUpperCase() + type.slice(1) + 's',
                    displayTotals[type],
                    type
                );
            }
        });
    
        this.updateBalance(balanceTotals);
        this.bindEditEvents();
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