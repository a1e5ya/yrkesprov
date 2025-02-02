/*
███████  ██████  ██████  ███████  ██████  █████  ███████ ████████ 
██      ██    ██ ██   ██ ██      ██      ██   ██ ██         ██    
█████   ██    ██ ██████  █████   ██      ███████ ███████    ██    
██      ██    ██ ██   ██ ██      ██      ██   ██      ██    ██    
██       ██████  ██   ██ ███████  ██████ ██   ██ ███████    ██    
*/

/**
 * ForecastVisualizer module handles the creation and management of investment forecast
 * visualizations, including interactive sliders and comparative charts.
 * @namespace
 */
const ForecastVisualizer = {
    /**
     * Initializes forecast visualization functionality
     * Sets up sliders and event bindings
     */
    init() {
        this.initializeSliders();
        this.bindEvents();
        this.updateVisualization();
    },

    /**
     * Initializes interactive sliders for forecast parameters
     * Creates sliders for initial investment, interest rate, and time period
     */
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

    /**
     * Creates an individual slider with D3
     * @param {Object} config - Slider configuration object
     * @param {string} config.inputSelector - DOM selector for input element
     * @param {string} config.containerId - Container ID for slider
     * @param {number} config.min - Minimum value
     * @param {number} config.max - Maximum value
     * @param {number} config.step - Step increment
     * @param {number} config.initialValue - Initial slider value
     */
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

    /**
     * Updates the visualization based on current input values
     * Calculates new forecast data and updates chart
     */
    updateVisualization() {
        const initial = parseFloat(document.getElementById('forecast-initial').value) || 0;
        const rate = parseFloat(document.getElementById('forecast-rate').value) || 0;
        const years = parseFloat(document.getElementById('forecast-years').value) || 0;

        const data = ForecastCalculator.generateForecastData(initial, rate, years);
        this.renderChart(data);
    },

    /**
     * Renders the forecast comparison chart
     * @param {Array<Object>} data - Array of forecast data points
     */
    renderChart(data) {
        d3.select("#forecast-chart").select("svg").remove();

        const margin = {top: 40, right: 40, bottom: 60, left: 80};
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = d3.select("#forecast-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.year)])
            .range([20, width]);

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
            .attr("transform", "translate(20, 0)")
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
            `${d3.format(",.2f")(lastDataPoint.simpleInterest)} €`;
        document.getElementById("forecast-compound").textContent = 
            `${d3.format(",.2f")(lastDataPoint.compoundInterest)} €`;

        if (!this._resizeHandler) {
            this._resizeHandler = () => {
                requestAnimationFrame(() => this.updateVisualization());
            };
            window.addEventListener('resize', this._resizeHandler);
        }
    },

    /**
     * Binds event listeners to forecast input elements
     */
    bindEvents() {
        ['forecast-initial', 'forecast-rate', 'forecast-years'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateVisualization());
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ForecastVisualizer.init();
});