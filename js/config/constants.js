/*
 ██████  ██████  ███    ██ ███████ ████████  █████  ███    ██ ████████ ███████ 
██      ██    ██ ████   ██ ██         ██    ██   ██ ████   ██    ██    ██      
██      ██    ██ ██ ██  ██ ███████    ██    ███████ ██ ██  ██    ██    ███████ 
██      ██    ██ ██  ██ ██      ██    ██    ██   ██ ██  ██ ██    ██         ██ 
 ██████  ██████  ██   ████ ███████    ██    ██   ██ ██   ████    ██    ███████ 
*/

/**
 * Available theme options for the application
 * Used by ThemeManager for theme switching
 * @constant {Object}
 */
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

/**
 * Local storage keys for persistent data
 * Used throughout the application for consistent data storage
 * @constant {Object}
 */
const STORAGE_KEYS = {
    THEME: 'theme',
    BUDGET: 'budgetData',
    CATEGORIES: 'budgetCategories'
};

/**
 * Entry types for budget management
 * Used to categorize financial entries
 * @constant {Object}
 */
const ENTRY_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
    SAVING: 'saving'
};