/*
███████ ████████  ██████  ██████   █████   ██████  ███████ 
██         ██    ██    ██ ██   ██ ██   ██ ██       ██      
███████    ██    ██    ██ ██████  ███████ ██   ███ █████   
     ██    ██    ██    ██ ██   ██ ██   ██ ██    ██ ██      
███████    ██     ██████  ██   ██ ██   ██  ██████  ███████ 
*/

const StorageManager = {
    /**
     * Stores data in localStorage with automatic JSON stringification for objects
     * @param {string} key - The storage key
     * @param {any} value - The value to store (string or object)
     * @returns {boolean} True if storage successful, false if failed
     */
    set(key, value) {
        try {
            const storageValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, storageValue);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    /**
     * Retrieves data from localStorage with automatic JSON parsing for objects
     * @param {string} key - The storage key to retrieve
     * @returns {any} Retrieved value (parsed if JSON, raw if string, null if error)
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    },

    /**
     * Removes an item from localStorage
     * @param {string} key - The storage key to remove
     * @returns {boolean} True if removal successful, false if failed
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage removal error:', error);
            return false;
        }
    }
};