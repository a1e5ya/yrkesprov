const ReportManager = {
    reports: [],

    init() {
        this.loadReports();
        this.bindEvents();
    },

    loadReports() {
        this.reports = StorageManager.get('reports') || [];
        this.displayReports();
    },

    saveReports() {
        StorageManager.set('reports', this.reports);
    },

    generateReport(type, sectionId) {
        const timestamp = new Date().toISOString();
        const reportId = `${type}-${timestamp}`;
        
        let reportData = {
            charts: this.captureCharts(sectionId)
        };

        switch(type) {
            case 'forecast':
                reportData.simpleResult = document.getElementById('forecast-simple').textContent;
                reportData.compoundResult = document.getElementById('forecast-compound').textContent;
                break;
            case 'pie':
            case 'timeline':
            case 'table':
                reportData.balance = this.calculateBalance();
                break;
        }

        const report = {
            id: reportId,
            type,
            timestamp,
            data: reportData
        };

        this.reports.push(report);
        this.saveReports();
        this.displayReports();
    },

    captureCharts(sectionId) {
        const charts = [];
        const section = document.getElementById(sectionId);
        
        if (!section) return charts;

        // Capture all SVG elements
        const svgElements = section.querySelectorAll('svg');
        svgElements.forEach((svg, index) => {
            // Create a copy to avoid modifying the original
            const svgCopy = svg.cloneNode(true);
            
            // Set white background and black text for PDF
            svgCopy.style.backgroundColor = 'white';
            svgCopy.querySelectorAll('text').forEach(text => {
                text.style.fill = 'black';
            });
            
            charts.push({
                type: 'svg',
                content: svgCopy.outerHTML,
                width: svg.width.baseVal.value,
                height: svg.height.baseVal.value
            });
        });

        return charts;
    },

    calculateBalance() {
        const dateType = document.getElementById('table-date-type')?.value || 
                        document.getElementById('pie-date-type')?.value || 'all';
        const dateValue = document.getElementById('table-date-value')?.value || 
                         document.getElementById('pie-date-value')?.value || new Date().toISOString().split('T')[0];
        
        if (!BudgetManager) return 0;
        
        const entries = BudgetManager.getEntriesForPeriod('income', dateType, dateValue, true);
        const incomes = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
        
        const expenses = BudgetManager.getEntriesForPeriod('expense', dateType, dateValue, true)
            .reduce((sum, entry) => sum + Number(entry.amount), 0);
        
        const savings = BudgetManager.getEntriesForPeriod('saving', dateType, dateValue, true)
            .reduce((sum, entry) => sum + Number(entry.amount), 0);
        
        return incomes - (expenses + savings);
    },

    createPDF(report) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0); // Black text
        pdf.text(`${report.type.toUpperCase()} Report`, 20, 20);
        
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, 20, 30);

        switch(report.type) {
            case 'forecast':
                // Add forecast data
                pdf.text(`Simple Interest: ${report.data.simpleResult}`, 20, 50);
                pdf.text(`Compound Interest: ${report.data.compoundResult}`, 20, 60);
                
                // Add forecast chart
                const forecastSvg = document.querySelector("#forecast-chart svg");
                if (forecastSvg) {
                    this.addSvgToPdf(pdf, forecastSvg, 20, 70, 170);
                }
                break;

            case 'pie':
                pdf.text(`Balance: ${report.data.balance}`, 20, 50);
                
                // Add pie charts
                const incomePie = document.querySelector("#incomes-pie svg");
                const outflowsPie = document.querySelector("#outflows-pie svg");
                
                if (incomePie) {
                    this.addSvgToPdf(pdf, incomePie, 20, 70, 80);
                }
                if (outflowsPie) {
                    this.addSvgToPdf(pdf, outflowsPie, 110, 70, 80);
                }
                break;

            case 'timeline':
                pdf.text(`Balance: ${report.data.balance}`, 20, 50);
                
                // Add timeline chart
                const timelineSvg = document.querySelector("#timeline-visualization svg");
                if (timelineSvg) {
                    this.addSvgToPdf(pdf, timelineSvg, 20, 70, 170);
                }
                break;
        }

        return pdf;
    },

    addSvgToPdf(pdf, svgElement, x, y, width) {
        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const bbox = svgElement.getBBox();
        canvas.width = bbox.width;
        canvas.height = bbox.height;
        
        // Convert SVG to string
        const data = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        // Create image
        const img = new Image();
        img.onload = () => {
            // Draw on canvas
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Convert to PNG
            const imgData = canvas.toDataURL('image/png');
            
            // Add to PDF
            const height = (width * canvas.height) / canvas.width;
            pdf.addImage(imgData, 'PNG', x, y, width, height);
            
            URL.revokeObjectURL(url);
        };
        img.src = url;
    },

    displayReports() {
        const container = document.getElementById('report-preview');
        if (!container) return;

        container.innerHTML = `
            <div class="reports-list">
                ${this.reports.map(report => `
                    <div class="report-item" data-id="${report.id}">
                        <div class="report-info">
                            <span class="report-type">${report.type}</span>
                            <span class="report-date">${new Date(report.timestamp).toLocaleString()}</span>
                        </div>
                        <button class="download-report">Download PDF</button>
                        <button class="delete-report">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('[data-target="reports"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currentSection = e.target.closest('section').id;
                const type = currentSection.split('-')[1];
                this.generateReport(type, currentSection);
            });
        });

        document.addEventListener('click', (e) => {
            const reportItem = e.target.closest('.report-item');
            if (!reportItem) return;

            const reportId = reportItem.dataset.id;
            const report = this.reports.find(r => r.id === reportId);
            if (!report) return;

            if (e.target.classList.contains('download-report')) {
                const pdf = this.createPDF(report);
                pdf.save(`${report.type}-report.pdf`);
            } else if (e.target.classList.contains('delete-report')) {
                if (confirm('Delete this report?')) {
                    this.reports = this.reports.filter(r => r.id !== reportId);
                    this.saveReports();
                    this.displayReports();
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ReportManager.init());