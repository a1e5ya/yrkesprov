# Budget Management Tool

A comprehensive web-based personal finance management application focused on budget tracking, visualization, and financial forecasting.

## Features

### Core Functionality
- **Transaction Management**
  - Add, edit, and delete transactions
  - Support for income, expenses, and savings
  - Recurring transaction support (monthly/yearly)
  - Category-based organization

- **Visualization Tools**
  - Timeline view with balance forecasting
  - Category distribution pie charts
  - Interactive savings calculator with compound interest

- **Category Management**
  - Custom categories with icons
  - Separate categories for income, expenses, and savings
  - Visual category management interface

### Additional Features
- **Theme Support**: Dark/light mode with user preference persistence
- **Report Generation**: Generate and download PDF reports
- **Data Management**: Local storage with data persistence
- **Period Selection**: Filter data by day/month/year
- **Balance Tracking**: Real-time balance calculations

## Technologies Used

- **Core Technologies**
  - HTML5 & CSS3 for structure and styling
  - Vanilla JavaScript for core functionality
  - Local Storage API for data persistence

- **Libraries**
  - D3.js for interactive visualizations
  - jsPDF for PDF report generation
  - Font Awesome for icons
  - Google Fonts (Lexend)

## Project Structure

```
├── css/
│   └── styles.css            # Main stylesheet with theme support
├── js/
│   ├── config/
│   │   └── constants.js      # Global constants and configurations
│   ├── modules/
│   │   ├── budgetManager.js  # Transaction management
│   │   ├── categoryManager.js # Category operations
│   │   ├── calculator.js     # Financial calculations
│   │   ├── formatter.js      # Data formatting utilities
│   │   ├── navigation.js     # Screen navigation
│   │   ├── reportManager.js  # Report generation
│   │   ├── storage.js        # Local storage interface
│   │   ├── themeManager.js   # Theme management
│   │   ├── timelineVisualizer.js # Timeline visualization
│   │   ├── validator.js      # Input validation
│   │   └── visualizer.js     # Charts and visualizations
│   └── script.js             # Main application initialization
└── index.html                # Main HTML structure

```

## Upcoming Features
- Import/Export functionality for data backup
- Enhanced reporting capabilities
- Data visualization improvements
- Testing implementation

## Getting Started

1. Clone the repository
2. Open index.html in a modern web browser
3. No build process or dependencies required

## Browser Support

Tested and supported in latest versions of:
- Chrome

## Development Status

This project is in active development. Core features are implemented and functional, with additional features and improvements planned.