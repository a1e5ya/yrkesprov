const ImportManager = {
    init() {
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }
    },

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

    async handleFile(file) {
        try {
            const content = await this.readFile(file);
            await this.importData(content);
            
            // Refresh UI
            BudgetManager.updateDisplay();
            CategoryManager.displayCategories();
            CategoryManager.populateCategorySelect('income');
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Error during import. Please check the file format.');
        }
    },

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

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

    async importData(csvContent) {
        const data = this.parseCSV(csvContent);
        
        // Clear all existing data
        BudgetManager.data = { income: [], expense: [], saving: [] };
        
        // Reset categories with empty arrays
        CategoryManager.categories = {
            income: [],
            expense: [],
            saving: []
        };

        // First pass: Process only categories
        const categories = data.filter(row => row.DataType === 'category');
        let nextCategoryId = 1;
        
        categories.forEach(category => {
            // Add category with a new sequential ID
            CategoryManager.categories[category.Type].push({
                id: nextCategoryId++,
                name: category.Name,
                icon: category.Icon,
                color: CategoryManager.typeColors[category.Type]
            });
        });
        
        // Save new category structure
        CategoryManager.saveCategories();
        
        // Second pass: Import transactions
        const transactions = data.filter(row => row.DataType === 'transaction');
        transactions.forEach(transaction => {
            // Find category ID based on name
            const categoryDetails = CategoryManager.categories[transaction.Type]
                .find(cat => cat.name === transaction.Name);
                
            if (categoryDetails) {
                const entry = {
                    category: categoryDetails.id,
                    description: transaction.Description,
                    amount: parseFloat(transaction.Amount),
                    date: transaction.Date,
                    frequency: transaction.Frequency,
                    endDate: transaction.EndDate || undefined
                };
                
                BudgetManager.addEntry(transaction.Type, entry);
            }
        });
        
        // Save all changes
        BudgetManager.saveData();
        
        // Reset theme to default
        ThemeManager.setInitialTheme();
    }
};

document.addEventListener('DOMContentLoaded', () => ImportManager.init());