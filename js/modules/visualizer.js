const ForecastVisualizer = {
    init() {
        this.initializeSliders();
        this.bindEvents();
        this.updateVisualization();
    },

    initializeSliders() {
        this.createSlider({
            inputSelector: '#forecast-initial',
            containerId: 'forecast-initial-container',
            min: 1,
            max: 50000,
            step: 100,
            initialValue: 100
        });

        this.createSlider({
            inputSelector: '#forecast-rate',
            containerId: 'forecast-rate-container',
            min: 0.1,
            max: 25,
            step: 0.1,
            initialValue: 5
        });

        this.createSlider({
            inputSelector: '#forecast-years',
            containerId: 'forecast-years-container',
            min: 1,
            max: 50,
            step: 1,
            initialValue: 10
        });
    },

    createSlider(config) {
        const {
            inputSelector,
            containerId,
            min,
            max,
            step,
            initialValue
        } = config;

        const input = document.querySelector(inputSelector);
        const container = d3.select(`#${containerId}`);
        container.html('');

        const margin = {top: 0, right: 10, bottom: 0, left: 10};
        const width = 300 - margin.left - margin.right;
        const height = 20 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([min, max])
            .range([0, width])
            .clamp(true);

        svg.append('line')
            .attr('class', 'd3-slider-track')
            .attr('x1', x.range()[0])
            .attr('x2', x.range()[1])
            .attr('y1', height / 2)
            .attr('y2', height / 2)
            .attr('stroke', 'var(--green-muted)')
            .attr('stroke-width', 2)
            .attr('opacity', 0.3);

        const handle = svg.append('circle')
            .attr('class', 'd3-slider-handle')
            .attr('cx', x(initialValue))
            .attr('cy', height / 2)
            .attr('r', 6)
            .attr('fill', 'var(--green-muted)')
            .attr('stroke', 'var(--green-muted)')
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('drag', function(event) {
                    const newValue = x.invert(event.x);
                    const roundedValue = Math.round(newValue / step) * step;
                    const clampedValue = Math.min(Math.max(roundedValue, min), max);
                    
                    d3.select(this).attr('cx', x(clampedValue));
                    input.value = clampedValue;
                    
                    const inputEvent = new Event('input', { bubbles: true });
                    input.dispatchEvent(inputEvent);
                })
            );

        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                const clampedValue = Math.min(Math.max(value, min), max);
                input.value = Number(clampedValue.toFixed(1));
                handle.attr('cx', x(clampedValue));
            }
        });
    },

    updateVisualization() {
        const initial = parseFloat(document.getElementById('forecast-initial').value) || 0;
        const rate = parseFloat(document.getElementById('forecast-rate').value) || 0;
        const years = parseFloat(document.getElementById('forecast-years').value) || 0;

        const data = ForecastCalculator.generateForecastData(initial, rate, years);
        this.renderChart(data);
    },

renderChart(data) {
    // Clear any existing chart
    d3.select("#forecast-chart").select("svg").remove();

    // Set margins
    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    
    // Calculate dimensions from the actual container
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#forecast-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.year)])
        .range([20, width]);

    const y = d3.scaleLinear()
        .domain([
            d3.min(data, d => Math.min(d.simpleInterest, d.compoundInterest)) * 0.9,
            d3.max(data, d => Math.max(d.simpleInterest, d.compoundInterest)) * 1.1
        ])
        .range([height, 0]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .style("color", "var(--text-primary)")
        .call(d3.axisBottom(x).ticks(5));

    // Add Y axis
    svg.append("g")
    .attr("transform", "translate(20, 0)")
        .style("color", "var(--text-primary)")
        .call(d3.axisLeft(y).tickFormat(d => `${d3.format(",.0f")(d)} €`));

    // Add X axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("fill", "var(--text-primary)")
        .text("Years");

    // Add Y axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .style("fill", "var(--text-primary)")
        .text("Amount (€)");

    // Create line generators
    const lineSimple = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.simpleInterest));

    const lineCompound = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.compoundInterest));

    // Add simple interest line
    svg.append("path")
        .datum(data)
        .attr("class", "forecast-line-simple")
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("d", lineSimple);

    // Add compound interest line
    svg.append("path")
        .datum(data)
        .attr("class", "forecast-line-compound")
        .attr("fill", "none")
        .attr("stroke", "#4ade80")
        .attr("stroke-width", 2)
        .attr("d", lineCompound);

    // Update result text
    const lastDataPoint = data[data.length - 1];
    document.getElementById("forecast-simple").textContent = 
        `${d3.format(",.2f")(lastDataPoint.simpleInterest)} €`;
    document.getElementById("forecast-compound").textContent = 
        `${d3.format(",.2f")(lastDataPoint.compoundInterest)} €`;

    // Add resize handler
    if (!this._resizeHandler) {
        this._resizeHandler = () => {
            requestAnimationFrame(() => this.updateVisualization());
        };
        window.addEventListener('resize', this._resizeHandler);
    }
},
 
    bindEvents() {
        ['forecast-initial', 'forecast-rate', 'forecast-years'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateVisualization());
        });
    }
 };






 const PieChartVisualizer = {
    init() {
        this.renderPieCharts();
        window.addEventListener('resize', this.renderPieCharts.bind(this));
        document.addEventListener('budgetUpdated', () => this.renderPieCharts());
    },
 
    calculateTotals() {
        // Use current date + 1 year as default period
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        const incomes = BudgetManager.getEntriesForPeriod('income', 'all', endDate.toISOString(), true)
            .reduce((acc, entry) => {
                const category = CategoryManager.getCategoryDetails(entry.category, 'income');
                const name = category ? category.name : 'Other';
                acc[name] = (acc[name] || 0) + Number(entry.amount);
                return acc;
            }, {});

        const expenses = BudgetManager.getEntriesForPeriod('expense', 'all', endDate.toISOString(), true)
            .reduce((acc, entry) => {
                const category = CategoryManager.getCategoryDetails(entry.category, 'expense');
                const name = category ? category.name : 'Other';
                acc[name] = (acc[name] || 0) + Number(entry.amount);
                return acc;
            }, {});

        const savings = BudgetManager.getEntriesForPeriod('saving', 'all', endDate.toISOString(), true)
            .reduce((acc, entry) => {
                const category = CategoryManager.getCategoryDetails(entry.category, 'saving');
                const name = category ? category.name : 'Other';
                acc[name] = (acc[name] || 0) + Number(entry.amount);
                return acc;
            }, {});

        return {
            incomes,
            outflows: { ...expenses, ...savings }
        };
    },
 
// In visualizer.js, in the PieChartVisualizer.renderPieCharts function
renderPieCharts() {
    const { incomes, outflows } = this.calculateTotals();
    const container = document.getElementById('pie-visualization');
    container.innerHTML = '';

    // Create a flex container for the charts
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'pie-charts-container';
    container.appendChild(chartsContainer);

    const incomesDiv = document.createElement('div');
    incomesDiv.id = 'incomes-pie';
    const outflowsDiv = document.createElement('div');
    outflowsDiv.id = 'outflows-pie';
    
    chartsContainer.appendChild(incomesDiv);
    chartsContainer.appendChild(outflowsDiv);

    const width = container.clientWidth;
    const height = 200; // Smaller height for each chart
    const radius = Math.min(width/2, height) / 2;

    this.createPieChart('#incomes-pie', incomes, width, height, radius, 'Incomes');
    this.createPieChart('#outflows-pie', outflows, width, height, radius, 'Outflows');
},
 
createPieChart(selector, data, width, height, radius, title) {
    const chartHeight = height - 30; // Reserve 30px for the title

    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${(width / 2) - 100},${(chartHeight / 2) + 30})`); // Move left by 100px

    svg.append('text')
        .attr('x', 0)
        .attr('y', -chartHeight / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .style('font-size', '18px')
        .style('fill', 'var(--text-primary)')
        .text(title);

    const total = d3.sum(Object.values(data));
    const keysSorted = Object.entries(data).sort((a, b) => a[1] - b[1]);
    const colorScale = d3.scaleOrdinal()
        .domain(keysSorted.map(d => d[0]))
        .range(title === 'Incomes'
            ? Array(keysSorted.length).fill('var(--green-bright)')
            : keysSorted.map(([key]) => {
                const isExpense = CategoryManager.categories.expense.some(cat => cat.name === key);
                const isSaving = CategoryManager.categories.saving.some(cat => cat.name === key);
                return isExpense ? 'var(--pink-soft)' : isSaving ? 'var(--orange-medium)' : 'gray';
            })
        );

    const pie = d3.pie()
        .value(d => d[1])
        .sort(null)
        .startAngle(Math.PI / 4) // Start at 45 degrees
        .endAngle(Math.PI * 2 + Math.PI / 4);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 30);

    const labelRadius = radius + 20;
    const arcs = svg.selectAll('.arc')
        .data(pie(keysSorted))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data[0]))
        .attr('stroke', 'var(--bg-primary)')
        .style('stroke-width', '2px');

    const labelData = pie(keysSorted).map((d, index) => {
        const midAngle = (d.startAngle + d.endAngle) / 2;
        const percentage = ((d.data[1] / total) * 100).toFixed(1);
        const labelText = `${d.data[0]} ${percentage}%`;
        
        const labelX = width / 2 - 60; // Move labels slightly closer
        const labelY = (index - (keysSorted.length / 2)) * 20;
        const sectorEndPoint = arc.centroid(d);

        return { midAngle, percentage, text: labelText, labelX, labelY, sectorEndPoint, color: colorScale(d.data[0]) };
    });

    labelData.forEach(label => {
        svg.append('line')
            .attr('x1', label.sectorEndPoint[0])
            .attr('y1', label.sectorEndPoint[1])
            .attr('x2', label.labelX)
            .attr('y2', label.labelY)
            .attr('stroke', 'var(--text-primary)')
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.3);

        svg.append('rect')
            .attr('x', label.labelX + 5)
            .attr('y', label.labelY - 10)
            .attr('width', 90) // Reduce width slightly
            .attr('height', 20)
            .attr('fill', 'var(--bg-primary)')
            .attr('rx', 3)
            .attr('opacity', 0.8);

        svg.append('text')
            .attr('x', label.labelX + 10)
            .attr('y', label.labelY)
            .attr('text-anchor', 'start')
            .attr('alignment-baseline', 'middle')
            .style('font-size', '11px')
            .style('fill', 'var(--text-primary)')
            .text(label.text);
    });
}

    
 };




// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    BudgetManager.init();
    CategoryManager.init();
    PieChartVisualizer.init();
});












