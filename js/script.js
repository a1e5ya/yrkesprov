// Navigation functionality
const navButtons = document.querySelectorAll('.nav-btn');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetSectionId = button.dataset.target;
        navigateToSection(targetSectionId);
    });
});

function navigateToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show the target section
    const targetSection = document.getElementById(sectionId);
    targetSection.style.display = 'flex';
}






// Dark mode
document.addEventListener('DOMContentLoaded', () => {
    const darkModeBtn = document.getElementById('dark-mode-btn');
    
    // Set initial theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    darkModeBtn.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';
    
    // Simplified toggle function
    darkModeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        darkModeBtn.textContent = newTheme === 'dark' ? 'Light' : 'Dark';
        localStorage.setItem('theme', newTheme);
    });
});











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













// Forecast
// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // First part: Create D3.js Sliders
    function createD3Slider(config) {
        const {
            inputSelector,
            sliderContainerId,
            min,
            max,
            step,
            initialValue
        } = config;

        // Select the input and slider container
        const input = document.querySelector(inputSelector);
        const container = d3.select(`#${sliderContainerId}`);
        container.html(''); // Clear existing content

        // Create SVG for the slider
        const margin = {top: 0, right: 10, bottom: 0, left: 10};
        const width = 400 - margin.left - margin.right;
        const height = 20 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scale
        const x = d3.scaleLinear()
            .domain([min, max])
            .range([0, width])
            .clamp(true);

        // Create slider track
        svg.append('line')
        .attr('class', 'd3-slider-track')
        .attr('x1', x.range()[0])
        .attr('x2', x.range()[1])
        .attr('y1', height / 2)
        .attr('y2', height / 2)
        .attr('stroke', 'var(--green-muted)') 
        .attr('stroke-width', 2)
        .attr('opacity', 0.3);

        // Create draggable handle
        const handle = svg.append('circle')
        .attr('class', 'd3-slider-handle')
        .attr('cx', x(initialValue))
        .attr('cy', height / 2)
        .attr('r', 6)
        .attr('fill', 'var(--green-muted)') // Using your teal color
        .attr('stroke', 'var(--green-muted)')
        .attr('stroke-width', 2)
            .call(d3.drag()
                .on('drag', function(dragEvent) {
                    const newValue = x.invert(dragEvent.x);
                    const roundedValue = Math.round(newValue / step) * step;
                    const clampedValue = Math.min(Math.max(roundedValue, min), max);
                    
                    // Update handle position
                    d3.select(this)
                        .attr('cx', x(clampedValue));
                    
                    // Update input value
                    input.value = clampedValue;
                    
                    // Trigger input event for visualization update
                    const inputEvent = new Event('input', { bubbles: true });
                    input.dispatchEvent(inputEvent);
                })
            );

        // Initial synchronization
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                const clampedValue = Math.min(Math.max(value, min), max);
                handle.attr('cx', x(clampedValue));
            }
        });

        // Add some basic styling
        container.style('margin-top', '5px');
    }

    // Create the forecast sliders
    createD3Slider({
        inputSelector: '#forecast-initial',
        sliderContainerId: 'forecast-initial-container',
        min: 1,
        max: 50000,
        step: 100,
        initialValue: 100
    });

    createD3Slider({
        inputSelector: '#forecast-rate',
        sliderContainerId: 'forecast-rate-container',
        min: 0.1,
        max: 25,
        step: 0.1,
        initialValue: 5
    });

    createD3Slider({
        inputSelector: '#forecast-years',
        sliderContainerId: 'forecast-years-container',
        min: 1,
        max: 50,
        step: 1,
        initialValue: 10
    });

    // Add slider styling
    const style = document.createElement('style');
    style.textContent = `
        .d3-slider-handle {
            cursor: pointer;
        }
        .d3-slider-handle:hover {
            fill: var(--green-bright);
            stroke: var(--green-bright);
        }
        .d3-slider-track {
            stroke-linecap: round;
        }
    `;
    document.head.appendChild(style);

    // Second part: Initialize the visualization
    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#forecast-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
        .range([0, width]);

    const y = d3.scaleLinear()
        .range([height, 0]);

    // Add axes with styling
    const xAxis = svg.append("g")
        .attr("class", "forecast-axis-x")
        .attr("transform", `translate(0,${height})`)
        .style("color", "var(--text-primary)");

    const yAxis = svg.append("g")
        .attr("class", "forecast-axis-y")
        .style("color", "var(--text-primary)");

    // Add X axis label
    svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("fill", "var(--text-primary)")
        .text("Years");

    // Add Y axis label
    svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .style("fill", "var(--text-primary)")
        .text("Amount (€)");

    // Add hover tooltip
    const tooltip = d3.select("#forecast-chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "var(--input-bg)")
        .style("border", "1px solid var(--button-border)")
        .style("padding", "10px")
        .style("border-radius", "3px");

    // Add hover line
    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .style("stroke", "var(--text-primary)")
        .style("stroke-width", "1px")
        .style("opacity", 0);


    // Create line generators
    const lineCompound = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.compoundInterest));

    const lineSimple = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.simpleInterest));

    // Function to calculate savings data
    function calculateData() {
        const initial = parseFloat(document.getElementById("forecast-initial").value) || 0;
        const rate = parseFloat(document.getElementById("forecast-rate").value) || 0;
        const years = parseFloat(document.getElementById("forecast-years").value) || 0;
        
        const data = [];
        
        for (let year = 0; year <= years; year++) {
            // Simple Interest: P * (1 + r*t)
            const simpleInterest = initial * (1 + (rate/100) * year);
            
            // Compound Interest: P * (1 + r)^t
            const compoundInterest = initial * Math.pow(1 + rate/100, year);
            
            data.push({
                year: year,
                simpleInterest: simpleInterest,
                compoundInterest: compoundInterest
            });
        }
        
        return data;
    }

    // Function to update the visualization
    function updateVisualization() {
        const data = calculateData();
        const initial = parseFloat(document.getElementById("forecast-initial").value) || 0;
        
        // Update scales with initial investment as minimum y value
        x.domain([0, d3.max(data, d => d.year)]);
        y.domain([
            initial * 0.9, // Start slightly below initial investment for context
            d3.max(data, d => Math.max(d.compoundInterest, d.simpleInterest)) * 1.1
        ]);

        // Update axes
        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y).tickFormat(d => `${d3.format(",.0f")(d)} €`));

        // Update or create lines
        svg.selectAll(".forecast-line-compound").remove();
        svg.selectAll(".forecast-line-simple").remove();

        svg.append("path")
            .data([data])
            .attr("class", "forecast-line-compound")
            .attr("d", lineCompound)
            .attr("fill", "none")
            .attr("stroke", "#4ade80")
            .attr("stroke-width", 2);

        svg.append("path")
            .data([data])
            .attr("class", "forecast-line-simple")
            .attr("d", lineSimple)
            .attr("fill", "none")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);

        // Update result text
        const lastDataPoint = data[data.length - 1];
        document.getElementById("forecast-simple").textContent = 
            `${d3.format(",.0f")(lastDataPoint.simpleInterest)} €`;
        document.getElementById("forecast-compound").textContent = 
            `${d3.format(",.0f")(lastDataPoint.compoundInterest)} €`;
    }

    // Add input event listeners to all inputs for visualization updates
    document.getElementById("forecast-initial").addEventListener("input", updateVisualization);
    document.getElementById("forecast-rate").addEventListener("input", updateVisualization);
    document.getElementById("forecast-years").addEventListener("input", updateVisualization);

    // Initial update
    updateVisualization();
});











// Initial categories data structure
const categories = {
    income: [
        { id: 1, name: 'Salary', icon: 'fa-briefcase', color: 'var(--green-bright)' },
        { id: 2, name: 'Dividends', icon: 'fa-piggy-bank', color: 'var(--green-bright)' }
    ],
    expense: [
        { id: 3, name: 'Rent', icon: 'fa-key', color: 'var(--pink-soft)' },
        { id: 4, name: 'Food', icon: 'fa-utensils', color: 'var(--pink-soft)' },
        { id: 5, name: 'Entertainment', icon: 'fa-star', color: 'var(--pink-soft)' }
    ],
    saving: [
        { id: 6, name: 'Gifts', icon: 'fa-gift', color: 'var(--orange-medium)' },
        { id: 7, name: 'Investment', icon: 'fa-piggy-bank', color: 'var(--orange-medium)' }
    ]
};

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('budgetCategories', JSON.stringify(categories));
}

// Load categories from localStorage
function loadCategories() {
    const saved = localStorage.getItem('budgetCategories');
    if (saved) {
        Object.assign(categories, JSON.parse(saved));
    }
}

// Initialize category management
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    
    const incomeBtn = document.getElementById('income-category-btn');
    const expenseBtn = document.getElementById('expense-category-btn');
    const savingBtn = document.getElementById('saving-category-btn');
    const iconButtons = document.querySelectorAll('.category-icons-row i');
    const addCategoryBtn = document.getElementById('add-data-category-btn');
    const categoryInput = document.getElementById('add-category-desc');
    
    let selectedType = null;
    let selectedIcon = null;

    // Color mapping object for consistent color references
    const typeColors = {
        'income': 'var(--green-bright)',
        'expense': 'var(--pink-soft)',
        'saving': 'var(--orange-medium)'
    };

    // Function to reset icons to default state
    function resetIcons() {
        iconButtons.forEach(icon => {
            icon.style.color = 'var(--text-primary)';
            icon.classList.remove('selected');
        });
    }

    // Type selection handlers
    [incomeBtn, expenseBtn, savingBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset previous selection
            [incomeBtn, expenseBtn, savingBtn].forEach(b => {
                b.style.borderColor = 'transparent';
            });
            resetIcons();

            // Set new selection
            selectedType = btn.id.split('-')[0];
            btn.style.borderColor = typeColors[selectedType];
            addCategoryBtn.style.borderColor = typeColors[selectedType];
            displayCategories();
        });
    });

    // Icon selection handlers
    iconButtons.forEach(icon => {
        icon.addEventListener('click', () => {
            if (!selectedType) {
                alert('Please select a category type first (Income/Expense/Saving)');
                return;
            }
            // Reset all icons first
            resetIcons();
            // Set new selection
            icon.classList.add('selected');
            icon.style.color = typeColors[selectedType];
            selectedIcon = icon.className.split(' ')[1];
        });
    });

// Add category handler
addCategoryBtn.addEventListener('click', () => {
    if (!selectedType || !selectedIcon || !categoryInput.value) {
        alert('Please select a type, icon, and enter a category name');
        return;
    }

    const newCategory = {
        id: Date.now(),
        name: categoryInput.value,
        icon: selectedIcon,
        color: typeColors[selectedType]
    };

    categories[selectedType].push(newCategory);
    saveCategories();
    displayCategories();
    
    // Refresh the category select if we have income/expense/saving button selected
    const selectedButton = document.querySelector('#budget-table button.selected');
    if (selectedButton) {
        const type = selectedButton.id.split('-')[0]; // 'income', 'expense', or 'saving'
        populateCategorySelect(type);
    }
    
    categoryInput.value = '';
    selectedIcon = null;
    resetIcons();
});

    // Function to display categories
    function displayCategories() {
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        // Create sections for each category type
        const sections = {
            'Incomes': categories.income,
            'Expenses': categories.expense,
            'Savings': categories.saving
        };

        // Create and append each section
        Object.entries(sections).forEach(([title, items]) => {
            // Add section title
            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'category-section-title';
            sectionTitle.textContent = title;
            categoryList.appendChild(sectionTitle);

            // Add items
            items.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item';
                categoryElement.innerHTML = `
                    <i class="fa-solid ${category.icon}" style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                    <button class="delete-category" data-type="${title}" data-id="${category.id}">×</button>
                `;
                categoryList.appendChild(categoryElement);
            });
        });
    }

    // Delete category handler
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-category')) {
            const typeMap = {
                'Incomes': 'income',
                'Expenses': 'expense',
                'Savings': 'saving'
            };
            const type = typeMap[e.target.dataset.type];
            const id = parseInt(e.target.dataset.id);
            
            categories[type] = categories[type].filter(cat => cat.id !== id);
            saveCategories();
            displayCategories();
        }
    });

    // Initial display
    displayCategories();
});
































// Add data type selection handling
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('add-data-container');
    const incomeBtn = document.getElementById('income-data-btn');
    const expenseBtn = document.getElementById('expense-data-btn');
    const savingBtn = document.getElementById('saving-data-btn');
    const categorySelect = document.getElementById('category-select');
    const addDataBtn = document.getElementById('add-data-btn');

    // Function to reset all selections
    function resetSelection() {
        // Remove all selected classes from buttons
        [incomeBtn, expenseBtn, savingBtn].forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Remove type-specific classes from container
        container.classList.remove('income-selected', 'expense-selected', 'saving-selected');
        
        // Remove type-specific classes from category select
        categorySelect.classList.remove('income-selected', 'expense-selected', 'saving-selected');
        
        // Remove type-specific classes from add button
        addDataBtn.classList.remove('income-selected', 'expense-selected', 'saving-selected');
    }

    // Function to handle type selection
    function selectType(type) {
        resetSelection();
        
        // Add selected class to button
        document.getElementById(`${type}-data-btn`).classList.add('selected');
        
        // Add type-specific class to container
        container.classList.add(`${type}-selected`);
        
        // Add type-specific class to category select
        categorySelect.classList.add(`${type}-selected`);
        
        // Add type-specific class to add button
        addDataBtn.classList.add(`${type}-selected`);
    }

    // Add click handlers to type buttons
    incomeBtn.addEventListener('click', () => selectType('income'));
    expenseBtn.addEventListener('click', () => selectType('expense'));
    savingBtn.addEventListener('click', () => selectType('saving'));
});


























// Function to populate category select based on type
function populateCategorySelect(type) {
    const categorySelect = document.getElementById('category-select');
    
    // Clear existing options
    categorySelect.innerHTML = '';
    
    // Get categories based on type
    const categoryList = categories[type] || [];
    
    // If we have categories, set the first one as default
    if (categoryList.length > 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = categoryList[0].id;
        defaultOption.textContent = categoryList[0].name;
        defaultOption.selected = true;
        categorySelect.appendChild(defaultOption);
    }
    
    // Add remaining categories as options
    // Skip the first category since it's already added as default
    categoryList.slice(1).forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        
        // Create icon element
        const icon = document.createElement('i');
        icon.className = `fa-solid ${category.icon}`;
        icon.style.color = category.color;
        
        categorySelect.appendChild(option);
    });
}

// Initialize category selection handling
document.addEventListener('DOMContentLoaded', () => {
    const incomeBtn = document.getElementById('income-data-btn');
    const expenseBtn = document.getElementById('expense-data-btn');
    const savingBtn = document.getElementById('saving-data-btn');
    const categorySelect = document.getElementById('category-select');
    const addDataBtn = document.getElementById('add-data-btn');

    // Function to reset all selections
    function resetSelection() {
        [incomeBtn, expenseBtn, savingBtn].forEach(btn => {
            btn.classList.remove('selected');
            btn.style.borderColor = 'transparent';
        });
        
        addDataBtn.style.borderColor = 'transparent';
        categorySelect.value = '';
    }

    // Function to handle type selection
    function selectType(type) {
        resetSelection();
        
        // Set button styles
        const button = document.getElementById(`${type}-data-btn`);
        const color = type === 'income' ? 'var(--green-bright)' : 
                     type === 'expense' ? 'var(--pink-soft)' : 
                     'var(--orange-medium)';
        
        button.classList.add('selected');
        button.style.borderColor = color;
        addDataBtn.style.borderColor = color;
        
        // Populate category select
        populateCategorySelect(type);
    }

    // Add click handlers to type buttons
    incomeBtn.addEventListener('click', () => selectType('income'));
    expenseBtn.addEventListener('click', () => selectType('expense'));
    savingBtn.addEventListener('click', () => selectType('saving'));

    // Initialize with empty category select
    resetSelection();
});



























// Data structure to store budget entries
let budgetData = {
    incomes: [],
    expenses: [],
    savings: []
};

// Function to add a new budget entry
function addBudgetEntry(type, data) {
    // Validate required fields
    if (!data.category || !data.amount || !data.date) {
        console.error('Missing required fields');
        return false;
    }

    // Create entry object
    const entry = {
        id: Date.now(),
        category: data.category,
        description: data.description || '',
        amount: parseFloat(data.amount),
        date: data.date,
        frequency: data.frequency || 'single'
    };

    // Add to appropriate array
    budgetData[type].push(entry);
    
    // Save to localStorage
    saveBudgetData();
    
    // Update display
    updateDisplay();
    
    return true;
}

// Function to save budget data to localStorage
function saveBudgetData() {
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
}

// Function to load budget data from localStorage
function loadBudgetData() {
    const saved = localStorage.getItem('budgetData');
    if (saved) {
        budgetData = JSON.parse(saved);
    }
}

// Function to calculate totals by category
function calculateCategoryTotals(entries) {
    return entries.reduce((acc, entry) => {
        if (!acc[entry.category]) {
            acc[entry.category] = {
                total: 0,
                items: []
            };
        }
        acc[entry.category].total += entry.amount;
        acc[entry.category].items.push(entry);
        return acc;
    }, {});
}

// Function to format currency
function formatCurrency(amount) {
    return `${amount.toLocaleString('fr-FR')} €`;
}

// Function to create HTML for a single entry
function createEntryHTML(entry) {
    const date = new Date(entry.date);
    const formattedDate = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    return `
        <div class="entry-row">
            <div class="entry-date">${formattedDate}</div>
            <div class="entry-desc">${entry.description}</div>
            <div class="entry-amount">${formatCurrency(entry.amount)}</div>
        </div>
    `;
}

// Helper function to get category details
function getCategoryDetails(categoryId, type) {
    const categoryList = categories[type.slice(0, -1)] || []; // Remove 's' from type
    return categoryList.find(cat => cat.id.toString() === categoryId.toString());
}

// Function to create HTML for a category group
function createCategoryGroupHTML(categoryId, data, type) {
    const categoryDetails = getCategoryDetails(categoryId, type);
    const icon = categoryDetails ? 
        `<i class="fa-solid ${categoryDetails.icon}"></i>` : '';
    const categoryName = categoryDetails ? categoryDetails.name : 'Uncategorized';
    
    const entriesHTML = data.items
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(createEntryHTML)
        .join('');
    
    return `
        <div class="category-group">
            <div class="category-header">
                ${icon}
                <span class="category-name">${categoryName}</span>
                <span class="category-total">${formatCurrency(data.total)}</span>
            </div>
            <div class="category-entries">
                ${entriesHTML}
            </div>
        </div>
    `;
}

// Function to create section HTML
function createSectionHTML(title, totals, type) {
    if (Object.keys(totals).length === 0) return ''; // Return empty string if no data
    
    const entriesHTML = Object.entries(totals)
        .map(([categoryId, data]) => createCategoryGroupHTML(categoryId, data, type))
        .join('');
    
    return `
        <div class="section-header">
            <h2>${title}</h2>
        </div>
        ${entriesHTML}
    `;
}

// Function to update the display
function updateDisplay() {
    // Calculate totals by category for each type
    const incomeTotals = calculateCategoryTotals(budgetData.incomes);
    const expenseTotals = calculateCategoryTotals(budgetData.expenses);
    const savingsTotals = calculateCategoryTotals(budgetData.savings);
    
    // Update incomes section
    const incomesContainer = document.getElementById('incomes-data-table');
    incomesContainer.innerHTML = createSectionHTML('Incomes', incomeTotals, 'incomes');
    
    // Update expenses section
    const expensesContainer = document.getElementById('expenses-data-table');
    expensesContainer.innerHTML = createSectionHTML('Expenses', expenseTotals, 'expenses');
    
    // Update savings section
    const savingsContainer = document.getElementById('savings-data-table');
    savingsContainer.innerHTML = createSectionHTML('Savings', savingsTotals, 'savings');
    
    // Calculate total balance
    const totalIncome = Object.values(incomeTotals)
        .reduce((sum, data) => sum + data.total, 0);
    const totalExpenses = Object.values(expenseTotals)
        .reduce((sum, data) => sum + data.total, 0);
    const totalSavings = Object.values(savingsTotals)
        .reduce((sum, data) => sum + data.total, 0);
    
    const balance = totalIncome - (totalExpenses + totalSavings);
    
    // Update balance display
    const balanceContainer = document.getElementById('balance');
    balanceContainer.innerHTML = `
        <div class="balance-row">
            <span>Balance = </span>
            <span class="balance-amount ${balance >= 0 ? 'positive' : 'negative'}">
                ${balance >= 0 ? '+' : ''} ${formatCurrency(balance)}
            </span>
        </div>
    `;
}

// Add event listener for the add data button
document.addEventListener('DOMContentLoaded', () => {
    loadBudgetData();
    
    const addDataBtn = document.getElementById('add-data-btn');
    addDataBtn.addEventListener('click', () => {
        // Get selected type
        const selectedTypeBtn = document.querySelector('#add-data-container button.selected');
        if (!selectedTypeBtn) {
            alert('Please select a type (Income/Expense/Saving)');
            return;
        }
        
        const type = selectedTypeBtn.id.split('-')[0] + 's'; // incomes/expenses/savings
        
        // Get form values
        const categorySelect = document.getElementById('category-select');
        const descInput = document.getElementById('add-desc');
        const dateInput = document.getElementById('add-date');
        const amountInput = document.getElementById('add-amount');
        const frequencySelect = document.getElementById('add-frequency');
        
        // Create entry data
        const entryData = {
            category: categorySelect.value,
            description: descInput.value,
            amount: amountInput.value,
            date: dateInput.value,
            frequency: frequencySelect.value
        };
        
        // Add entry
        if (addBudgetEntry(type, entryData)) {
            // Clear form
            descInput.value = '';
            dateInput.value = '';
            amountInput.value = '';
            frequencySelect.value = 'single';
            
            // Just clear the form inputs
        }
    });
});