const Validator = {
    isPositiveNumber(value) {
        return !isNaN(value) && parseFloat(value) > 0;
    },

    isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    },

    isNotEmpty(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    validateBudgetEntry(entry) {
        return this.isNotEmpty(entry.category) &&
               this.isPositiveNumber(entry.amount) &&
               this.isValidDate(new Date(entry.date));
    }
};