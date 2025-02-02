/*
██    ██  █████  ██      ██ ██████   █████  ████████  ██████  ██████  
██    ██ ██   ██ ██      ██ ██   ██ ██   ██    ██    ██    ██ ██   ██ 
██    ██ ███████ ██      ██ ██   ██ ███████    ██    ██    ██ ██████  
 ██  ██  ██   ██ ██      ██ ██   ██ ██   ██    ██    ██    ██ ██   ██ 
  ████   ██   ██ ███████ ██ ██████  ██   ██    ██     ██████  ██   ██ 
*/

const Validator = {
    /**
     * Checks if a value is a positive number
     * @param {number|string} value - The value to check
     * @returns {boolean} True if value is a positive number, false otherwise
     */
    isPositiveNumber(value) {
        return !isNaN(value) && parseFloat(value) > 0;
    },

    /**
     * Validates if a date object is valid and not NaN
     * @param {Date} date - The date object to validate
     * @returns {boolean} True if date is valid, false otherwise
     */
    isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Checks if a value is not empty, null, or undefined
     * @param {any} value - The value to check
     * @returns {boolean} True if value is not empty, false otherwise
     */
    isNotEmpty(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    /**
     * Validates a complete budget entry object
     * Checks for valid category, amount, and date
     * @param {Object} entry - The budget entry to validate
     * @param {string|number} entry.category - Category identifier
     * @param {number} entry.amount - Transaction amount
     * @param {string} entry.date - Transaction date
     * @returns {boolean} True if entry is valid, false otherwise
     */
    validateBudgetEntry(entry) {
        return this.isNotEmpty(entry.category) &&
               this.isPositiveNumber(entry.amount) &&
               this.isValidDate(new Date(entry.date));
    }
};