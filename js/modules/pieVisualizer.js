/*
██████  ██ ███████     ██    ██ ██ ███████ ██    ██  █████  ██      ██ ███████ ███████ ██████  
██   ██ ██ ██          ██    ██ ██ ██      ██    ██ ██   ██ ██      ██    ███  ██      ██   ██ 
██████  ██ █████       ██    ██ ██ ███████ ██    ██ ███████ ██      ██   ███   █████   ██████  
██      ██ ██           ██  ██  ██      ██ ██    ██ ██   ██ ██      ██  ███    ██      ██   ██ 
██      ██ ███████       ████   ██ ███████  ██████  ██   ██ ███████ ██ ███████ ███████ ██   ██ 
*/

/**
 * PieChartVisualizer module handles the creation and management of pie chart visualizations
 * for income and outflow data in the budget management application.
 * @namespace
 */
const PieChartVisualizer = {
    /**
     * Initializes pie chart visualization functionality
     * Sets up event listeners for window resize and budget updates
     */
    init() {
        this.renderPieCharts();
        window.addEventListener('resize', this.renderPieCharts.bind(this));
        document.addEventListener('budgetUpdated', () => this.renderPieCharts());
    },

    /**
     * Calculates totals for incomes and outflows (expenses + savings)
     * Groups transactions by category and calculates total amounts
     * @returns {Object} Object containing income and outflow totals by category
     */
    calculateTotals() {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
    
        const processEntries = (entries, type) => {
            return entries.reduce((acc, entry) => {
                const category = CategoryManager.getCategoryDetails(entry.category, type);
                const name = category ? category.name : 'Other';
                
                let amount = Number(entry.amount);
                
                if (entry.frequency === 'monthly') {
                    // For monthly entries, multiply by 12
                    amount = amount * 12;
                } else if (entry.frequency === 'yearly') {
                    // For yearly entries, use the full amount
                    amount = amount;
                } else if (entry.frequency === 'single') {
                    // For single entries, use the amount as is
                    amount = amount;
                }
                
                acc[name] = (acc[name] || 0) + amount;
                return acc;
            }, {});
        };
    
        const incomes = processEntries(BudgetManager.data.income, 'income');
        const expenses = processEntries(BudgetManager.data.expense, 'expense');
        const savings = processEntries(BudgetManager.data.saving, 'saving');
    
        return {
            incomes,
            outflows: { ...expenses, ...savings }
        };
    },

    /**
     * Renders pie charts for both income and outflow data
     * Creates container elements and calls individual chart creation
     */
    renderPieCharts() {
        const { incomes, outflows } = this.calculateTotals();
        const container = document.getElementById('pie-visualization');
        container.innerHTML = '';

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
        const height = 200;
        const radius = Math.min(width/2, height) / 2;

        this.createPieChart('#incomes-pie', incomes, width, height, radius, 'Incomes');
        this.createPieChart('#outflows-pie', outflows, width, height, radius, 'Outflows');
    },

    /**
     * Creates an individual pie chart with labels and legends
     * @param {string} selector - DOM selector for chart container
     * @param {Object} data - Data object with category totals
     * @param {number} width - Chart width
     * @param {number} height - Chart height
     * @param {number} radius - Chart radius
     * @param {string} title - Chart title
     */
    createPieChart(selector, data, width, height, radius, title) {
        const chartHeight = height - 30;

        const svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${(width / 2) - 100},${(chartHeight / 2) + 30})`);

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
            .startAngle(0)
            .endAngle(Math.PI * 2);

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
            
            const labelX = width / 2 - 60;
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
                .attr('opacity', 1);

            svg.append('rect')
                .attr('x', label.labelX + 5)
                .attr('y', label.labelY - 10)
                .attr('width', 90)
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

document.addEventListener('DOMContentLoaded', () => {
    PieChartVisualizer.init();
});