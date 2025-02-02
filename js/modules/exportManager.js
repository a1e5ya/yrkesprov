/*
███████ ██   ██ ██████   ██████  ██████  ████████ 
██       ██ ██  ██   ██ ██    ██ ██   ██    ██    
█████     ███   ██████  ██    ██ ██████     ██    
██       ██ ██  ██      ██    ██ ██   ██    ██    
███████ ██   ██ ██       ██████  ██   ██    ██    
*/

const ExportManager = {
    /**
     * Initializes export functionality
     * Sets up event listener for export button
     */
    init() {
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    },

    /**
     * Initiates data export process
     * Generates and downloads CSV file
     */
    exportData() {
        const csv = this.generateCSV();
        this.downloadCSV(csv, `budget_data_${this.getTimestamp()}.csv`);
    },

    /**
     * Generates timestamp for file naming
     * Format: YYYYMMDD_HHMM
     * @returns {string} Formatted timestamp
     */
    getTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    },

    /**
     * Generates CSV content from application data
     * Includes categories and transactions
     * @returns {string} CSV formatted string
     */
    generateCSV() {
        // CSV Headers
        const headers = ['DataType', 'Type', 'Name', 'Icon', 'Description', 'Amount', 'Date', 'Frequency', 'EndDate'];
        const rows = [headers];

        // Add categories
        ['income', 'expense', 'saving'].forEach(type => {
            CategoryManager.categories[type].forEach(category => {
                rows.push([
                    'category',
                    type,
                    category.name,
                    category.icon,
                    '',
                    '',
                    '',
                    '',
                    ''
                ]);
            });
        });

        // Add transactions
        ['income', 'expense', 'saving'].forEach(type => {
            if (BudgetManager.data[type]) {
                BudgetManager.data[type].forEach(entry => {
                    const categoryDetails = CategoryManager.getCategoryDetails(entry.category, type);
                    
                    if (type === 'saving') {
                        // For savings, preserve the original input format
                        const originalAmount = entry.frequency === 'monthly' ? 
                            entry.amount : // Use monthly amount directly
                            entry.totalAmount || entry.amount; // Use total amount for single entries

                        rows.push([
                            'transaction',
                            type,
                            categoryDetails ? categoryDetails.name : '',
                            '',
                            entry.description,
                            originalAmount.toString(),
                            entry.endDate, // Use target date for savings
                            entry.originalFrequency || entry.frequency, // Use original frequency
                            entry.endDate
                        ]);
                    } else {
                        // Regular income/expense entries
                        rows.push([
                            'transaction',
                            type,
                            categoryDetails ? categoryDetails.name : '',
                            '',
                            entry.description,
                            entry.amount.toString(),
                            entry.date,
                            entry.frequency || 'single',
                            entry.endDate || ''
                        ]);
                    }
                });
            }
        });

        return this.convertToCSV(rows);
    },

    /**
     * Converts array of data into CSV format
     * Handles escaping of special characters
     * @param {Array} rows - Array of data rows
     * @returns {string} CSV formatted string
     */
    convertToCSV(rows) {
        return rows.map(row => 
            row.map(str => {
                if (str === null || str === undefined) str = '';
                str = String(str);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        ).join('\n');
    },

    /**
     * Creates and triggers download of CSV file
     * @param {string} csv - CSV content
     * @param {string} filename - Name for downloaded file
     */
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Initialize export functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => ExportManager.init());