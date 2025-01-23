const Navigation = {
    init() {
        this.bindEvents();
        this.showMainMenu();
        this.bindNullButton();
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.navigateToSection(button.dataset.target);
            });
        });
    },

    navigateToSection(sectionId) {
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'flex';
        
        // Update pie charts when navigating to pie section
        if (sectionId === 'budget-pie') {
            PieChartVisualizer.renderPieCharts();
        }
    },

    showMainMenu() {
        this.navigateToSection('main-menu');
    },





bindNullButton() {
    document.getElementById('null-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            this.resetAllData();
        }
    });
},

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


//Add data toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-btn');
    const icon = toggleBtn.querySelector('i');
    const container = document.getElementById('add-data-container');

    toggleBtn.addEventListener('click', () => {
        // Toggle the container display
        container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
        
        // Toggle the icon class
        icon.classList.toggle('fa-plus');
        icon.classList.toggle('fa-xmark');
    });
});

