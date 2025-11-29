const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (order, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('📄 Generating receipt for:', order.orderNumber);

            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Create PDF document with thermal receipt sizing (80mm width)
            // 80mm = ~227 points, add margins = ~250 points width
            const doc = new PDFDocument({ 
                size: [226.77, 841.89], // 80mm width x auto height (like thermal paper)
                margin: 15 // Small margins like a receipt
            });
            
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Center align helper
            const centerText = (text, fontSize = 8) => {
                doc.fontSize(fontSize);
                const textWidth = doc.widthOfString(text);
                const centerX = (doc.page.width - textWidth) / 2;
                doc.text(text, centerX, doc.y);
            };

            // Logo (centered at top)
            const logoPath = path.join(__dirname, 'omgeesLogo.png');
            if (fs.existsSync(logoPath)) {
                try {
                    const logoSize = 45; // Width in points
                    const logoX = (doc.page.width - logoSize) / 2;
                    doc.image(logoPath, logoX, doc.y, { 
                        width: logoSize,
                        align: 'center'
                    });
                    doc.moveDown(3); // Space after logo
                } catch (err) {
                    console.log('⚠️ Logo load error, using text instead:', err.message);
                    // Fallback to text if logo fails
                    doc.font('Helvetica-Bold');
                    centerText('OMGees', 16);
                    doc.moveDown(0.3);
                }
            } else {
                console.log('ℹ️ Logo not found at:', logoPath);
                // Fallback to text header
                doc.font('Helvetica-Bold');
                centerText('OMGees', 16);
                doc.moveDown(0.3);
            }
            
            // Store Info (centered, small)
            doc.font('Helvetica');
            doc.fontSize(8);
            centerText('163 Pontiac Street, Fairview');
            centerText('Quezon City, Philippines');
            centerText('Tel: +63 906 512 8417');
            centerText('omgeesbakerysupplies@gmail.com');
            
            // Divider line
            doc.moveDown(0.5);
            const lineY = doc.y;
            doc.moveTo(15, lineY).lineTo(doc.page.width - 15, lineY).stroke();
            doc.moveDown(0.5);
            
            // Invoice details (left aligned)
            doc.fontSize(8);
            doc.text(`Invoice: ${order.orderNumber}`);
            doc.text(`Date: ${new Date(order.timestamp).toLocaleString()}`);
            doc.text(`Type: ${order.orderType === 'online' ? 'Online' : 'In-Store'}`);
            
            // Customer info
            doc.moveDown(0.3);
            doc.fontSize(8);
            doc.font('Helvetica-Bold');
            doc.text('CUSTOMER:');
            doc.font('Helvetica');
            doc.text(order.customer.name || 'Guest Customer');
            if (order.customer.email) doc.text(order.customer.email);
            if (order.customer.phone) doc.text(order.customer.phone);
            
            // Divider
            doc.moveDown(0.5);
            const itemsLineY = doc.y;
            doc.moveTo(15, itemsLineY).lineTo(doc.page.width - 15, itemsLineY).stroke();
            doc.moveDown(0.5);
            
            doc.fontSize(8);
            doc.font('Helvetica-Bold');
            const headerY = doc.y;
            doc.text('ITEM', 15, headerY, { width: 100 });
            doc.text('QTY', 115, headerY, { width: 25, align: 'center' });
            doc.text('PRICE', 140, headerY, { width: 35, align: 'right' });
            doc.text('TOTAL', 175, headerY, { width: 35, align: 'right' });
            doc.moveDown(0.3);
            
            // Items
            doc.font('Helvetica');
            doc.fontSize(8);
            
            order.items.forEach((item, index) => {
                const itemName = item.name || item.product_name;
                const quantity = item.quantity;
                const price = parseFloat(item.price);
                const total = price * quantity;
                
                // Item name (can wrap if too long)
                const startY = doc.y;
                doc.text(itemName, 15, startY, { width: 100 });
                
                // Quantity (centered)
                doc.text(quantity.toString(), 115, startY, { width: 25, align: 'center' });
                
                // Price (right aligned with peso symbol)
                doc.text(`₱${price.toFixed(2)}`, 140, startY, { width: 35, align: 'right' });
                
                // Total (right aligned with peso symbol)
                doc.text(`₱${total.toFixed(2)}`, 175, startY, { width: 35, align: 'right' });
                
                doc.moveDown(0.5);
            });
            
            // Divider before totals
            doc.moveDown(0.3);
            const totalsLineY = doc.y;
            doc.moveTo(15, totalsLineY).lineTo(doc.page.width - 15, totalsLineY).stroke();
            doc.moveDown(0.5);
            
            // Subtotal
            const subtotal = order.items.reduce((sum, item) => 
                sum + (parseFloat(item.price) * item.quantity), 0
            );
            
            doc.fontSize(9);
            doc.text('Total:', 15, doc.y, { width: 140 });
            doc.text(`₱${subtotal.toFixed(2)}`, 155, doc.y - 11, { width: 55, align: 'right' });
            doc.moveDown(0.3);
            
            // Shipping (if applicable)
            if (order.shipping && order.shipping.fee > 0) {
                doc.text('Shipping:', 15, doc.y, { continued: true, width: 155 });
                doc.text(`₱${parseFloat(order.shipping.fee).toFixed(2)}`, { width: 55, align: 'right' });
            }
            
            // Divider
            doc.moveDown(0.5);
            const paymentLineY = doc.y;
            doc.moveTo(15, paymentLineY).lineTo(doc.page.width - 15, paymentLineY).stroke();
            doc.moveDown(0.5);
            
            // Notes (if any)
            if (order.notes) {
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold');
                doc.text('Notes:');
                doc.font('Helvetica');
                doc.text(order.notes, { width: doc.page.width - 30 });
            }
            
            // Footer
            doc.moveDown(1);
            const footerLineY = doc.y;
            doc.moveTo(15, footerLineY).lineTo(doc.page.width - 15, footerLineY).stroke();
            doc.moveDown(0.5);
            
            doc.fontSize(7);
            centerText('Thank you for your purchase!');
            centerText('Visit us again soon');
            
            // Finalize PDF
            doc.end();
            
            stream.on('finish', () => {
                console.log('✅ Receipt generated:', outputPath);
                resolve(outputPath);
            });
            
            stream.on('error', (err) => {
                console.error('❌ Stream error:', err);
                reject(err);
            });
            
        } catch (error) {
            console.error('❌ Receipt generation error:', error);
            reject(error);
        }
    });
};

// Export the function
module.exports = generateInvoicePDF;