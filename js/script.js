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
    
    const toggleDarkMode = () => {
        // Toggle the data-theme attribute on the document
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        
        // Update button text
        darkModeBtn.textContent = isDark ? 'Dark Mode' : 'Light Mode';
        
        // Save preference
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    };
    
    // Set initial theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    darkModeBtn.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    
    // Add click listener
    darkModeBtn.addEventListener('click', toggleDarkMode);
    
    // Optionally: Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                darkModeBtn.textContent = e.matches ? 'Light Mode' : 'Dark Mode';
            }
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
            .attr('stroke', '#1E1E1E')
            .attr('stroke-width', 1);

        // Create draggable handle
        const handle = svg.append('circle')
            .attr('class', 'd3-slider-handle')
            .attr('cx', x(initialValue))
            .attr('cy', height / 2)
            .attr('r', 7)
            .attr('fill', '#1E1E1E')
            .attr('stroke', '#1E1E1E')
            .attr('stroke-width', 1)
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
            fill: #7E56EC;
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

    // Add axes
    const xAxis = svg.append("g")
        .attr("class", "forecast-axis-x")
        .attr("transform", `translate(0,${height})`);

    const yAxis = svg.append("g")
        .attr("class", "forecast-axis-y");

    // Add axis labels
    svg.append("text")
        .attr("transform", `translate(${0},${height + 40})`)
        .text("Years");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -200)
        .text("Amount (€)");

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