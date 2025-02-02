/*
███    ██  █████  ██    ██ ██  ██████   █████  ████████ ██  ██████  ███    ██ 
████   ██ ██   ██ ██    ██ ██ ██       ██   ██    ██    ██ ██    ██ ████   ██ 
██ ██  ██ ███████ ██    ██ ██ ██   ███ ███████    ██    ██ ██    ██ ██ ██  ██ 
██  ██ ██ ██   ██  ██  ██  ██ ██    ██ ██   ██    ██    ██ ██    ██ ██  ██ ██ 
██   ████ ██   ██   ████   ██  ██████  ██   ██    ██    ██  ██████  ██   ████ 
*/

const Navigation = {
    /**
     * Initializes navigation functionality
     * Sets up event listeners and displays main menu
     */
    init() {
        this.bindEvents();
        this.showMainMenu();
        this.bindNullButton();
    },

    /**
     * Binds click events to all navigation buttons
     * Each button navigates to its target section
     */
    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.navigateToSection(button.dataset.target);
            });
        });
    },

    /**
     * Handles navigation between sections
     * Updates visibility and triggers necessary updates
     * @param {string} sectionId - ID of the target section
     */
    navigateToSection(sectionId) {
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'flex';
        
        // Update specific visualizations when navigating
        if (sectionId === 'budget-pie') {
            PieChartVisualizer.renderPieCharts();
        }
    },

    /**
     * Shows the main menu section
     * Helper method for initial load and resets
     */
    showMainMenu() {
        this.navigateToSection('main-menu');
    },

    /**
     * Binds event listener to the data reset button
     * Shows confirmation dialog before resetting
     */
    bindNullButton() {
        document.getElementById('null-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                this.resetAllData();
            }
        });
    },

    /**
     * Resets all application data to initial state
     * Clears storage, resets managers, and reloads page
     */
    resetAllData() {
        // Clear all storage
        Object.values(STORAGE_KEYS).forEach(key => {
            StorageManager.remove(key);
        });

        // Reset managers to initial state
        BudgetManager.data = {
            income: [],
            expense: [],
            saving: []
        };

        CategoryManager.categories = {
            income: [
                { id: 1, name: 'Salary', icon: 'fa-briefcase' },
                { id: 2, name: 'Dividends', icon: 'fa-chart-line' }
            ],
            expense: [
                { id: 3, name: 'Food', icon: 'fa-utensils' },
                { id: 4, name: 'Rent', icon: 'fa-home' },
                { id: 5, name: 'Entertainment', icon: 'fa-gamepad' }
            ],
            saving: [
                { id: 6, name: 'Emergency Fund', icon: 'fa-piggy-bank' },
                { id: 7, name: 'Investment', icon: 'fa-chart-pie' }
            ]
        };

        // Save default categories
        CategoryManager.saveCategories();

        // Refresh the UI
        location.reload();
    }
};

/**
 * Data toggle button initialization
 * Sets up show/hide functionality for add data container
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-btn');
    const icon = toggleBtn.querySelector('i');
    const container = document.getElementById('add-data-container');

    toggleBtn.addEventListener('click', () => {
        container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
        icon.classList.toggle('fa-plus');
        icon.classList.toggle('fa-xmark');
    });
});