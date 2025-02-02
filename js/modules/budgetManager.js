/*
██████  ██    ██ ██████   ██████  ███████ ████████ 
██   ██ ██    ██ ██   ██ ██       ██         ██    
██████  ██    ██ ██   ██ ██   ███ █████      ██    
██   ██ ██    ██ ██   ██ ██    ██ ██         ██    
██████   ██████  ██████   ██████  ███████    ██    

███    ███  █████  ███    ██  █████   ██████  ███████ ██████  
████  ████ ██   ██ ████   ██ ██   ██ ██       ██      ██   ██ 
██ ████ ██ ███████ ██ ██  ██ ███████ ██   ███ █████   ██████  
██  ██  ██ ██   ██ ██  ██ ██ ██   ██ ██    ██ ██      ██   ██ 
██      ██ ██   ██ ██   ████ ██   ██  ██████  ███████ ██   ██ 
*/

/**
 * BudgetManager module handles all budget-related operations including
 * transaction management, calculations, and data persistence.
 * @namespace
 */
const BudgetManager = {
    /** @type {Object} Stores all budget data organized by transaction type */
    data: null,

    /** @type {boolean} Tracks whether edit mode is active */
    isEditMode: false,

    /** @type {Object} Color mappings for different transaction types */
    typeColors: {
        'income': 'var(--green-bright)',
        'expense': 'var(--pink-soft)',
        'saving': 'var(--orange-medium)'
    },

    /**
     * Debounces a function call
     * @private
     * @param {Function} func - Function to debounce
     * @param {number} wait - Delay in milliseconds
     * @returns {Function} Debounced function
     */
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

    /**
     * Initializes the budget management system
     * Sets up initial data structures and event listeners
     */
    init() {
        this.data = { income: [], expense: [], saving: [] };
        this.loadData();
        this.initializeTypeButtons();
        this.initializeEditButton();
        this.initializeAddButton();
        this.handleTypeSelection('income');
        
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

    /**
     * Updates the balance display in the table view
     * @param {number} months - Number of months to calculate balance for
     */
    updateTableBalance(months) {
        const container = document.querySelector('#budget-table .period-balance');
        if (!container) return;
    
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

    /**
     * Clears the balance calculation cache
     */
    clearBalanceCache() {
        this._balanceCache = {};
    },

    /**
     * Saves current budget data to storage
     */
    saveData() {
        StorageManager.set(STORAGE_KEYS.BUDGET, this.data);
        this.clearBalanceCache();
        document.dispatchEvent(new Event('budgetUpdated'));
    },

    /**
     * Loads budget data from storage
     */
    loadData() {
        const savedData = StorageManager.get(STORAGE_KEYS.BUDGET);
        this.data = {
            income: savedData?.income || [],
            expense: savedData?.expense || [],
            saving: savedData?.saving || []
        };
        this.updateDisplay();
    },

    /*
██████   █████  ██       █████  ███    ██  ██████ ███████ 
██   ██ ██   ██ ██      ██   ██ ████   ██ ██      ██      
██████  ███████ ██      ███████ ██ ██  ██ ██      █████   
██   ██ ██   ██ ██      ██   ██ ██  ██ ██ ██      ██      
██████  ██   ██ ███████ ██   ██ ██   ████  ██████ ███████ 

 ██████  █████  ██       ██████ ██    ██ ██       █████  ████████  ██████  ██████  
██      ██   ██ ██      ██      ██    ██ ██      ██   ██    ██    ██    ██ ██   ██ 
██      ███████ ██      ██      ██    ██ ██      ███████    ██    ██    ██ ██████  
██      ██   ██ ██      ██      ██    ██ ██      ██   ██    ██    ██    ██ ██   ██ 
 ██████ ██   ██ ███████  ██████  ██████  ███████ ██   ██    ██     ██████  ██   ██ 
*/

    /**
     * Calculates the total balance over multiple years
     * Takes into account recurring transactions and their frequencies
     * @param {number} years - Number of years to calculate for
     * @returns {number} Total balance for the period
     */
    calculateMultiYearBalance(years) {
        const startDate = new Date();
        const numberOfMonths = years * 12;
        
        /**
         * Calculates total amount for a set of entries over the period
         * @param {Array} entries - Array of transaction entries
         * @returns {number} Total amount
         */
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
    
        return incomeTotal - (expenseTotal + savingsTotal);
    },

    /**
     * Retrieves entries for a specific period
     * Handles recurring transactions and date filtering
     * @param {string} type - Transaction type (income/expense/saving)
     * @param {string} dateType - Period type (day/month/year/all)
     * @param {string} dateValue - Reference date for period
     * @param {boolean} [forBalance=false] - Whether entries are for balance calculation
     * @returns {Array} Filtered entries for the period
     */
    getEntriesForPeriod(type, dateType, dateValue, forBalance = false) {
        const entries = [];
        if (!dateValue || !this.data[type]) return entries;
        
        const selectedDate = new Date(dateValue);
        const endDate = dateType === 'all' ? 
            new Date(2100, 11, 31) : 
            this.getPeriodEndDate(selectedDate, dateType);
        
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
                const entryEndDate = entry.endDate ? 
                    new Date(entry.endDate) : endDate;
                
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

    /**
     * Checks if a date falls within a specified period
     * @param {Date} date - Date to check
     * @param {Date} selectedDate - Reference date for period
     * @param {string} periodType - Type of period (day/month/year)
     * @returns {boolean} Whether date is in period
     */
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

    /**
     * Gets the end date for a specified period
     * @param {Date} date - Start date of period
     * @param {string} periodType - Type of period (day/month/year)
     * @returns {Date} End date of period
     */
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

    /*
███████ ███    ██ ████████ ██████  ██    ██ 
██      ████   ██    ██    ██   ██  ██  ██  
█████   ██ ██  ██    ██    ██████    ████   
██      ██  ██ ██    ██    ██   ██    ██    
███████ ██   ████    ██    ██   ██    ██    

███    ███  █████  ███    ██  █████   ██████  ███████ ███    ███ ███████ ███    ██ ████████ 
████  ████ ██   ██ ████   ██ ██   ██ ██       ██      ████  ████ ██      ████   ██    ██    
██ ████ ██ ███████ ██ ██  ██ ███████ ██   ███ █████   ██ ████ ██ █████   ██ ██  ██    ██    
██  ██  ██ ██   ██ ██  ██ ██ ██   ██ ██    ██ ██      ██  ██  ██ ██      ██  ██ ██    ██    
██      ██ ██   ██ ██   ████ ██   ██  ██████  ███████ ██      ██ ███████ ██   ████    ██    
*/

    /**
     * Adds a new transaction entry to the budget
     * Handles special logic for savings entries
     * @param {string} type - Transaction type (income/expense/saving)
     * @param {Object} entryData - Transaction details
     * @param {string} entryData.category - Category ID
     * @param {string} entryData.description - Transaction description
     * @param {number} entryData.amount - Transaction amount
     * @param {string} entryData.date - Transaction date
     * @param {string} entryData.frequency - Transaction frequency
     * @returns {boolean} Success status of the operation
     */
    addEntry(type, entryData) {
        if (type === 'saving') {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const targetDate = new Date(entryData.date);
            const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            
            if (targetStart <= todayStart) {
                return false;
            }
    
            // Store original frequency before any modifications
            const originalFrequency = entryData.frequency;
    
            if (entryData.frequency === 'monthly') {
                // For monthly savings, use the amount as is
                const monthlyAmount = parseFloat(entryData.amount);
                const timeDiff = targetStart - todayStart;
                const monthsToTarget = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30.44)));
                const totalAmount = monthlyAmount * monthsToTarget;
                
                entryData.amount = monthlyAmount;
                entryData.totalAmount = totalAmount;
            } else {
                // For single (target amount) savings
                const totalAmount = parseFloat(entryData.amount);
                const timeDiff = targetStart - todayStart;
                const monthsToTarget = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30.44)));
                const monthlyAmount = totalAmount / monthsToTarget;
                
                entryData.amount = monthlyAmount;
                entryData.totalAmount = totalAmount;
            }
    
            entryData.date = todayStart.toISOString().split('T')[0];
            entryData.endDate = targetStart.toISOString().split('T')[0];
            entryData.frequency = 'monthly';
            entryData.originalFrequency = originalFrequency;
        }
    
        if (!this.validateEntry(entryData)) return false;
    
        const entry = {
            id: Date.now(),
            category: entryData.category,
            description: entryData.description,
            amount: parseFloat(entryData.amount),
            totalAmount: entryData.totalAmount,
            date: entryData.date,
            frequency: entryData.frequency || 'single',
            originalFrequency: entryData.originalFrequency,
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

    /**
     * Deletes a transaction entry
     * @param {number} entryId - ID of entry to delete
     */
    deleteEntry(entryId) {
        ['income', 'expense', 'saving'].forEach(type => {
            this.data[type] = this.data[type].filter(entry => entry.id !== entryId);
        });
        this.saveData();
        this.updateDisplay();
    },

    /**
     * Updates an existing transaction entry
     * @param {number} entryId - ID of entry to update
     * @param {Object} updates - Fields to update and their new values
     */
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

    /**
     * Validates a transaction entry
     * @param {Object} entry - Entry to validate
     * @returns {boolean} Whether entry is valid
     */
    validateEntry(entry) {
        return Validator.validateBudgetEntry(entry);
    },

    /**
     * Gets formatted date string for today
     * @returns {string} Today's date in YYYY-MM-DD format
     */
    getTodayDate() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    },

    /*
██    ██ ██    
██    ██ ██    
██    ██ ██    
██    ██ ██    
 ██████  ██    
                
██   ██  █████  ███    ██ ██████  ██      ███████ ██████  ███████ 
██   ██ ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ ██      
███████ ███████ ██ ██  ██ ██   ██ ██      █████   ██████  ███████ 
██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██      ██ 
██   ██ ██   ██ ██   ████ ██████  ███████ ███████ ██   ██ ███████ 
*/

    /**
     * Handles selection of transaction type
     * Updates UI elements based on selected type
     * @param {string} type - Selected transaction type (income/expense/saving)
     */
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
            if (type === 'saving') {
                frequencySelect.style.display = 'block';
                frequencySelect.innerHTML = `
                    <option value="single">Target</option>
                    <option value="monthly">Monthly</option>
                `;
            } else {
                frequencySelect.style.display = 'block';
                frequencySelect.innerHTML = `
                    <option value="single">Single</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                `;
            }
        }
    
        const addBtn = document.getElementById('add-data-btn');
        const categoriesBtn = document.getElementById('categories-btn');
        if (addBtn) addBtn.style.borderColor = color;
        if (categoriesBtn) categoriesBtn.style.borderColor = color;
        
        CategoryManager.populateCategorySelect(type);
    },

    /**
     * Initializes type selection buttons
     * Sets up event listeners for type switching
     */
    initializeTypeButtons() {
        ['income', 'expense', 'saving'].forEach(type => {
            const btn = document.getElementById(`${type}-data-btn`);
            if (btn) btn.addEventListener('click', () => this.handleTypeSelection(type));
        });
    },

    /**
     * Initializes edit mode button
     * Sets up event listener for toggling edit mode
     */
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

    /**
     * Initializes add transaction button
     * Sets up event listener for adding new transactions
     */
    initializeAddButton() {
        const addDataBtn = document.getElementById('add-data-btn');
        const addForm = document.getElementById('add-data-container');
        if (!addDataBtn || !addForm) return;

        // Prevent form submission
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        addDataBtn.addEventListener('click', (e) => {
            e.preventDefault();
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

    /**
     * Toggles edit mode for transactions
     * Updates UI and enables/disables editing features
     */
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

    /**
     * Binds event handlers for edit mode functionality
     * Sets up delete and edit capabilities for transactions
     */
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
            
            let entry;
            ['income', 'expense', 'saving'].forEach(type => {
                const found = this.data[type].find(e => e.id === entryId);
                if (found) entry = found;
            });
    
            if (!entry) return;
    
            const inputs = row.querySelectorAll('input');
            const frequencySelect = row.querySelector('.edit-frequency');
            
            // Handle input changes
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
                        // For savings, update both monthly amount and total
                        if (entry.frequency === 'monthly') {
                            const startDate = new Date(entry.date);
                            const endDate = new Date(entry.endDate);
                            const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                            updates.amount = parseFloat(input.value);
                            updates.totalAmount = updates.amount * months;
                            
                            // Update the total amount display if it exists
                            const totalAmountInput = row.querySelector('.edit-total-amount');
                            if (totalAmountInput) {
                                totalAmountInput.value = updates.totalAmount;
                            }
                        }
                    }
                    if (input.classList.contains('edit-target-date')) {
                        updates.endDate = input.value;
                        
                        const startDate = new Date(entry.date);
                        const endDate = new Date(input.value);
                        const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                        
                        // Update monthly amount based on total
                        const totalAmountInput = row.querySelector('.edit-total-amount');
                        if (totalAmountInput) {
                            const totalAmount = parseFloat(totalAmountInput.value);
                            updates.amount = totalAmount / months;
                            
                            // Update the monthly amount display
                            const monthlyInput = row.querySelector('.edit-amount');
                            if (monthlyInput) {
                                monthlyInput.value = updates.amount.toFixed(2);
                            }
                        }
                    }
                    if (input.classList.contains('edit-total-amount')) {
                        const startDate = new Date(entry.date);
                        const endDate = new Date(row.querySelector('.edit-target-date').value);
                        const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                        
                        updates.totalAmount = parseFloat(input.value);
                        updates.amount = updates.totalAmount / months;
                        
                        // Update the monthly amount display
                        const monthlyInput = row.querySelector('.edit-amount');
                        if (monthlyInput) {
                            monthlyInput.value = updates.amount.toFixed(2);
                        }
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        this.updateEntry(entryId, updates);
                    }
                });
            });
    
            // Handle frequency changes
            if (frequencySelect) {
                frequencySelect.addEventListener('change', () => {
                    const updates = {
                        frequency: frequencySelect.value
                    };
                    this.updateEntry(entryId, updates);
                });
            }
    
            // Handle delete button
            const deleteButton = row.querySelector('.delete-transaction');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    if (confirm('Delete this transaction?')) {
                        this.deleteEntry(entryId);
                    }
                });
            }
        });
    },

    /**
     * Clears the add transaction form
     * Resets all input fields to their default values
     */
    clearAddForm() {
        document.getElementById('add-desc').value = '';
        document.getElementById('add-date').value = this.getTodayDate();
        document.getElementById('add-amount').value = '';
        document.getElementById('add-frequency').value = 'single';
    },

    /*
██████  ██ ███████ ██████  ██       █████  ██    ██ 
██   ██ ██ ██      ██   ██ ██      ██   ██  ██  ██  
██   ██ ██ ███████ ██████  ██      ███████   ████   
██   ██ ██      ██ ██      ██      ██   ██    ██    
██████  ██ ███████ ██      ███████ ██   ██    ██    

 ██████  ███████ ███    ██ ███████ ██████   █████  ████████  ██████  ██████  
██       ██      ████   ██ ██      ██   ██ ██   ██    ██    ██    ██ ██   ██ 
██   ███ █████   ██ ██  ██ █████   ██████  ███████    ██    ██    ██ ██████  
██    ██ ██      ██  ██ ██ ██      ██   ██ ██   ██    ██    ██    ██ ██   ██ 
 ██████  ███████ ██   ████ ███████ ██   ██ ██   ██    ██     ██████  ██   ██ 
*/

    /**
     * Updates the entire budget display
     * Recalculates totals and refreshes all UI elements
     */
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

    /**
     * Calculates totals for each category
     * @param {Array} entries - Array of transaction entries
     * @returns {Object} Totals organized by category
     */
    calculateCategoryTotals(entries = []) {
        const totals = {};
        entries.forEach(entry => {
            if (!totals[entry.category]) {
                totals[entry.category] = {
                    total: 0,
                    items: []
                };
            }
            
            let entryTotal = parseFloat(entry.amount);
            
            // For savings with monthly frequency and end date
            if (entry.frequency === 'monthly' && entry.endDate) {
                const startDate = new Date(entry.date);
                const endDate = new Date(entry.endDate);
                const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
                entryTotal = entry.amount * months;
            }
            
            totals[entry.category].items.push(entry);
            totals[entry.category].total += entryTotal;
        });
        return totals;
    },

    /**
     * Creates HTML for a budget section
     * @param {string} title - Section title
     * @param {Object} totals - Category totals
     * @param {string} type - Transaction type
     * @returns {string} Generated HTML
     */
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

    /**
     * Creates HTML for a category group
     * @param {string} categoryId - Category identifier
     * @param {Object} data - Category data
     * @param {string} type - Transaction type
     * @returns {string} Generated HTML
     */
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

    /**
     * Creates HTML for a transaction entry
     * @param {Object} entry - Transaction entry
     * @returns {string} Generated HTML
     */
    createEntryHTML(entry) {
        if (entry.frequency === 'monthly' && entry.endDate) {
            const startDate = new Date(entry.date);
            const endDate = new Date(entry.endDate);
            const months = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44)));
            const totalAmount = entry.totalAmount || (entry.amount * months);
            
            const progressSegments = Math.min(Math.max(months, 1), 36); // Cap at 36 segments
        
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
                        <div class="monthly-amount-group">
                            <span class="monthly-amount">
                                ${this.isEditMode ? 
                                    `<input type="number" class="edit-amount" value="${entry.amount}" style="border: 1px solid var(--text-primary);">` :
                                    `${Formatter.currency(entry.amount)}/month`}
                            </span>
                            ${this.isEditMode ? '<button class="delete-transaction" aria-label="Delete transaction">×</button>' : ''}
                        </div>
                    </div>
                    <div class="progress-bar">
                        ${Array(progressSegments).fill('<div class="progress-segment"></div>').join('')}
                    </div>
                </div>
            `;
        }
    

        return `
    <div class="entry-row ${this.isEditMode ? 'edit-mode' : ''}" data-id="${entry.id}">
        <div class="entry-date-group">
            <div class="entry-date">
                ${this.isEditMode ? 
                    `<input type="date" class="edit-date" value="${entry.date}">` :
                    Formatter.date(entry.date)}
            </div>
            ${this.isEditMode ? `
                <select class="edit-frequency">
                    <option value="single" ${entry.frequency === 'single' ? 'selected' : ''}>Single</option>
                    <option value="monthly" ${entry.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                    <option value="yearly" ${entry.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
                </select>
            ` : entry.frequency && entry.frequency !== 'single' ? 
                `<span class="entry-frequency">(${entry.frequency})</span>` : 
                ''}
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
        ${this.isEditMode ? '<button class="delete-transaction" aria-label="Delete transaction">×</button>' : ''}
    </div>
`;
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => BudgetManager.init());