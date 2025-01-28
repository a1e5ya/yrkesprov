// In formatter.js

const Formatter = {
    currency(amount, currency = '€') {
        // Format with exactly 2 decimal places and use comma as decimal separator
        const formattedAmount = Number(amount).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${formattedAmount} ${currency}`;
    },

    date(dateString) {
        if (!dateString) return 'Invalid Date';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        // Format: DD MMM YYYY (e.g., "15 Jan 2025")
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        return `${day} ${month} ${year}`;
    }
};