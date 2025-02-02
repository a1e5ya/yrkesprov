# Budget Management Tool

A comprehensive web-based personal finance management application designed for budget tracking, visualization, and financial forecasting, built with vanilla JavaScript and modern web technologies.

## Core Features

### Transaction Management
- Income, expense, and savings tracking with support for one-time and recurring transactions
- Monthly and yearly recurring transaction support
- Category-based organization with custom icons
- Built-in transaction editing and deletion capabilities
- Automatic balance calculations and projections

### Data Visualization
- **Timeline View**: Visual representation of financial flows over time with customizable periods
- **Pie Charts**: Category distribution analysis for both income and outflow
- **Savings Calculator**: Interactive compound interest calculator with visual comparison between simple and compound interest

### Budget Organization
- Customizable categories for income, expenses, and savings
- Icon-based category system with visual management interface
- Hierarchical data organization with category-based summaries
- Real-time balance calculations and forecasting

### Data Management
- Import/Export functionality for data backup and transfer
- Local storage integration for persistent data
- Period-based filtering (day/month/year)
- Data reset capability

### Reports & Analysis
- PDF report generation for different views (Timeline, Pie Charts, Forecasts)
- Multiple timeframe analysis options
- Balance projections across various periods
- Detailed transaction breakdowns

### User Experience
- Dark/light theme support with system preference detection
- Responsive design for various screen sizes
- Icon-based interface with Font Awesome integration
- Clean, modern interface using Lexend font family

## Technical Implementation

### Technologies
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage API
- **Visualization**: D3.js
- **Documentation**: PDF Generation with jsPDF
- **UI Resources**: Font Awesome, Google Fonts (Lexend)

### Architecture
The application follows a modular architecture with clear separation of concerns:

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
│   │   ├── forecastVisualizer.js # Charts and visualizations
│   │   └── pieVisualizer.js  # Charts and visualizations
│   └── script.js             # Main application initialization
└── index.html                # Main HTML structure
```

## Setup and Usage

1. Clone the repository
2. Open index.html in a modern web browser
3. No build process or dependencies required
4. Start by adding categories and transactions

## Browser Compatibility

The application is optimized for and tested in:
- Google Chrome (latest versions)
- Modern browsers with ES6+ support

## License

MIT License - feel free to use and modify as needed.