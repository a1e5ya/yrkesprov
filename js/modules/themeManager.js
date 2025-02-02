/*
████████ ██   ██ ███████ ███    ███ ███████ 
   ██    ██   ██ ██      ████  ████ ██      
   ██    ███████ █████   ██ ████ ██ █████   
   ██    ██   ██ ██      ██  ██  ██ ██      
   ██    ██   ██ ███████ ██      ██ ███████ 
*/

const ThemeManager = {
    /**
     * Initializes theme management functionality
     * Sets up dark mode button and initial theme
     */
    init() {
        this.darkModeBtn = document.getElementById('dark-mode-btn');
        this.setInitialTheme();
        this.bindEvents();
    },

    /**
     * Sets the initial theme based on:
     * 1. Previously saved theme preference
     * 2. System dark mode preference
     * 3. Default light theme
     */
    setInitialTheme() {
        const savedTheme = StorageManager.get(STORAGE_KEYS.THEME) || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT);
        
        this.applyTheme(savedTheme);
    },

    /**
     * Applies a theme to the document and saves preference
     * @param {string} theme - Theme identifier ('light' or 'dark')
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.darkModeBtn.textContent = theme === THEMES.DARK ? 'Light' : 'Dark';
        StorageManager.set(STORAGE_KEYS.THEME, theme);
    },

    /**
     * Binds click event to dark mode toggle button
     * Toggles between light and dark themes
     */
    bindEvents() {
        this.darkModeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
            this.applyTheme(newTheme);
        });
    }
};