import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Waits for an element to be visible in the DOM.
 */
const waitForElement = (elementId, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
            const el = document.getElementById(elementId);
            if (el) {
                clearInterval(interval);
                resolve(el);
            } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                reject(new Error(`Element #${elementId} not found within ${timeout}ms`));
            }
        }, 100);
    });
};

/**
 * Captures a DOM element and generates a PDF out of it.
 * @param {string} elementId The ID of the DOM element to capture.
 * @param {string} filename The name of the downloaded file.
 */
export const generatePDFReport = async (elementId = 'premium-results-report', filename = 'CRS_Power_Architecture_Report.pdf') => {
    
    // Ensure filename has .pdf extension
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Wait for the element to actually be in the DOM
    let input;
    try {
        input = await waitForElement(elementId);
    } catch (err) {
        console.error(err.message);
        alert('Could not find the report element. Please try again.');
        return;
    }

    // Give the browser an extra frame to paint charts/SVGs
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 300)));

    try {
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: input.scrollWidth,
            height: input.scrollHeight,
            windowWidth: input.scrollWidth,
            windowHeight: input.scrollHeight,
            scrollX: 0,
            scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        // A4 portrait PDF
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const pageWidthMm = pdf.internal.pageSize.getWidth();   // 210mm
        const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm

        // Scale canvas px → mm
        const pxToMm = pageWidthMm / canvas.width;
        const totalHeightMm = canvas.height * pxToMm;

        let printedHeightMm = 0;

        // First page
        pdf.addImage(imgData, 'JPEG', 0, -printedHeightMm, pageWidthMm, totalHeightMm);
        printedHeightMm += pageHeightMm;

        // Additional pages if content overflows
        while (printedHeightMm < totalHeightMm) {
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, -printedHeightMm, pageWidthMm, totalHeightMm);
            printedHeightMm += pageHeightMm;
        }

        // Force download
        pdf.save(safeFilename);

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
