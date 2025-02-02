/*
███████  ██████ ██████  ██ ██████  ████████ 
██      ██      ██   ██ ██ ██   ██    ██    
███████ ██      ██████  ██ ██████     ██    
     ██ ██      ██   ██ ██ ██         ██    
███████  ██████ ██   ██ ██ ██         ██    
*/

/**
 * Main application initialization
 * Initializes all core managers and components in the correct order
 * Order is important as some managers depend on others being initialized first
 */
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();      // Initialize navigation first for proper screen handling
    ThemeManager.init();    // Initialize theme manager early to prevent theme flicker
    BudgetManager.init();   // Initialize budget manager for data handling
    CategoryManager.init(); // Initialize category manager for transaction categorization
    ForecastVisualizer.init(); // Initialize forecast visualization
    TimelineVisualizer.init(); // Initialize timeline visualization
});