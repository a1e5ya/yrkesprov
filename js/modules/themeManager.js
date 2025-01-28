const ThemeManager = {
    init() {
        this.darkModeBtn = document.getElementById('dark-mode-btn');
        this.setInitialTheme();
        this.bindEvents();
    },

    setInitialTheme() {
        const savedTheme = StorageManager.get(STORAGE_KEYS.THEME) || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT);
        
        this.applyTheme(savedTheme);
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.darkModeBtn.textContent = theme === THEMES.DARK ? 'Light' : 'Dark';
        StorageManager.set(STORAGE_KEYS.THEME, theme);
    },

    bindEvents() {
        this.darkModeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
            this.applyTheme(newTheme);
        });
    }
};