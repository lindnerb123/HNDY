const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateWarrantyPDF = (request, customer, contractorName) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Colors
            const brandColor = '#2563EB'; // Blue-600 logic
            const darkText = '#1F2937';
            const lightText = '#6B7280';

            // --- Header ---
            // Logo placeholder (Just text for now if no image available)
            doc.fontSize(24).fillColor(brandColor).font('Helvetica-Bold').text('HNDY', 50, 50);
            const guaranteeId = `HNDY-WARR-${request.id}-${Date.now().toString().slice(-4)}`;

            doc.fontSize(10).fillColor(lightText).font('Helvetica')
                .text(`Guarantee ID: ${guaranteeId}`, 400, 60, { align: 'right' });

            doc.moveDown(2);

            // --- Title ---
            doc.fontSize(20).fillColor(darkText).font('Helvetica-Bold')
                .text('1-Year Workmanship Guarantee', { align: 'center' });

            doc.moveDown();

            // --- Certificate Body ---
            doc.fontSize(12).fillColor(darkText).font('Helvetica').text('This certificate guarantees the workmanship of the service provided below for a period of one (1) year from the completion date.', {
                align: 'justify'
            });

            doc.moveDown(1.5);

            // --- Details Box ---
            doc.rect(50, 200, 500, 160).strokeColor('#E5E7EB').stroke();

            let y = 220;
            const leftCol = 70;
            const rightCol = 300;

            doc.fillColor(lightText).fontSize(10).text('HOMEOWNER', leftCol, y);
            doc.fillColor(darkText).fontSize(12).text(customer.name, leftCol, y + 15);
            doc.fillColor(lightText).fontSize(10).text(customer.email, leftCol, y + 30);

            doc.fillColor(lightText).fontSize(10).text('COMPLETION DATE', rightCol, y);
            doc.fillColor(darkText).fontSize(12).text(new Date().toLocaleDateString(), rightCol, y + 15);

            y += 60;

            doc.fillColor(lightText).fontSize(10).text('SERVICE ADDRESS', leftCol, y);
            doc.fillColor(darkText).fontSize(12).text(request.address, leftCol, y + 15);

            doc.fillColor(lightText).fontSize(10).text('CONTRACTOR / PRO', rightCol, y);
            doc.fillColor(darkText).fontSize(12).text(contractorName || 'HNDY Certified Pro', rightCol, y + 15);

            y += 60;

            doc.moveDown(8);

            // --- Terms ---
            doc.fontSize(14).fillColor(darkText).font('Helvetica-Bold').text('Terms & Conditions');
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor(lightText).font('Helvetica')
                .text('1. Coverage: This guarantee covers defects in workmanship related to the specific services performed. It does not cover material failure, normal wear and tear, or damage caused by misuse.', { width: 500 })
                .moveDown(0.5)
                .text('2. Claim Process: To file a claim, please contact HNDY Support through the app or website with your Guarantee ID.', { width: 500 })
                .moveDown(0.5)
                .text('3. Validity: This guarantee is valid only for the original homeowner and is non-transferable.', { width: 500 });

            // --- Footer ---
            const bottom = doc.page.height - 100;
            doc.fontSize(10).fillColor(brandColor).font('Helvetica-Bold')
                .text('HNDY - Home Services, Simplified.', 50, bottom, { align: 'center' });
            doc.fontSize(8).fillColor(lightText).font('Helvetica')
                .text('www.hndy.com', 50, bottom + 15, { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
