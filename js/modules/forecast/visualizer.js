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
        const width = 400 - margin.left - margin.right;
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
        const margin = {top: 40, right: 40, bottom: 60, left: 80};
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        d3.select("#forecast-chart").select("svg").remove();

        const svg = d3.select("#forecast-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.year)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(data, d => Math.min(d.simpleInterest, d.compoundInterest)) * 0.9,
                d3.max(data, d => Math.max(d.simpleInterest, d.compoundInterest)) * 1.1
            ])
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .style("color", "var(--text-primary)")
            .call(d3.axisBottom(x).ticks(5));

        svg.append("g")
            .style("color", "var(--text-primary)")
            .call(d3.axisLeft(y).tickFormat(d => `${d3.format(",.0f")(d)} €`));

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .style("fill", "var(--text-primary)")
            .text("Years");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)
            .style("fill", "var(--text-primary)")
            .text("Amount (€)");

        const lineSimple = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.simpleInterest));

        const lineCompound = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.compoundInterest));

        svg.append("path")
            .datum(data)
            .attr("class", "forecast-line-simple")
            .attr("fill", "none")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", lineSimple);

        svg.append("path")
            .datum(data)
            .attr("class", "forecast-line-compound")
            .attr("fill", "none")
            .attr("stroke", "#4ade80")
            .attr("stroke-width", 2)
            .attr("d", lineCompound);

        const lastDataPoint = data[data.length - 1];
        document.getElementById("forecast-simple").textContent = 
            `${d3.format(",.0f")(lastDataPoint.simpleInterest)} €`;
            document.getElementById("forecast-compound").textContent = 
            `${d3.format(",.0f")(lastDataPoint.compoundInterest)} €`;
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
        document.getElementById('pie-date-type').addEventListener('change', () => this.renderPieCharts());
        document.getElementById('pie-date-value').addEventListener('change', () => this.renderPieCharts());
    },
 
    calculateTotals() {
        const dateType = document.getElementById('pie-date-type').value;
        const dateValue = document.getElementById('pie-date-value').value;
    
        const incomes = BudgetManager.getEntriesForPeriod('income', dateType, dateValue)
            .reduce((acc, entry) => {
                const category = CategoryManager.getCategoryDetails(entry.category, 'income');
                const name = category ? category.name : 'Other';
                acc[name] = (acc[name] || 0) + Number(entry.amount);
                return acc;
            }, {});
    
        const expenses = BudgetManager.getEntriesForPeriod('expense', dateType, dateValue)
            .reduce((acc, entry) => {
                const category = CategoryManager.getCategoryDetails(entry.category, 'expense');
                const name = category ? category.name : 'Other';
                acc[name] = (acc[name] || 0) + Number(entry.amount);
                return acc;
            }, {});
    
        const savings = BudgetManager.getEntriesForPeriod('saving', dateType, dateValue)
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
 
    renderPieCharts() {
        const { incomes, outflows } = this.calculateTotals();
        const container = document.getElementById('pie-visualization');
        container.innerHTML = '';
 
        const incomesDiv = document.createElement('div');
        incomesDiv.id = 'incomes-pie';
        const outflowsDiv = document.createElement('div');
        outflowsDiv.id = 'outflows-pie';
        
        container.appendChild(incomesDiv);
        container.appendChild(outflowsDiv);
 
        const width = Math.min(400, window.innerWidth * 0.8);
        const height = width - 200;
        const radius = Math.min(width, height) / 2;
 
        this.createPieChart('#incomes-pie', incomes, width, height, radius, 'Incomes');
        this.createPieChart('#outflows-pie', outflows, width, height, radius, 'Outflows');
    },
 
    createPieChart(selector, data, width, height, radius, title) {
        const svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height + 120)  // Increased height for spacing
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2 + 60})`);  // Adjusted transform
    
        svg.append('text')
            .attr('x', 0)
            .attr('y', -height / 2 - 20)  // More space above title
            .attr('text-anchor', 'middle')
            .attr('class', 'chart-title')
            .style('font-size', '18px')
            .style('fill', 'var(--text-primary)')
            .text(title);
    
        const total = d3.sum(Object.values(data));
        svg.append('text')
            .attr('x', 0)
            .attr('y', height / 2 + 40)  // Space after title
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('margin-bottom', '40px')
            .style('font-size', '14px')
            .text(`Total: ${total} €`);
    
        const colorScale = d3.scaleOrdinal()
            .domain(Object.keys(data))
            .range(title === 'Incomes'
                ? Array(Object.keys(data).length).fill('var(--green-bright)')
                : Object.entries(data).map(([key]) => {
                    const isExpense = CategoryManager.categories.expense.some(cat => cat.name === key);
                    const isSaving = CategoryManager.categories.saving.some(cat => cat.name === key);
                    return isExpense ? 'var(--pink-soft)' : isSaving ? 'var(--orange-medium)' : 'gray';
                })
            );
    
        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);
    
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius - 30);
    
        const labelArc = d3.arc()
            .innerRadius(radius - 10) // Position labels closer to the edge
            .outerRadius(radius - 10);
    
        const arcs = svg.selectAll('arc')
            .data(pie(Object.entries(data)))
            .enter()
            .append('g')
            .attr('class', 'arc');
    
        arcs.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => colorScale(i))
            .attr('stroke', 'var(--bg-primary)')
            .style('stroke-width', '2px');
    
        // Add labels
// Add labels with background rectangles
arcs.append('g')
    .each(function (d) {
        const group = d3.select(this);

        // Calculate centroid for positioning
        const [x, y] = labelArc.centroid(d);

        // Create text to measure dimensions
        const tempText = group.append('text')
            .attr('transform', `translate(${x},${y})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .text(() => {
                const percentage = ((d.data[1] / total) * 100).toFixed(1);
                return `${d.data[0]} ${percentage}%`;
            });

        // Measure text dimensions
        const textBBox = tempText.node().getBBox();

        // Add rectangle as background
        group.insert('rect', 'text')
            .attr('x', x - textBBox.width / 2 - 6) // Add padding
            .attr('y', y - textBBox.height / 2 - 8) // Add padding
            .attr('width', textBBox.width + 12) // Add padding
            .attr('height', textBBox.height + 8) // Add padding

            .style('fill', 'var(--bg-primary)')
            ;

        // Reapply text attributes to ensure it's on top
        tempText
            .attr('transform', `translate(${x},${y})`)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '11px');
    });

    }
    
 };




// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    BudgetManager.init();
    CategoryManager.init();
    PieChartVisualizer.init();
});












