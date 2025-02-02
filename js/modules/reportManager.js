/*
██████  ███████ ██████   ██████  ██████  ████████     ███    ███  █████  ███    ██  █████   ██████  ███████ ██████  
██   ██ ██      ██   ██ ██    ██ ██   ██    ██        ████  ████ ██   ██ ████   ██ ██   ██ ██       ██      ██   ██ 
██████  █████   ██████  ██    ██ ██████     ██        ██ ████ ██ ███████ ██ ██  ██ ███████ ██   ███ █████   ██████  
██   ██ ██      ██      ██    ██ ██   ██    ██        ██  ██  ██ ██   ██ ██  ██ ██ ██   ██ ██    ██ ██      ██   ██ 
██   ██ ███████ ██       ██████  ██   ██    ██        ██      ██ ██   ██ ██   ████ ██   ██  ██████  ███████ ██   ██ 
*/

/**
 * @typedef {Object} Report
 * @property {string} id - Unique identifier for the report
 * @property {string} type - Report type (forecast/pie/timeline/table)
 * @property {string} timestamp - Creation timestamp
 * @property {Object} data - Report data including charts and calculations
 */

/**
 * Manages report generation, storage, and display functionality
 * Handles PDF creation and report management for different visualization types
 * @namespace
 */
const ReportManager = {
    /** @type {Report[]} Array of generated reports */
    reports: [],

    /**
     * Initializes report management functionality
     * Loads saved reports and sets up event handlers
     */
    init() {
        this.loadReports();
        this.bindEvents();
    },

    /**
     * Loads previously saved reports from storage
     * Restores report list and updates display
     */
    loadReports() {
        this.reports = StorageManager.get('reports') || [];
        this.displayReports();
    },

    /**
     * Saves current reports to local storage
     * Persists report data for future sessions
     */
    saveReports() {
        StorageManager.set('reports', this.reports);
    },

    /**
     * Generates a new report based on current view
     * @param {string} type - Type of report to generate (forecast/pie/timeline/table)
     * @param {string} sectionId - ID of the section containing report data
     */
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

    /**
     * Captures SVG charts from a section for report generation
     * @param {string} sectionId - ID of the section containing charts
     * @returns {Array<Object>} Array of captured chart data
     */
    captureCharts(sectionId) {
        const charts = [];
        const section = document.getElementById(sectionId);
        
        if (!section) return charts;

        const svgElements = section.querySelectorAll('svg');
        svgElements.forEach((svg, index) => {
            const svgCopy = svg.cloneNode(true);
            
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

    /**
     * Calculates current balance for report
     * @returns {number} Calculated balance value
     */
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

    /*
██████  ██████  ███████      ██████  ███████ ███    ██ ███████ ██████   █████  ████████ ██  ██████  ███    ██ 
██   ██ ██   ██ ██          ██       ██      ████   ██ ██      ██   ██ ██   ██    ██    ██ ██    ██ ████   ██ 
██████  ██   ██ █████       ██   ███ █████   ██ ██  ██ █████   ██████  ███████    ██    ██ ██    ██ ██ ██  ██ 
██      ██   ██ ██          ██    ██ ██      ██  ██ ██ ██      ██   ██ ██   ██    ██    ██ ██    ██ ██  ██ ██ 
██      ██████  ██           ██████  ███████ ██   ████ ███████ ██   ██ ██   ██    ██    ██  ██████  ██   ████ 
*/

/**
 * Creates a PDF document from the given report data
 * Handles different report types and includes visualizations
 * 
 * @async
 * @param {Report} report - The report object containing data to render
 * @param {string} report.type - Type of report (forecast/pie/timeline)
 * @param {string} report.timestamp - Report generation timestamp 
 * @param {Object} report.data - Report data including charts and calculations
 * @returns {Promise<Object>} Generated PDF document instance
 */
async createPDF(report) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Get PDF dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add report title
    pdf.setFontSize(16);
    const titleText = `${report.type.toUpperCase()} Report`;
    const titleWidth = pdf.getTextDimensions(titleText).w;
    pdf.text(titleText, (pageWidth - titleWidth) / 2, 30);
    
    // Add generation timestamp
    pdf.setFontSize(12);
    const dateText = `Generated: ${new Date(report.timestamp).toLocaleString()}`;
    const dateWidth = pdf.getTextDimensions(dateText).w;
    pdf.text(dateText, (pageWidth - dateWidth) / 2, 40);

    try {
        let targetElement;
        let balanceText = '';

        // Handle different report types
        switch(report.type) {
            case 'forecast':
                targetElement = document.querySelector("#forecast-chart");
                
                // Add forecast results
                const simpleText = `Simple Interest: ${report.data.simpleResult}`;
                const compoundText = `Compound Interest: ${report.data.compoundResult}`;
                const simpleWidth = pdf.getTextDimensions(simpleText).w;
                const compoundWidth = pdf.getTextDimensions(compoundText).w;
                
                pdf.text(simpleText, (pageWidth - simpleWidth) / 2, 50);
                pdf.text(compoundText, (pageWidth - compoundWidth) / 2, 60);
                break;

            case 'pie':
                targetElement = document.querySelector("#pie-visualization");
                balanceText = `Balance: ${report.data.balance}`;
                break;

            case 'timeline':
                targetElement = document.querySelector("#timeline-visualization");
                balanceText = `Balance: ${report.data.balance}`;
                break;
        }

        // Add balance information if applicable
        if (balanceText) {
            const balanceWidth = pdf.getTextDimensions(balanceText).w;
            pdf.text(balanceText, (pageWidth - balanceWidth) / 2, 50);
        }

        // Process visualization if available
        if (targetElement) {
            // Store current theme
            const originalTheme = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', 'light');

            // Ensure visualization is visible
            const section = targetElement.closest('section');
            const originalDisplay = section.style.display;
            section.style.display = 'flex';

            // Allow time for theme change and rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create temporary container for visualization
            const tempContainer = document.createElement('div');
            Object.assign(tempContainer.style, {
                position: 'absolute',
                left: '-9999px',
                width: '800px',
                height: '600px',
                backgroundColor: '#ffffff',
                color: '#1E1E1E'
            });
            document.body.appendChild(tempContainer);

            // Prepare visualization clone
            const clone = targetElement.cloneNode(true);
            clone.style.width = '100%';
            clone.style.height = '100%';
            tempContainer.appendChild(clone);

            // Apply light theme to SVG elements
            clone.querySelectorAll('svg').forEach(svg => {
                svg.style.backgroundColor = '#ffffff';
                svg.querySelectorAll('path, line, rect, circle, text').forEach(el => {
                    if (el.getAttribute('fill') && el.getAttribute('fill') !== 'none') {
                        el.style.fill = el.getAttribute('fill');
                    }
                    if (el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                        el.style.stroke = el.getAttribute('stroke');
                    }
                    if (el.tagName === 'text') {
                        el.style.fill = '#1E1E1E';
                    }
                });
            });

            // Capture visualization
            const canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                width: 800,
                height: 600,
                onclone: (clonedDoc) => {
                    clonedDoc.documentElement.setAttribute('data-theme', 'light');
                }
            });

            // Clean up temporary elements
            document.body.removeChild(tempContainer);

            // Add visualization to PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdfWidth = pageWidth - 40; // Leave margins
            const pdfHeight = (600 * pdfWidth) / 800; // Maintain aspect ratio
            const xPosition = 20; // Left margin
            
            pdf.addImage(imgData, 'JPEG', xPosition, 70, pdfWidth, pdfHeight);

            // Restore original theme and display
            document.documentElement.setAttribute('data-theme', originalTheme);
            section.style.display = originalDisplay;
        }
    } catch (error) {
        console.error('Error capturing chart:', error);
        pdf.text('Error capturing chart image', 20, 70);
    }

    return pdf;
},

/**
 * Adds an SVG element to the PDF document
 * Handles SVG conversion and formatting for PDF inclusion
 * 
 * @async
 * @param {Object} pdf - jsPDF document instance
 * @param {SVGElement} svgElement - SVG element to add to PDF
 * @param {number} x - X coordinate for placement
 * @param {number} y - Y coordinate for placement
 * @param {number} width - Desired width of SVG in PDF
 * @returns {Promise<void>} 
 */
async addSvgToPdf(pdf, svgElement, x, y, width) {
    return new Promise((resolve, reject) => {
        try {
            // Clone SVG to avoid modifying original
            const svgClone = svgElement.cloneNode(true);
            
            // Get original dimensions
            const bbox = svgElement.getBBox();
            const viewBox = svgElement.getAttribute('viewBox');
            const viewBoxValues = viewBox ? viewBox.split(' ').map(Number) : [0, 0, bbox.width, bbox.height];
            
            // Set explicit dimensions
            svgClone.setAttribute('width', viewBoxValues[2]);
            svgClone.setAttribute('height', viewBoxValues[3]);
            
            // Apply light theme colors
            svgClone.style.backgroundColor = 'white';
            const elements = svgClone.getElementsByTagName('*');
            for (let el of elements) {
                if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
                    el.setAttribute('fill', '#000000');
                }
                if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                    el.setAttribute('stroke', '#000000');
                }
            }

            // Convert SVG to base64
            const svgString = new XMLSerializer().serializeToString(svgClone);
            const svg64 = btoa(svgString);
            const image64 = 'data:image/svg+xml;base64,' + svg64;

            // Create image for canvas conversion
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Create canvas for conversion
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Set up canvas context
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to PNG and add to PDF
                    const pngBase64 = canvas.toDataURL('image/png', 1.0);
                    const aspectRatio = canvas.height / canvas.width;
                    const imgHeight = width * aspectRatio;
                    
                    try {
                        pdf.addImage(pngBase64, 'PNG', x, y, width, imgHeight, '', 'FAST');
                        resolve();
                    } catch (pdfError) {
                        console.error('PDF generation error:', pdfError);
                        resolve(); // Continue even if image fails
                    }
                } catch (canvasError) {
                    console.error('Canvas error:', canvasError);
                    resolve(); // Continue even if canvas fails
                }
            };

            img.onerror = function(err) {
                console.error('Image loading error:', err);
                resolve(); // Continue even if image fails
            };

            img.src = image64;

        } catch (error) {
            console.error('SVG processing error:', error);
            resolve(); // Continue even if SVG processing fails
        }
    });
},

/*
██████  ██ ███████ ██████  ██       █████  ██    ██     ██   ██  █████  ███    ██ ██████  ██      ██ ███    ██  ██████  
██   ██ ██ ██      ██   ██ ██      ██   ██  ██  ██      ██   ██ ██   ██ ████   ██ ██   ██ ██      ██ ████   ██ ██       
██   ██ ██ ███████ ██████  ██      ███████   ████       ███████ ███████ ██ ██  ██ ██   ██ ██      ██ ██ ██  ██ ██   ███ 
██   ██ ██      ██ ██      ██      ██   ██    ██        ██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██ ██  ██ ██ ██    ██ 
██████  ██ ███████ ██      ███████ ██   ██    ██        ██   ██ ██   ██ ██   ████ ██████  ███████ ██ ██   ████  ██████  
*/

/**
 * Renders the list of generated reports in the UI
 * Creates interactive elements for each report with download and delete options
 */
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
                    <button class="download-report">PDF</button>
                    <button class="delete-report" aria-label="Delete report">×</button>
                </div>
            `).join('')}
        </div>
    `;
},

/**
 * Sets up event listeners for report generation and management
 * Handles report creation, downloading, and deletion events
 */
bindEvents() {
    // Report generation buttons
    document.querySelectorAll('[data-target="reports"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentSection = e.target.closest('section').id;
            
            // Skip report generation for main menu
            if (currentSection === 'main-menu') return;
            
            const type = currentSection.split('-')[1];
            this.generateReport(type, currentSection);
        });
    });

    // Report management (download/delete)
    document.addEventListener('click', async (e) => {
        const reportItem = e.target.closest('.report-item');
        if (!reportItem) return;

        const reportId = reportItem.dataset.id;
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        // Handle download request
        if (e.target.classList.contains('download-report')) {
            try {
                const pdf = await this.createPDF(report);
                pdf.save(`${report.type}-report.pdf`);
            } catch (err) {
                console.error('Error generating PDF:', err);
                alert('Error generating PDF. Please try again.');
            }
        } 
        // Handle delete request
        else if (e.target.classList.contains('delete-report')) {
            this.reports = this.reports.filter(r => r.id !== reportId);
            this.saveReports();
            this.displayReports();
        }
    });
}
};

// Initialize ReportManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => ReportManager.init());