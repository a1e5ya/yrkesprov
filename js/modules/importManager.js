/*
██ ███    ███ ██████   ██████  ██████  ████████ 
██ ████  ████ ██   ██ ██    ██ ██   ██    ██    
██ ██ ████ ██ ██████  ██    ██ ██████     ██    
██ ██  ██  ██ ██      ██    ██ ██   ██    ██    
██ ██      ██ ██       ██████  ██   ██    ██    
*/

const ImportManager = {
    /**
     * Initializes import functionality
     * Sets up event listener for import button
     */
    init() {
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }
    },

    /**
     * Shows file selection dialog for importing data
     * Creates and triggers hidden file input
     */
    showImportDialog() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    },

    /**
     * Processes the imported file
     * Reads content, parses CSV, and updates application data
     * @param {File} file - The imported CSV file
     */
    async handleFile(file) {
        try {
            const content = await this.readFile(file);
            const data = this.parseCSV(content);
            await this.processImportedData(data);
            
            BudgetManager.updateDisplay();
            CategoryManager.displayCategories();
            CategoryManager.populateCategorySelect('income');
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Error during import. Please check the file format.');
        }
    },

    /**
     * Reads file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * Parses CSV content into structured data
     * Handles headers and value cleaning
     * @param {string} csvContent - Raw CSV content
     * @returns {Array<Object>} Array of parsed data objects
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(header => 
            header.trim().replace(/^"(.+)"$/, '$1')
        );
        
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',').map(value => 
                value.trim().replace(/^"(.+)"$/, '$1')
            );
            
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index];
            });
            results.push(entry);
        }
        
        return results;
    },

    /**
     * Processes imported data and updates application state
     * Handles categories and transactions separately
     * @param {Array<Object>} data - Parsed CSV data
     */
    async processImportedData(data) {
        // Clear all existing data
        BudgetManager.data = { income: [], expense: [], saving: [] };
        CategoryManager.categories = {
            income: [],
            expense: [],
            saving: []
        };
    
        // Process categories first
        const categories = data.filter(row => row.DataType === 'category');
        let nextCategoryId = 1;
        
        categories.forEach(category => {
            CategoryManager.categories[category.Type].push({
                id: nextCategoryId++,
                name: category.Name,
                icon: category.Icon,
                color: CategoryManager.typeColors[category.Type]
            });
        });
        
        CategoryManager.saveCategories();
        
        // Process transactions
        const transactions = data.filter(row => row.DataType === 'transaction');
        for (const transaction of transactions) {
            const categoryDetails = CategoryManager.categories[transaction.Type]
                .find(cat => cat.name === transaction.Name);
                
            if (categoryDetails) {
                if (transaction.Type === 'saving') {
                    // Handle savings specially
                    const entry = {
                        category: categoryDetails.id,
                        description: transaction.Description,
                        amount: parseFloat(transaction.Amount),
                        date: transaction.Date,
                        frequency: transaction.Frequency,
                        endDate: transaction.EndDate
                    };
    
                    // For 'single' frequency (target amount), keep the total amount and target date
                    if (transaction.Frequency === 'single') {
                        entry.totalAmount = parseFloat(transaction.Amount);
                        entry.date = transaction.Date;
                    } else if (transaction.Frequency === 'monthly') {
                        // For monthly frequency, amount is already monthly
                        const today = new Date();
                        const targetDate = new Date(transaction.Date);
                        const monthsToTarget = Math.max(1, Math.ceil(
                            (targetDate - today) / (1000 * 60 * 60 * 24 * 30.44)
                        ));
                        entry.amount = parseFloat(transaction.Amount);
                        entry.totalAmount = entry.amount * monthsToTarget;
                    }
    
                    BudgetManager.addEntry('saving', entry);
                } else {
                    // Regular income/expense entries
                    const entry = {
                        category: categoryDetails.id,
                        description: transaction.Description,
                        amount: parseFloat(transaction.Amount),
                        date: transaction.Date,
                        frequency: transaction.Frequency || 'single',
                        endDate: transaction.EndDate || undefined
                    };
                    
                    BudgetManager.addEntry(transaction.Type, entry);
                }
            }
        }
        
        BudgetManager.saveData();
        ThemeManager.setInitialTheme();
    }
};

// Initialize import functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => ImportManager.init());