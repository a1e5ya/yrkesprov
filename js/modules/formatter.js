/*
███████  ██████  ██████  ███    ███  █████  ████████ ████████ ███████ ██████  
██      ██    ██ ██   ██ ████  ████ ██   ██    ██       ██    ██      ██   ██ 
█████   ██    ██ ██████  ██ ████ ██ ███████    ██       ██    █████   ██████  
██      ██    ██ ██   ██ ██  ██  ██ ██   ██    ██       ██    ██      ██   ██ 
██       ██████  ██   ██ ██      ██ ██   ██    ██       ██    ███████ ██   ██ 
*/

const Formatter = {
    /**
     * Formats a number as a currency string with the specified currency symbol
     * Uses French locale for number formatting (comma as decimal separator)
     * @param {number} amount - The amount to format
     * @param {string} [currency='€'] - The currency symbol to use
     * @returns {string} Formatted currency string (e.g., "1.234,56 €")
     */
    currency(amount, currency = '€') {
        const formattedAmount = Number(amount).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${formattedAmount} ${currency}`;
    },

    /**
     * Formats a date string into a standardized format
     * @param {string} dateString - The date string to format
     * @returns {string} Formatted date string (e.g., "15 Jan 2025")
     */
    date(dateString) {
        if (!dateString) return 'Invalid Date';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        return `${day} ${month} ${year}`;
    }
};