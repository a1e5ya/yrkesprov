const StorageManager = {
    set(key, value) {
        try {
            // If value is string, store directly, otherwise JSON stringify
            const storageValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, storageValue);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    get(key) {
        try {
            const item = localStorage.getItem(key);
            // Try parsing as JSON, if fails return raw value
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