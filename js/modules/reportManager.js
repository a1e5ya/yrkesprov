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

    async createPDF(report) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        pdf.setFontSize(16);
        pdf.text(`${report.type.toUpperCase()} Report`, 20, 20);
        
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, 20, 30);
    
        try {
            let targetElement;
            switch(report.type) {
                case 'forecast':
                    targetElement = document.querySelector("#forecast-chart");
                    pdf.text(`Simple Interest: ${report.data.simpleResult}`, 20, 50);
                    pdf.text(`Compound Interest: ${report.data.compoundResult}`, 20, 60);
                    break;
                case 'pie':
                    targetElement = document.querySelector("#pie-visualization");
                    pdf.text(`Balance: ${report.data.balance}`, 20, 50);
                    break;
                case 'timeline':
                    targetElement = document.querySelector("#timeline-visualization");
                    pdf.text(`Balance: ${report.data.balance}`, 20, 50);
                    break;
            }
    
            if (targetElement) {
                // Store original theme
                const originalTheme = document.documentElement.getAttribute('data-theme');
                
                // Force light theme
                document.documentElement.setAttribute('data-theme', 'light');
    
                // Make sure the element is visible
                const section = targetElement.closest('section');
                const originalDisplay = section.style.display;
                section.style.display = 'flex';
    
                // Wait for rendering and theme change
                await new Promise(resolve => setTimeout(resolve, 500));
    
                // Create a temporary container with light theme styles
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                tempContainer.style.width = '800px';  // Increased width
                tempContainer.style.height = '600px'; // Increased height
                tempContainer.style.backgroundColor = '#ffffff';
                tempContainer.style.color = '#1E1E1E';
                document.body.appendChild(tempContainer);
    
                // Clone the element into our temporary container
                const clone = targetElement.cloneNode(true);
                clone.style.width = '100%';
                clone.style.height = '100%';
                tempContainer.appendChild(clone);
    
                // Force all SVG elements to use light theme colors
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
    
                // Capture the clone
                const canvas = await html2canvas(clone, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    width: 800,
                    height: 600,
                    onclone: (clonedDoc) => {
                        // Ensure light theme styles in cloned document
                        clonedDoc.documentElement.setAttribute('data-theme', 'light');
                    }
                });
    
                // Remove temporary elements
                document.body.removeChild(tempContainer);
    
                // Add to PDF with adjusted dimensions to fit the whole chart
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                
                // Calculate dimensions to fit in PDF while maintaining aspect ratio
                const pdfWidth = 170;
                const pdfHeight = (600 * pdfWidth) / 800;
                
                pdf.addImage(imgData, 'JPEG', 20, 70, pdfWidth, pdfHeight);
    
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

    async addSvgToPdf(pdf, svgElement, x, y, width) {
        return new Promise((resolve, reject) => {
            try {
                // Clone the SVG to avoid modifying the original
                const svgClone = svgElement.cloneNode(true);
                
                // Get original dimensions
                const bbox = svgElement.getBBox();
                const viewBox = svgElement.getAttribute('viewBox');
                const viewBoxValues = viewBox ? viewBox.split(' ').map(Number) : [0, 0, bbox.width, bbox.height];
                
                // Set explicit dimensions
                svgClone.setAttribute('width', viewBoxValues[2]);
                svgClone.setAttribute('height', viewBoxValues[3]);
                
                // Ensure white background and black foreground
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
    
                // Create a Blob from the SVG
                const svgString = new XMLSerializer().serializeToString(svgClone);
                const svg64 = btoa(svgString);
                const image64 = 'data:image/svg+xml;base64,' + svg64;
    
                // Create image
                const img = new Image();
                img.onload = function() {
                    try {
                        // Create canvas with proper dimensions
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // Get context and set white background
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw image
                        ctx.drawImage(img, 0, 0);
                        
                        // Get base64 data
                        const pngBase64 = canvas.toDataURL('image/png', 1.0);
                        
                        // Calculate dimensions
                        const aspectRatio = canvas.height / canvas.width;
                        const imgHeight = width * aspectRatio;
                        
                        try {
                            // Add to PDF with error handling
                            pdf.addImage(pngBase64, 'PNG', x, y, width, imgHeight, '', 'FAST');
                            resolve();
                        } catch (pdfError) {
                            console.error('PDF generation error:', pdfError);
                            // If we can't add the image, resolve anyway to allow PDF generation
                            resolve();
                        }
                    } catch (canvasError) {
                        console.error('Canvas error:', canvasError);
                        resolve(); // Allow PDF generation even if image fails
                    }
                };
    
                img.onerror = function(err) {
                    console.error('Image loading error:', err);
                    resolve(); // Allow PDF generation even if image fails
                };
    
                // Set image source
                img.src = image64;
    
            } catch (error) {
                console.error('SVG processing error:', error);
                resolve(); // Allow PDF generation even if image fails
            }
        });
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

        document.addEventListener('click', async (e) => {
            const reportItem = e.target.closest('.report-item');
            if (!reportItem) return;

            const reportId = reportItem.dataset.id;
            const report = this.reports.find(r => r.id === reportId);
            if (!report) return;

            if (e.target.classList.contains('download-report')) {
                try {
                    const pdf = await this.createPDF(report);
                    pdf.save(`${report.type}-report.pdf`);
                } catch (err) {
                    console.error('Error generating PDF:', err);
                    alert('Error generating PDF. Please try again.');
                }
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