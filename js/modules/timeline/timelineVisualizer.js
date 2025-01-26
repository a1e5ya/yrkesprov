const SCALE_OPTIONS = {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    BIANNUAL: 'biannual',
    YEARLY: 'yearly'
};



const TimelineVisualizer = {
    init() {
        this.renderTimeline();
        window.addEventListener('resize', this.renderTimeline.bind(this));
        document.addEventListener('budgetUpdated', () => {
            this.renderTimeline();
        });
        document.getElementById('timeline-scale').addEventListener('change', () => {
            this.renderTimeline();
        });
    },
    
    updatePeriodBalance(data) {
        const totalBalance = data.reduce((sum, d) => sum + d.balance, 0);
        const formattedBalance = totalBalance >= 0 ? 
            `+${Formatter.currency(totalBalance)}` : 
            Formatter.currency(totalBalance);
        
        document.querySelector('.period-balance').innerHTML = `
            <div class="balance-total ${totalBalance >= 0 ? 'positive' : 'negative'}">
                ${formattedBalance}
            </div>
        `;
    },
    
    createScaleSelector() {
        const container = document.getElementById('timeline-visualization');
        const controls = document.createElement('div');
        controls.className = 'timeline-controls';
        controls.innerHTML = `
            <div class="scale-selector">
                <select id="timeline-scale" class="little-nav">
                    <option value="24">2 Years (Monthly)</option>
                    <option value="36">3 Years (Quarterly)</option>
                    <option value="60">5 Years (Biannual)</option>
                    <option value="240">20 Years (Yearly)</option>
                </select>
            </div>
        `;
        container.insertBefore(controls, container.firstChild);
        
        document.getElementById('timeline-scale').addEventListener('change', (e) => {
            this.renderTimeline();
        });
    },

    calculateMonthlyTotals() {
        const scaleSelect = document.getElementById('timeline-scale');
        const monthsToShow = parseInt(scaleSelect.value);
        const scale = monthsToShow <= 24 ? SCALE_OPTIONS.MONTHLY :
                     monthsToShow <= 36 ? SCALE_OPTIONS.QUARTERLY :
                     monthsToShow <= 60 ? SCALE_OPTIONS.BIANNUAL :
                     SCALE_OPTIONS.YEARLY;
        
        const periods = [];
        const today = new Date();
        
        for (let i = 0; i <= monthsToShow; i++) {
            const date = d3.timeMonth.offset(today, i);
            const dateStr = date.toISOString().split('T')[0];
            
            const periodData = {
                date,
                incomes: 0,
                expenses: 0,
                savings: 0,
                balance: 0
            };
    
            // Aggregate data based on scale
            let datesInPeriod = [];
            if (scale === SCALE_OPTIONS.MONTHLY) {
                datesInPeriod = [dateStr];
            } else if (scale === SCALE_OPTIONS.QUARTERLY) {
                const quarterStart = new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
                for (let m = 0; m < 3; m++) {
                    datesInPeriod.push(d3.timeMonth.offset(quarterStart, m).toISOString().split('T')[0]);
                }
            } else if (scale === SCALE_OPTIONS.BIANNUAL) {
                const halfYearStart = new Date(date.getFullYear(), Math.floor(date.getMonth() / 6) * 6, 1);
                for (let m = 0; m < 6; m++) {
                    datesInPeriod.push(d3.timeMonth.offset(halfYearStart, m).toISOString().split('T')[0]);
                }
            } else {
                const yearStart = new Date(date.getFullYear(), 0, 1);
                for (let m = 0; m < 12; m++) {
                    datesInPeriod.push(d3.timeMonth.offset(yearStart, m).toISOString().split('T')[0]);
                }
            }
    
            // Sum up all values in the period
            datesInPeriod.forEach(date => {
                periodData.incomes += BudgetManager.getEntriesForPeriod('income', 'month', date, true)
                    .reduce((sum, entry) => sum + Number(entry.amount), 0);
                periodData.expenses += BudgetManager.getEntriesForPeriod('expense', 'month', date, true)
                    .reduce((sum, entry) => sum + Number(entry.amount), 0);
                periodData.savings += BudgetManager.getEntriesForPeriod('saving', 'month', date, true)
                    .reduce((sum, entry) => sum + Number(entry.amount), 0);
            });
    
            periodData.balance = periodData.incomes - (periodData.expenses + periodData.savings);
            
            // Only add unique periods based on scale
            const shouldAdd = scale === SCALE_OPTIONS.MONTHLY ||
                (scale === SCALE_OPTIONS.QUARTERLY && date.getMonth() % 3 === 0) ||
                (scale === SCALE_OPTIONS.BIANNUAL && date.getMonth() % 6 === 0) ||
                (scale === SCALE_OPTIONS.YEARLY && date.getMonth() === 0);
                
            if (shouldAdd) {
                periods.push(periodData);
            }
        }
        
        return periods;
    },

    renderTimeline() {
        const scaleSelect = document.getElementById('timeline-scale');
        const monthsToShow = parseInt(scaleSelect?.value || '24');
        
        d3.select("#timeline-visualization").select("svg").remove();
    
        const margin = {top: 40, right: 20, bottom: 40, left: 20};
        const width = 500 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        const barWidth = width * 0.3;
    
        const svg = d3.select("#timeline-visualization")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        const monthlyData = this.calculateMonthlyTotals();
        this.updatePeriodBalance(monthlyData);
        const maxValue = d3.max(monthlyData, d => 
            Math.max(d.incomes, d.expenses + d.savings)
        ) || 100;
    
        const yScale = d3.scaleTime()
            .domain([d3.max(monthlyData, d => d.date), d3.min(monthlyData, d => d.date)])
            .range([0, height]);
    
        const xScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, barWidth]);
    
        const centerX = width/2;
        
        svg.append("line")
            .attr("x1", centerX)
            .attr("x2", centerX)
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "var(--text-primary)")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "4");
    
        const monthAxis = d3.axisLeft(yScale)
            .ticks(d3.timeMonth.every(monthsToShow <= 24 ? 1 : 
                                     monthsToShow <= 36 ? 3 : 
                                     monthsToShow <= 60 ? 6 : 12))
            .tickFormat(d => {
                const format = d3.timeFormat("%b");
                const year = d.getFullYear();
                const month = format(d).toLowerCase();
                return d.getMonth() === 0 ? `${year}` : 
                       monthsToShow <= 24 ? month :
                       monthsToShow <= 36 && d.getMonth() % 3 === 0 ? `Q${Math.floor(d.getMonth()/3)+1}` :
                       monthsToShow <= 60 && d.getMonth() % 6 === 0 ? `H${Math.floor(d.getMonth()/6)+1}` : '';
            });

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${centerX},0)`)
            .style("color", "var(--text-primary)")
            .call(monthAxis);

        // Income bars (left side)
        svg.selectAll(".income-bar")
            .data(monthlyData)
            .enter()
            .append("rect")
            .attr("class", "income-bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.date) - 5)
            .attr("width", d => xScale(d.incomes || 0))
            .attr("height", 10)
            .attr("fill", "var(--green-bright)");

        // Expense bars (right side, right-aligned)
        svg.selectAll(".expense-bar")
            .data(monthlyData)
            .enter()
            .append("rect")
            .attr("class", "expense-bar")
            .attr("x", d => width - xScale(d.expenses || 0))
            .attr("y", d => yScale(d.date) - 5)
            .attr("width", d => xScale(d.expenses || 0))
            .attr("height", 10)
            .attr("fill", "var(--pink-soft)");

        // Savings bars (right side, left of expenses)
        svg.selectAll(".savings-bar")
            .data(monthlyData)
            .enter()
            .append("rect")
            .attr("class", "savings-bar")
            .attr("x", d => width - xScale(d.expenses || 0) - xScale(d.savings || 0))
            .attr("y", d => yScale(d.date) - 5)
            .attr("width", d => xScale(d.savings || 0))
            .attr("height", 10)
            .attr("fill", "var(--orange-medium)");

        // Balance values
        svg.selectAll(".balance-text")
            .data(monthlyData)
            .enter()
            .append("text")
            .attr("x", centerX + 10)
            .attr("y", d => yScale(d.date) + 4)
            .attr("text-anchor", "start")
            .style("fill", d => (d.balance || 0) >= 0 ? "var(--green-bright)" : "var(--pink-soft)")
            .text(d => {
                const balance = d.balance || 0;
                return balance === 0 ? "0" : balance > 0 ? `+${balance}` : balance;
            });

        // Labels
        svg.append("text")
            .attr("x", 0)
            .attr("y", height + 30)
            .style("fill", "var(--text-primary)")
            .text("Incomes");
            
        svg.append("text")
            .attr("x", width)
            .attr("y", height + 30)
            .style("text-anchor", "end")
            .style("fill", "var(--text-primary)")
            .text("Outflows");
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    BudgetManager.init();
    CategoryManager.init();
    TimelineVisualizer.init();
});