const Formatter = {
    currency(amount, currency = '€') {
        return `${amount.toLocaleString('fr-FR')} ${currency}`;
    },

    date(dateString) {
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    }
};