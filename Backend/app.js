const express = require("express");
const mysql = require("mysql");
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const { Resend } = require('resend'); //instead sa nodemailer pinalitan ko netong resend

const resend = new Resend('re_b8uAGJPn_LaHZdDeDiQxZ8zacmvXXXLdW');

// Set up multer for file uploads
const app = express();
app.use(express.json());

// Enable CORS
const cors = require('cors');
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static('public/uploads'));

// database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database:'omgees-app'
})

// Connect to the database
db.connect((err) => {
    if(err) {
        console.log('Database connection error:', err);
    } else {
        console.log('Connected to the database');
    }
});

// Image upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Middleware to handle image uploads
const upload = multer({ storage: storage });


// Store verification codes temporarily
const verificationCodes = new Map();

async function sendInvoiceEmail(invoiceData, invoicePath) {
    try {
        // Read the PDF file as base64
        const pdfBuffer = fs.readFileSync(invoicePath);
        const pdfBase64 = pdfBuffer.toString('base64');

        const { data, error } = await resend.emails.send({
            from: 'OMGees <noreply@omgees.tech>', 
            to: [invoiceData.customer.email],
            subject: `OMGees - Order Invoice #${invoiceData.orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333;">OMGees</h1>
                    </div>
                    
                    <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Order Invoice</h2>
                        
                        <p style="color: #666; font-size: 16px;">
                            Thank you for your order!
                        </p>
                        
                        <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${invoiceData.orderNumber}</p>
                            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(invoiceData.timestamp).toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${invoiceData.customer.name}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${invoiceData.customer.email}</p>
                            <hr />
                            <p style="margin: 5px 0;"><strong>Total Amount:</strong> <span style="color: #28a745; font-size: 18px;">₱${invoiceData.total.toLocaleString()}</span></p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Please see the attached invoice for detailed information.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} OMGees. All rights reserved.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice-${invoiceData.orderNumber}.pdf`,
                    content: pdfBase64
                }
            ]
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log(`✅ Invoice email sent to: ${invoiceData.customer.email}`);
        console.log(`📧 Email ID: ${data.id}`);
        
        return data;
    } catch (error) {
        console.error('❌ Failed to send invoice email:', error.message);
        throw error;
    }
}

// ========== EMAIL VERIFICATION ENDPOINTS ==========

// Generate and send verification code
app.post('/send-verification-code', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log(`📧 Sending verification code to: ${email}`);
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with expiration (10 minutes)
    verificationCodes.set(email, {
        code: code,
        expires: Date.now() + 10 * 60 * 1000
    });
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'OMGees <noreply@omgees.tech>', 
            to: [email],
            subject: 'OMGees - Email Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333;">OMGees</h1>
                    </div>
                    
                    <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.5;">
                            Thank you for registering with OMGees! Please use the verification code below to complete your registration:
                        </p>
                        
                        <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                            <h1 style="color: #007bff; font-size: 36px; letter-spacing: 8px; margin: 0;">
                                ${code}
                            </h1>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you didn't request this code, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} OMGees. All rights reserved.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log(`✅ Verification code sent to: ${email}`);
        console.log(`📧 Email ID: ${data.id}`);
        
        res.json({ 
            success: true, 
            message: 'Verification code sent successfully' 
        });
    } catch (error) {
        console.error('❌ Email send error:', error);
        res.status(500).json({ 
            message: 'Failed to send verification code',
            error: error.message 
        });
    }
});

// Verify the code (no changes needed)
app.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
        return res.status(400).json({ 
            valid: false, 
            message: 'Email and code are required' 
        });
    }
    
    console.log(`🔍 Verifying code for: ${email}`);
    
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
        console.log('❌ No code found for email');
        return res.json({ 
            valid: false, 
            message: 'No verification code found. Please request a new code.' 
        });
    }
    
    if (Date.now() > storedData.expires) {
        console.log('❌ Code expired');
        verificationCodes.delete(email);
        return res.json({ 
            valid: false, 
            message: 'Verification code has expired. Please request a new code.' 
        });
    }
    
    if (storedData.code === code) {
        console.log('✅ Code verified successfully');
        verificationCodes.delete(email);
        return res.json({ 
            valid: true, 
            message: 'Email verified successfully' 
        });
    } else {
        console.log('❌ Invalid code');
        return res.json({ 
            valid: false, 
            message: 'Invalid verification code. Please try again.' 
        });
    }
});

// ========== INVOICE GENERATION ==========

const generateInvoicePDF = require('./generateInvoice');

// ========== USER AUTHENTICATION ==========

// Signup endpoint
app.post('/signup', (req, res) => {
    const sql = "INSERT INTO users (`fullname`, `email`, `contact`, `user_created`, `user_lastlogin` , `address`, `password`, `user_type`, `status`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.email,
        req.body.phone,
        req.body.user_created || new Date(),
        req.body.user_lastlogin || new Date(),
        req.body.address,
        req.body.password,
        req.body.user_type || 'customer',
        req.body.status || 'active'
    ];
    db.query(sql, [values], (err, data) => {
        if (err) {
            return res.json("Error");
        }
        return res.json(data);
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE `email` = ? AND `password` = ?";
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) {
            console.error('Login query error:', err);
            return res.json({ status: "Error", error: err.message });
        }
        if (data.length > 0) {
            const user = data[0];
            
            const updateSql = "UPDATE users SET user_lastlogin = NOW() WHERE user_id = ?";
            db.query(updateSql, [user.user_id], (err) => {
                if (err) console.error('Last login update error:', err);
            });
            
            return res.json({
                status: "Success",
                user_type: user.user_type,
                user: {
                    id: user.user_id,           
                    user_id: user.user_id,      
                    fullname: user.fullname,    
                    name: user.fullname,        
                    email: user.email,
                    contact: user.contact,
                    phone: user.contact,        
                    address: user.address,
                    user_type: user.user_type
                }
            });
        } else {
            return res.json({ status: "User not found" });
        }
    });
});

// Fetch all users
app.get('/users', (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching users" });
    }
    return res.json(data);
  });
});

// ========== ORDER ENDPOINTS ==========

// Online order endpoint
app.post('/online-order', upload.single('paymentProof'), (req, res) => {
    console.log('\n========================================');
    console.log('=== NEW ONLINE ORDER REQUEST ===');
    console.log('========================================');
    
    let order;
    try {
        if (!req.body.orderData) {
            console.error('❌ Missing orderData');
            return res.status(400).json({ error: "Missing order data" });
        }
        
        order = JSON.parse(req.body.orderData);
        console.log('✅ Order parsed successfully');
        console.log('📦 Order type:', order.type);
        console.log('👤 Customer:', order.customer?.name);
        console.log('💰 Total:', order.total);
        console.log('📦 Items:', order.items?.length, 'items');
        
        if (order.items && order.items.length > 0) {
            console.log('\n--- ITEMS DETAIL ---');
            order.items.forEach((item, idx) => {
                console.log(`Item ${idx + 1}:`, {
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                });
            });
        }
        
    } catch (e) {
        console.error('❌ Parse error:', e.message);
        console.error('Stack:', e.stack);
        return res.status(400).json({ error: "Invalid order format: " + e.message });
    }

    let items = order.items;
    if (!Array.isArray(items) || items.length === 0) {
        console.error('❌ No items in order');
        return res.status(400).json({ error: "No items in order" });
    }

    const paymentProofPath = req.file ? `/uploads/${req.file.filename}` : null;

    db.beginTransaction((err) => {
        if (err) {
            console.error('❌ Transaction error:', err.message);
            return res.status(500).json({ error: "Transaction failed: " + err.message });
        }

        console.log('\n📊 STEP 1: Checking stock availability...');
        
        const stockCheckPromises = items.map((item, idx) => {
            return new Promise((resolve, reject) => {
                console.log(`  Checking item ${idx + 1}: ID=${item.id}, Qty=${item.quantity}`);
                
                if (!item.id) {
                    console.error(`  ❌ Item ${idx + 1} has no ID!`, item);
                    return reject(new Error(`Item "${item.name}" is missing product ID`));
                }
                
                const checkSql = `
                    SELECT 
                        product_id,
                        product_name,
                        product_totalstock,
                        product_reservedstock,
                        (product_totalstock - product_reservedstock) as available_stock
                    FROM product 
                    WHERE product_id = ?
                `;
                
                db.query(checkSql, [item.id], (err, result) => {
                    if (err) {
                        console.error(`  ❌ SQL Error for item ${idx + 1}:`, err.message);
                        return reject(err);
                    }
                    
                    if (result.length === 0) {
                        console.error(`  ❌ Product not found: ID=${item.id}`);
                        return reject(new Error(`Product not found: ${item.name} (ID: ${item.id})`));
                    }
                    
                    const product = result[0];
                    const availableStock = product.available_stock;
                    
                    console.log(`  ✅ ${product.product_name}: Total=${product.product_totalstock}, Reserved=${product.product_reservedstock}, Available=${availableStock}, Requested=${item.quantity}`);
                    
                    if (availableStock < item.quantity) {
                        console.error(`  ❌ Insufficient stock!`);
                        return reject(new Error(
                            `Insufficient stock for ${product.product_name}. ` +
                            `Available: ${availableStock}, Requested: ${item.quantity}`
                        ));
                    }
                    
                    resolve(product);
                });
            });
        });

        Promise.all(stockCheckPromises)
            .then(() => {
                console.log('\n🔒 STEP 2: Reserving stock...');
                
                const reserveStockPromises = items.map((item, idx) => {
                    return new Promise((resolve, reject) => {
                        const reserveSql = `
                            UPDATE product 
                            SET product_reservedstock = product_reservedstock + ?
                            WHERE product_id = ?
                        `;
                        
                        console.log(`  Reserving ${item.quantity} units of product ID ${item.id}`);
                        
                        db.query(reserveSql, [item.quantity, item.id], (err, result) => {
                            if (err) {
                                console.error(`  ❌ Reserve error for item ${idx + 1}:`, err.message);
                                return reject(err);
                            }
                            console.log(`  ✅ Reserved ${item.quantity} units`);
                            resolve(result);
                        });
                    });
                });

                return Promise.all(reserveStockPromises);
            })
            .then(() => {
                console.log('\n📝 STEP 3: Creating order record...');
                
                const orderNumber = `ORD-${Date.now()}`;
                const customer = order.customer || {};
                const customerName = (customer.name || 'Guest').trim();
                const customerEmail = (customer.email || '').trim() || null;
                const customerPhone = (customer.contact || '').trim() || null;
                const customerAddress = (customer.address || '').trim() || null;

                const orderSql = `
                    INSERT INTO orders (
                        order_number, order_type, user_id, 
                        customer_name, customer_email, customer_phone, customer_address,
                        subtotal, shipping_fee, total, 
                        status, payment_method, payment_status, payment_proof, payment_reference,
                        shipping_method, order_notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const shipping = order.shipping || {};
                const payment = order.payment || {};
                const subtotal = order.total - (shipping.fee || 0);
                
                const orderValues = [
                    orderNumber,
                    order.type || 'online',
                    order.userId || null,
                    customerName,
                    customerEmail,
                    customerPhone,
                    customerAddress,
                    subtotal,
                    shipping.fee || 0,
                    order.total,
                    'pending',
                    payment.method || 'cash',
                    payment.method === 'cash' ? 'unpaid' : 'paid',
                    paymentProofPath,
                    payment.referenceNumber || null,
                    shipping.method || null,
                    order.notes || null
                ];

                db.query(orderSql, orderValues, async (err, orderResult) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('❌ Insert order error:', err.message);
                            res.status(500).json({ error: "Failed to create order: " + err.message });
                        });
                    }

                    const orderId = orderResult.insertId;
                    console.log(`✅ Order created with ID: ${orderId}`);

                    console.log('\n📦 STEP 4: Adding order items...');
                    
                    const orderItemSql = `
                        INSERT INTO order_items (
                            order_id, product_id, product_name, product_variant,
                            price, quantity, subtotal
                        ) VALUES ?
                    `;

                    const itemValues = items.map(item => [
                        orderId,
                        item.id,
                        item.name,
                        item.selectedVariant ? JSON.stringify(item.selectedVariant) : null,
                        item.price,
                        item.quantity,
                        item.price * item.quantity
                    ]);

                    db.query(orderItemSql, [itemValues], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('❌ Insert items error:', err.message);
                                res.status(500).json({ error: "Failed to add items: " + err.message });
                            });
                        }

                        console.log(`✅ Added ${items.length} items`);

                        const activitySql = `
                            INSERT INTO activity (activity, user, type, timestamp, details) 
                            VALUES (?, ?, ?, NOW(), ?)
                        `;

                        db.query(activitySql, [
                            'Created Order',
                            customerEmail || customerName,
                            'order',
                            `Order: ${orderNumber}, Total: ₱${order.total}, Status: pending (stock reserved)`
                        ], (err) => {
                            if (err) console.error('⚠️ Activity log error:', err.message);

                            db.commit(async(err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('❌ Commit error:', err.message);
                                        res.status(500).json({ error: "Commit failed: " + err.message });
                                    });
                                }

                                console.log('\n========================================');
                                console.log('✅ ORDER COMPLETE - STOCK RESERVED:', orderNumber);
                                console.log('========================================\n');
                                
                                const invoiceData = {
                                    orderNumber: orderNumber,
                                    orderType: order.type || 'online',
                                    customer: {
                                        name: customerName,
                                        email: customerEmail,
                                        phone: customerPhone,
                                        address: customerAddress
                                    },
                                    items: items,
                                    total: order.total,
                                    status: 'pending',
                                    timestamp: new Date().toISOString(),
                                    payment: {
                                        method: payment.method,
                                        status: payment.method === 'cash' ? 'unpaid' : 'paid'
                                    },
                                    shipping: shipping
                                };

                                // Generate invoice PDF
                                const invoicePath = `public/uploads/invoice-${orderNumber}.pdf`;
                                try {
                                    await generateInvoicePDF(invoiceData, invoicePath);
                                    console.log('📄 Invoice PDF generated');
                                    
                                    // Send invoice email if customer has email
                                    if (customerEmail) {
                                        await sendInvoiceEmail(invoiceData, invoicePath);
                                    }
                                } catch (error) {
                                    console.error('⚠️ Invoice generation/email error:', error);
                                    // Don't fail the order if invoice fails
                                }

                                return res.json({ 
                                    success: true,
                                    orderId: orderNumber,
                                    orderNumber: orderNumber,
                                    orderType: order.type || 'online',
                                    customer: {
                                        name: customerName,
                                        username: customerName,
                                        email: customerEmail,
                                        phone: customerPhone,
                                        address: customerAddress
                                    },
                                    items: items,
                                    total: order.total,
                                    status: 'pending',
                                    timestamp: new Date().toISOString(),
                                    date: new Date().toISOString(),
                                    payment: {
                                        method: payment.method,
                                        status: payment.method === 'cash' ? 'unpaid' : 'paid'
                                    },
                                    shipping: shipping,
                                    notes: order.notes,
                                    paymentProof: paymentProofPath
                                });
                            });
                        });
                    });
                });
            })
            .catch(err => {
                return db.rollback(() => {
                    console.error('\n========================================');
                    console.error('❌ OPERATION FAILED');
                    console.error('Error:', err.message);
                    console.error('Stack:', err.stack);
                    console.error('========================================\n');
                    
                    res.status(400).json({ 
                        error: err.message,
                        type: 'stock_unavailable'
                    });
                });
            });
    });
});

// Add order endpoint (POS system)
app.post('/add-order', (req, res) => {
    const order = req.body;
    
    console.log('=== IN-STORE ORDER REQUEST ===');
    
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        return res.status(400).json({ error: "No items in order" });
    }
    
    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction error:', err);
            return res.status(500).json({ error: "Transaction failed" });
        }
        
        const orderNumber = order.orderId || `ORD-${Date.now()}`;
        const cashierName = order.cashierName || 'Cashier';
        
        const subtotal = order.items.reduce((sum, item) => 
            sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
        );
        
        const orderSql = `
            INSERT INTO orders (
                order_number, order_type, user_id,
                customer_name, customer_email, customer_phone, customer_address,
                subtotal, shipping_fee, total,
                status, payment_method, payment_status,
                shipping_method, order_notes, cashier_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const orderValues = [
            orderNumber,
            'in-store',
            null,
            cashierName,
            null,
            null,
            null,
            subtotal,
            0,
            order.total || subtotal,
            order.status || 'completed',
            order.paymentMethod || 'cash',
            'paid',
            null,
            order.notes || null,
            cashierName
        ];
        
        db.query(orderSql, orderValues, (err, orderResult) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Order insert error:', err);
                    res.status(500).json({ error: "Failed to create order", details: err.message });
                });
            }
            
            const orderId = orderResult.insertId;
            
            const orderItemSql = `
                INSERT INTO order_items (
                    order_id, product_id, product_name, product_variant,
                    price, quantity, subtotal
                ) VALUES ?
            `;
            
            const itemValues = order.items.map(item => [
                orderId,
                item.id || item.product_id,
                item.name || item.product_name,
                item.variant ? JSON.stringify(item.variant) : null,
                item.price,
                item.quantity,
                item.price * item.quantity
            ]);
            
            db.query(orderItemSql, [itemValues], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Order items insert error:', err);
                        res.status(500).json({ error: "Failed to add order items", details: err.message });
                    });
                }
                
                const orderStatus = order.status || 'completed';
                
                if (orderStatus === 'completed') {
                    let updateCount = 0;
                    let hasError = false;
                    
                    order.items.forEach(item => {
                        const productId = item.id || item.product_id;
                        const quantity = item.quantity;
                        
                        const updateSql = `
                            UPDATE product 
                            SET 
                                product_totalstock = product_totalstock - ?,
                                product_totalsold = product_totalsold + ?
                            WHERE product_id = ?
                        `;
                        
                        db.query(updateSql, [quantity, quantity, productId], (err) => {
                            if (hasError) return;
                            
                            if (err) {
                                hasError = true;
                                return db.rollback(() => {
                                    console.error('Stock update error:', err);
                                    res.status(500).json({ error: "Stock update failed", details: err.message });
                                });
                            }
                            
                            updateCount++;
                            
                            if (updateCount === order.items.length && !hasError) {
                                completeOrder();
                            }
                        });
                    });
                } else {
                    completeOrder();
                }
                
                function completeOrder() {
                    const activitySql = `
                        INSERT INTO activity (activity, user, type, timestamp, details)
                        VALUES (?, ?, ?, NOW(), ?)
                    `;
                    
                    db.query(activitySql, [
                        'Created In-Store Order',
                        cashierName,
                        'order',
                        `Order: ${orderNumber}, Total: ₱${order.total || subtotal}, Status: ${orderStatus}`
                    ], (err) => {
                        if (err) console.error('Activity log error:', err);
                        
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Commit error:', err);
                                    res.status(500).json({ error: "Commit failed", details: err.message });
                                });
                            }
                            
                            res.json({
                                success: true,
                                orderId: orderNumber,
                                orderNumber: orderNumber,
                                message: 'Order created successfully'
                            });
                        });
                    });
                }
            });
        });
    });
});

// Get all orders
app.get('/manage-orders', (req, res) => {
    const { email } = req.query; 
    
    let sql = `
        SELECT 
            o.*,
            u.fullname as user_fullname,
            u.email as user_email,
            COUNT(DISTINCT oi.order_item_id) as unique_items,
            SUM(oi.quantity) as total_quantity,
            GROUP_CONCAT(
                CONCAT(
                    '{"product_name":"', REPLACE(oi.product_name, '"', '\\\\"'), '",',
                    '"quantity":', oi.quantity, ',',
                    '"price":', oi.price, ',',
                    '"subtotal":', oi.subtotal, '}'
                ) SEPARATOR ','
            ) as items_json
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
    `;
    
    if (email) {
        sql += ` WHERE (o.customer_email = ? OR o.user_id = (SELECT user_id FROM users WHERE email = ?))`;
    }
    
    sql += `
        GROUP BY o.order_id
        ORDER BY o.created_at DESC
    `;

    const queryParams = email ? [email, email] : [];

    db.query(sql, queryParams, (err, data) => {
        if (err) {
            console.error('Fetch orders error:', err);
            return res.status(500).json({ error: "Error fetching orders" });
        }

        const formattedOrders = data.map(order => ({
            orderId: order.order_number,
            order_id: order.order_id,
            orderType: order.order_type,
            type: order.order_type,
            customer: {
                name: order.customer_name,
                username: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone,
                address: order.customer_address
            },
            items: order.items_json ? JSON.parse(`[${order.items_json}]`) : [],
            uniqueItemCount: order.unique_items || 0,
            totalQuantity: order.total_quantity || 0,
            total: parseFloat(order.total),
            status: order.status,
            payment: {
                method: order.payment_method,
                status: order.payment_status,
                referenceNumber: order.payment_reference 
            },
            paymentProof: order.payment_proof,
            paymentProofData: order.payment_proof,
            timestamp: order.created_at,
            date: order.created_at,
            shipping: {
                method: order.shipping_method,
                fee: parseFloat(order.shipping_fee || 0)
            },
            notes: order.order_notes,
            cashierName: order.cashier_name
        }));

        res.json(formattedOrders);
    });
});

// Get customer orders
app.get('/customer/:userId/orders', (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            o.order_id,
            o.order_number,
            o.order_type,
            o.customer_name,
            o.customer_email,
            o.customer_phone,
            o.customer_address,
            o.subtotal,
            o.shipping_fee,
            o.total,
            o.status,
            o.payment_method,
            o.payment_status,
            o.payment_proof,
            o.shipping_method,
            o.order_notes,
            o.created_at,
            GROUP_CONCAT(
                CONCAT(
                    '{"product_id":', oi.product_id, ',',
                    '"product_name":"', REPLACE(oi.product_name, '"', '\\\\"'), '",',
                    '"price":', oi.price, ',',
                    '"quantity":', oi.quantity, ',',
                    '"subtotal":', oi.subtotal, '}'
                ) SEPARATOR ','
            ) as items_json,
            COUNT(DISTINCT oi.order_item_id) as item_count,
            SUM(oi.quantity) as total_quantity
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = ? AND o.order_type = 'online'
        GROUP BY o.order_id
        ORDER BY o.created_at DESC
    `;

    db.query(sql, [userId], (err, data) => {
        if (err) {
            console.error('Fetch customer orders error:', err);
            return res.status(500).json({ error: "Error fetching orders" });
        }
        
        const formattedOrders = data.map(order => ({
            orderId: order.order_number,
            order_id: order.order_id,
            orderType: order.order_type,
            type: order.order_type,
            customer: {
                name: order.customer_name,
                username: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone,
                address: order.customer_address
            },
            items: order.items_json ? JSON.parse(`[${order.items_json}]`) : [],
            itemCount: order.item_count || 0,
            totalQuantity: order.total_quantity || 0,
            total: parseFloat(order.total),
            subtotal: parseFloat(order.subtotal),
            status: order.status,
            payment: {
                method: order.payment_method,
                status: order.payment_status,
                referenceNumber: order.payment_reference
            },
            paymentProof: order.payment_proof,
            timestamp: order.created_at,
            date: order.created_at,
            shipping: {
                method: order.shipping_method,
                fee: parseFloat(order.shipping_fee || 0),
                name: order.shipping_method === 'pickup' ? 'Store Pickup' : 'Customer Arranged Delivery'
            },
            notes: order.order_notes
        }));
        
        res.json(formattedOrders);
    });
});

// Update order status
app.put('/order/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status input
    if (!status) {
        return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ['pending', 'verified', 'in-transit', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    console.log(`📝 Status update request: Order ${orderId} → ${status}`);

    const getOrderSql = `
        SELECT 
            o.order_id,
            o.order_number,
            o.order_type,
            o.status as current_status,
            oi.product_id,
            oi.quantity
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = ? OR o.order_number = ?
    `;

    db.query(getOrderSql, [orderId, orderId], (err, orderData) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (orderData.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        const currentOrder = orderData[0];
        const oldStatus = currentOrder.current_status;
        const orderType = currentOrder.order_type;
        const dbOrderId = currentOrder.order_id;

        console.log(`  Current: ${oldStatus} → New: ${status} (Type: ${orderType})`);

        // Validation rules
        if (orderType === 'online') {
            if (oldStatus === 'verified' && status === 'pending') {
                return res.status(400).json({ 
                    error: "Cannot change verified orders back to pending.",
                    success: false 
                });
            }
            
            if (status === 'cancelled' && oldStatus === 'cancelled') {
                return res.status(400).json({ 
                    error: "Order is already cancelled.",
                    success: false 
                });
            } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
                return res.status(400).json({ 
                    error: "Cannot change cancelled orders.",
                    success: false 
                });
            }
            
            if (oldStatus === 'pending' && status !== 'verified' && status !== 'pending' && status !== 'cancelled') {
                return res.status(400).json({ 
                    error: "Pending orders can only be changed to Verified or Cancelled.",
                    success: false 
                });
            }
        }

        const updateSql = "UPDATE orders SET status = ? WHERE order_id = ?";

        db.query(updateSql, [status, dbOrderId], (err, result) => {
            if (err) {
                console.error('Update error:', err);
                return res.status(500).json({ error: "Failed to update order status" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Order not found or status not changed" });
            }

            console.log(`✅ Order ${dbOrderId} status updated: ${oldStatus} → ${status}`);
            handleStockUpdate(oldStatus, status, orderData, dbOrderId, orderType, res);
        });
    });
});

// ADD THIS NEW ENDPOINT for status verification
app.get('/order/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    
    const sql = `
        SELECT order_id, order_number, status, order_type
        FROM orders 
        WHERE order_id = ? OR order_number = ?
    `;
    
    db.query(sql, [orderId, orderId], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        res.json({
            success: true,
            order: data[0]
        });
    });
});

function handleStockUpdate(oldStatus, newStatus, orderData, dbOrderId, orderType, res) {
    let operation = null;
    
    console.log(`🔄 Stock update: ${oldStatus} → ${newStatus} (${orderType})`);
    
    // For online orders with reserved stock system
    if (orderType === 'online') {
        // pending → verified: Move from reserved to sold (deduct from total, unreserve)
        if (oldStatus === 'pending' && newStatus === 'verified') {
            operation = 'verify';
            console.log('  📤 Operation: VERIFY (unreserve + deduct)');
        }
        // pending → cancelled: Release reserved stock
        else if (oldStatus === 'pending' && newStatus === 'cancelled') {
            operation = 'unreserve';
            console.log('  🔓 Operation: UNRESERVE (release reserved)');
        }
        // verified → cancelled: Restore stock completely
        else if (oldStatus === 'verified' && newStatus === 'cancelled') {
            operation = 'restore';
            console.log('  ↩️ Operation: RESTORE (add back to total)');
        }
    } else {
        // In-store logic (no reservation needed, instant)
        if (newStatus === 'completed' && oldStatus !== 'completed') {
            operation = 'deduct';
            console.log('  📉 Operation: DEDUCT (in-store)');
        } else if (oldStatus === 'completed' && newStatus !== 'completed') {
            operation = 'restore';
            console.log('  📈 Operation: RESTORE (in-store)');
        }
    }
    
    if (!operation) {
        console.log('  ℹ️ No stock operation needed');
        return finalizeStatusUpdate(dbOrderId, oldStatus, newStatus, res);
    }

    const stockUpdates = orderData.map(item => {
        return new Promise((resolve, reject) => {
            if (!item.product_id || !item.quantity) return resolve();

            let stockSql;
            
            switch(operation) {
                case 'verify':
                    // Unreserve AND deduct from total stock
                    stockSql = `
                        UPDATE product 
                        SET 
                            product_reservedstock = product_reservedstock - ?,
                            product_totalstock = product_totalstock - ?,
                            product_totalsold = product_totalsold + ?
                        WHERE product_id = ?
                    `;
                    db.query(stockSql, [item.quantity, item.quantity, item.quantity, item.product_id], (err) => {
                        if (err) reject(err);
                        else {
                            console.log(`    ✅ Product ${item.product_id}: Unreserved ${item.quantity}, Deducted from total`);
                            resolve();
                        }
                    });
                    break;
                    
                case 'unreserve':
                    // Just release reserved stock (cancel pending order)
                    stockSql = `
                        UPDATE product 
                        SET product_reservedstock = product_reservedstock - ?
                        WHERE product_id = ?
                    `;
                    db.query(stockSql, [item.quantity, item.product_id], (err) => {
                        if (err) reject(err);
                        else {
                            console.log(`    ✅ Product ${item.product_id}: Released ${item.quantity} from reserved`);
                            resolve();
                        }
                    });
                    break;
                    
                case 'restore':
                    // Restore stock completely (cancel verified order)
                    stockSql = `
                        UPDATE product 
                        SET 
                            product_totalstock = product_totalstock + ?,
                            product_totalsold = GREATEST(0, product_totalsold - ?)
                        WHERE product_id = ?
                    `;
                    db.query(stockSql, [item.quantity, item.quantity, item.product_id], (err) => {
                        if (err) reject(err);
                        else {
                            console.log(`    ✅ Product ${item.product_id}: Restored ${item.quantity} to total stock`);
                            resolve();
                        }
                    });
                    break;
                    
                case 'deduct':
                    // In-store: direct deduction
                    stockSql = `
                        UPDATE product 
                        SET 
                            product_totalstock = product_totalstock - ?,
                            product_totalsold = product_totalsold + ?
                        WHERE product_id = ?
                    `;
                    db.query(stockSql, [item.quantity, item.quantity, item.product_id], (err) => {
                        if (err) reject(err);
                        else {
                            console.log(`    ✅ Product ${item.product_id}: Deducted ${item.quantity}`);
                            resolve();
                        }
                    });
                    break;
                    
                default:
                    resolve();
            }
        });
    });

    Promise.all(stockUpdates)
        .then(() => {
            console.log('  ✅ All stock updates completed');
            finalizeStatusUpdate(dbOrderId, oldStatus, newStatus, res);
        })
        .catch(err => {
            console.error('  ❌ Stock update failed:', err.message);
            res.status(500).json({ error: "Stock update failed", details: err.message });
        });
}

function finalizeStatusUpdate(dbOrderId, oldStatus, newStatus, res) {
    // Verify the status was actually saved
    const verifySql = "SELECT status FROM orders WHERE order_id = ?";
    
    db.query(verifySql, [dbOrderId], (err, result) => {
        if (err) {
            console.error('Verification error:', err);
        } else if (result.length > 0) {
            console.log(`✅ Status verification: ${result[0].status}`);
        }

        const activitySql = "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)";

        db.query(activitySql, [
            'Updated Order Status',
            'admin',
            'order',
            `Order ID: ${dbOrderId}, Status changed: ${oldStatus} → ${newStatus}`
        ], (err) => {
            if (err) console.error('Activity log error:', err);

            res.json({ 
                success: true, 
                status: newStatus,
                oldStatus: oldStatus,
                orderId: dbOrderId,
                message: `Order status updated from ${oldStatus} to ${newStatus}`
            });
        });
    });
}

// Generate invoice PDF for viewing/printing (ManageOrder)
app.get('/generate-invoice/:orderId', async (req, res) => {
    const { orderId } = req.params;
    
    console.log('🔍 Generating invoice for order:', orderId);
    
    try {
        // Fetch order details
        const orderSql = `
            SELECT 
                o.*,
                GROUP_CONCAT(
                    CONCAT(
                        '{"product_name":"', REPLACE(oi.product_name, '"', '\\\\"'), '",',
                        '"quantity":', oi.quantity, ',',
                        '"price":', oi.price, ',',
                        '"subtotal":', oi.subtotal, '}'
                    ) SEPARATOR ','
                ) as items_json
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.order_id = ? OR o.order_number = ?
            GROUP BY o.order_id
        `;
        
        db.query(orderSql, [orderId, orderId], async (err, data) => {
            if (err) {
                console.error('❌ Database query error:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            
            if (!data || data.length === 0) {
                console.error('❌ Order not found:', orderId);
                return res.status(404).json({ error: 'Order not found' });
            }
            
            const order = data[0];
            console.log('✅ Order found:', order.order_number);
            
            const invoiceData = {
                orderNumber: order.order_number,
                orderType: order.order_type,
                customer: {
                    name: order.customer_name,
                    email: order.customer_email,
                    phone: order.customer_phone,
                    address: order.customer_address
                },
                items: order.items_json ? JSON.parse(`[${order.items_json}]`) : [],
                total: parseFloat(order.total),
                status: order.status,
                timestamp: order.created_at,
                payment: {
                    method: order.payment_method,
                    status: order.payment_status
                },
                shipping: {
                    method: order.shipping_method,
                    fee: parseFloat(order.shipping_fee || 0),
                    name: order.shipping_method === 'pickup' ? 'Store Pickup' : 'Customer Arranged Delivery'
                }
            };
            
            // Generate PDF
            const invoicePath = `public/uploads/invoice-${order.order_number}-${Date.now()}.pdf`;
            console.log('📝 Invoice path:', invoicePath);
            
            try {
                await generateInvoicePDF(invoiceData, invoicePath);
                console.log('✅ PDF generated, sending download...');
                
                // Send PDF file
                res.download(invoicePath, `Invoice-${order.order_number}.pdf`, (err) => {
                    if (err) {
                        console.error('❌ Download error:', err.message);
                    }
                    
                    // Delete file after download
                    setTimeout(() => {
                        if (fs.existsSync(invoicePath)) {
                            fs.unlinkSync(invoicePath);
                            console.log('🗑️ Cleaned up temporary PDF');
                        }
                    }, 1000);
                });
            } catch (error) {
                console.error('❌ PDF generation error:', error.message);
                res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
            }
        });
    } catch (error) {
        console.error('❌ Endpoint error:', error);
        res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
    }
});

// ========== INVENTORY ENDPOINTS ==========

app.get('/inventory', (req, res) => {
    console.log('📦 Fetching inventory...');
    
    const sql = `
        SELECT 
            *,
            COALESCE(product_reservedstock, 0) as product_reservedstock,
            (product_totalstock - COALESCE(product_reservedstock, 0)) as available_stock
        FROM product
    `;
    
    db.query(sql, (err, data) => {
        if (err) {
            console.error('❌ Inventory fetch error:', err.message);
            console.error('SQL:', sql);
            return res.status(500).json({ 
                error: "Error fetching inventory", 
                details: err.message 
            });
        }
        
        console.log(`✅ Fetched ${data.length} products`);
        
        const productsWithAvailability = data.map(product => ({
            ...product,
            available_stock: product.available_stock || 0,
            is_available: (product.available_stock || 0) > 0
        }));
        
        return res.json(productsWithAvailability);
    });
});

app.post('/add-product', upload.single('product_image'), (req, res) => {
    const {
        base_product_id,
        product_name,
        product_category,
        product_variant,
        product_totalstock,
        product_totalsold,
        product_description,
        product_supplier,
        product_price,
        product_status,
        last_restocked
    } = req.body;

    const product_image = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = "INSERT INTO product (`base_product_id`, `product_name`, `product_category`, `product_variant`, `product_totalstock`, `product_totalsold`, `product_description`, `product_supplier`, `product_price`, `product_status`, `last_restocked`, `product_image`) VALUES (?)";
    const values = [
        base_product_id,
        product_name,
        product_category,
        product_variant,
        product_totalstock,
        product_totalsold,
        product_description,
        product_supplier,
        product_price,
        product_status,
        last_restocked || null,
        product_image
    ];
    db.query(sql, [values], (err, data) => {
        if(err) {
            return res.json("Error");
        }
        return res.json(data);
    });
});

app.post('/re-stock', (req, res) => {
    const { product_id, new_stock } = req.body;
    const sql = "UPDATE product SET product_totalstock = ? WHERE product_id = ?";
    db.query(sql, [new_stock, product_id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to update stock" });
        }
        return res.json({ success: true });
    });
});

app.post('/update-stock', (req, res) => {
    const { product_id, updated_data } = req.body;
    const sql = "UPDATE product SET product_name = ?, product_category = ?, product_variant = ?, product_totalstock = ?, product_price = ?, product_description = ?, product_supplier = ?, product_totalsold = ? WHERE product_id = ?";
    const values = [
        updated_data.product_name,
        updated_data.product_category,
        updated_data.product_variant,
        updated_data.product_totalstock,
        updated_data.product_price,
        updated_data.product_description,
        updated_data.product_supplier,
        updated_data.product_totalsold,
        product_id
    ];
    db.query(sql, values, (err, data) => {
        if (err) {
            console.error('SQL error:', err);
            return res.status(500).json({ error: "Failed to update product" });
        }
        return res.json({ success: true });
    });
});

app.put('/archive-product/:productId', (req, res) => {
    const { productId } = req.params;
    const { archiveAll, baseProductId } = req.body;
    
    let sql, params;
    
    if (archiveAll && baseProductId) {
        sql = "UPDATE product SET product_status = 'inactive' WHERE base_product_id = ?";
        params = [baseProductId];
    } else {
        sql = "UPDATE product SET product_status = 'inactive' WHERE product_id = ?";
        params = [productId];
    }
    
    db.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Failed to archive product" });
        }
        
        const activitySql = "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)";
        
        db.query(activitySql, [
            'Archived Product',
            'inventory-staff',
            'inventory',
            `Product ID: ${productId}${archiveAll ? ' (All variants)' : ''}`
        ], (err) => {
            if (err) console.error('Activity log error:', err);
            res.json({ success: true, affectedRows: result.affectedRows });
        });
    });
});

app.put('/restore-product/:productId', (req, res) => {
    const { productId } = req.params;
    const { restoreAll, baseProductId } = req.body;
    
    let sql, params;
    
    if (restoreAll && baseProductId) {
        sql = "UPDATE product SET product_status = 'active' WHERE base_product_id = ?";
        params = [baseProductId];
    } else {
        sql = "UPDATE product SET product_status = 'active' WHERE product_id = ?";
        params = [productId];
    }
    
    db.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Failed to restore product" });
        }
        
        const activitySql = "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)";
        
        db.query(activitySql, [
            'Restored Product',
            'inventory-staff',
            'inventory',
            `Product ID: ${productId}${restoreAll ? ' (All variants)' : ''}`
        ], (err) => {
            if (err) console.error('Activity log error:', err);
            res.json({ success: true, affectedRows: result.affectedRows });
        });
    });
});

// ========== ADMIN ENDPOINTS ==========

app.get('/reports', (req, res) => {
    const sql = `
        SELECT 
            o.order_id,
            o.order_number,
            o.order_type,
            o.customer_name,
            o.total,
            o.status,
            o.created_at as date,
            o.payment_method,
            oi.order_item_id,
            oi.product_id,
            oi.product_name,
            oi.product_variant,
            oi.quantity,
            oi.price,
            oi.subtotal
        FROM orders o
        INNER JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.status = 'completed'
        ORDER BY o.created_at DESC
    `;
    
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching reports" });
        }
        
        const ordersMap = {};
        
        data.forEach(row => {
            const orderId = row.order_id;
            
            if (!ordersMap[orderId]) {
                ordersMap[orderId] = {
                    order_id: row.order_id,
                    order_number: row.order_number,
                    order_type: row.order_type,
                    type: row.order_type,
                    customer: {
                        name: row.customer_name
                    },
                    total: parseFloat(row.total),
                    status: row.status,
                    date: row.date,
                    timestamp: row.date,
                    payment: {
                        method: row.payment_method
                    },
                    items: []
                };
            }
            
            ordersMap[orderId].items.push({
                id: row.product_id,
                product_id: row.product_id,
                name: row.product_name,
                product_name: row.product_name,
                selectedVariant: row.product_variant ? JSON.parse(row.product_variant) : null,
                quantity: row.quantity,
                price: parseFloat(row.price),
                subtotal: parseFloat(row.subtotal)
            });
        });
        
        const orders = Object.values(ordersMap);
        return res.json(orders);
    });
});

app.post('/add-users', (req, res) => {
  const sql = "INSERT INTO users (`fullname`, `email`, `contact`, `address`, `password`, `user_type`, `status`, `user_created`) VALUES (?)";
  const values = [
    req.body.fullname,
    req.body.email,
    req.body.contact,
    req.body.address,
    req.body.password,
    req.body.user_type || 'customer',
    req.body.status || 'active',
    new Date()
  ];
  db.query(sql, [values], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error adding user" });
    }
    res.json({ 
      id: data.insertId,
      name: req.body.fullname,
      email: req.body.email,
      phone: req.body.contact,
      address: req.body.address,
      type: req.body.user_type || 'customer',
      status: req.body.status || 'active',
      createdDate: new Date(),
      lastLogin: null
    });
  });
});

app.post('/activity-log', (req, res) => {
    const sql = "INSERT INTO activity (`activity`, `user`, `type`, `timestamp`, `details`) VALUES (?)";
    const values = [
        req.body.activity,
        req.body.user,
        req.body.type,
        req.body.timestamp || new Date(),
        req.body.details || null
    ];
    db.query(sql, [values], (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to log activity" });
        }
        return res.json({ success: true });
    });
});

app.get('/activity', (req, res) => {
    const sql = "SELECT * FROM activity ORDER BY timestamp DESC";
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch activity logs" });
        }
        return res.json(data);
    });
});

// ========== SUPPLIER MANAGEMENT ENDPOINTS ==========
// These endpoints leverage existing product table data without a separate table

// Get all unique suppliers with product details
app.get('/suppliers', (req, res) => {
    const sql = `
        SELECT 
            product_supplier as supplier_name,
            COUNT(DISTINCT product_id) as product_count,
            COUNT(DISTINCT CASE WHEN product_status = 'active' THEN product_id END) as active_products,
            SUM(product_totalstock) as total_stock,
            MIN(product_price) as min_price,
            MAX(product_price) as max_price,
            GROUP_CONCAT(DISTINCT product_category) as categories
        FROM product
        WHERE product_supplier IS NOT NULL AND product_supplier != ''
        GROUP BY product_supplier
        ORDER BY product_supplier ASC
    `;
    
    db.query(sql, (err, data) => {
        if (err) {
            console.error('❌ Fetch suppliers error:', err.message);
            return res.status(500).json({ error: "Error fetching suppliers", details: err.message });
        }
        
        console.log(`✅ Fetched ${data.length} suppliers`);
        return res.json(data);
    });
});

// Get products by supplier
app.get('/suppliers/:supplierName/products', (req, res) => {
    const { supplierName } = req.params;
    const decodedSupplier = decodeURIComponent(supplierName);
    
    const sql = `
        SELECT 
            product_id,
            product_name,
            product_category,
            product_variant,
            product_totalstock,
            product_totalsold,
            product_price,
            product_description,
            product_status,
            product_image,
            product_supplier,
            (product_totalstock - COALESCE(product_reservedstock, 0)) as available_stock
        FROM product
        WHERE product_supplier = ?
        ORDER BY product_name ASC
    `;
    
    db.query(sql, [decodedSupplier], (err, data) => {
        if (err) {
            console.error('❌ Fetch supplier products error:', err.message);
            return res.status(500).json({ error: "Error fetching products" });
        }
        
        console.log(`✅ Fetched ${data.length} products for supplier: ${decodedSupplier}`);
        return res.json(data);
    });
});

// Get unique supplier names for dropdown
app.get('/supplier-list', (req, res) => {
    const sql = `
        SELECT DISTINCT product_supplier as name
        FROM product
        WHERE product_supplier IS NOT NULL AND product_supplier != ''
        ORDER BY product_supplier ASC
    `;
    
    db.query(sql, (err, data) => {
        if (err) {
            console.error('❌ Fetch supplier list error:', err.message);
            return res.status(500).json({ error: "Error fetching supplier list" });
        }
        
        const suppliers = data.map(row => row.name);
        console.log(`✅ Fetched supplier dropdown list: ${suppliers.length} items`);
        return res.json(suppliers);
    });
});

// Update supplier name across all products
app.put('/suppliers/:oldName/rename', (req, res) => {
    const { oldName } = req.params;
    const { newName } = req.body;
    const decodedOldName = decodeURIComponent(oldName);
    
    if (!newName || !newName.trim()) {
        return res.status(400).json({ error: "New supplier name is required" });
    }
    
    // Check if new name already exists
    const checkSql = "SELECT COUNT(*) as count FROM product WHERE product_supplier = ?";
    db.query(checkSql, [newName.trim()], (err, result) => {
        if (err) {
            console.error('❌ Check duplicate supplier error:', err.message);
            return res.status(500).json({ error: "Failed to check supplier name" });
        }
        
        if (result[0].count > 0 && newName.trim() !== decodedOldName) {
            return res.status(400).json({ error: "Supplier name already exists" });
        }
        
        const updateSql = "UPDATE product SET product_supplier = ? WHERE product_supplier = ?";
        db.query(updateSql, [newName.trim(), decodedOldName], (err, result) => {
            if (err) {
                console.error('❌ Update supplier name error:', err.message);
                return res.status(500).json({ error: "Failed to rename supplier" });
            }
            
            // Activity log
            db.query(
                "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)",
                [
                    'Renamed Supplier',
                    'admin',
                    'supplier',
                    `Supplier: ${decodedOldName} → ${newName.trim()}, Affected products: ${result.affectedRows}`
                ],
                (err) => {
                    if (err) console.error('⚠️ Activity log error:', err.message);
                }
            );
            
            console.log(`✅ Supplier renamed: ${decodedOldName} → ${newName.trim()} (${result.affectedRows} products)`);
            res.json({ 
                success: true, 
                oldName: decodedOldName,
                newName: newName.trim(),
                affectedProducts: result.affectedRows,
                message: `Supplier renamed successfully. ${result.affectedRows} products updated.`
            });
        });
    });
});

// Archive all products from a supplier
app.put('/suppliers/:supplierName/archive', (req, res) => {
    const { supplierName } = req.params;
    const decodedSupplier = decodeURIComponent(supplierName);
    
    const updateSql = "UPDATE product SET product_status = 'inactive' WHERE product_supplier = ?";
    db.query(updateSql, [decodedSupplier], (err, result) => {
        if (err) {
            console.error('❌ Archive supplier products error:', err.message);
            return res.status(500).json({ error: "Failed to archive supplier products" });
        }
        
        // Activity log
        db.query(
            "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)",
            [
                'Archived Supplier',
                'admin',
                'supplier',
                `Supplier: ${decodedSupplier}, Archived products: ${result.affectedRows}`
            ],
            (err) => {
                if (err) console.error('⚠️ Activity log error:', err.message);
            }
        );
        
        console.log(`✅ Supplier archived: ${decodedSupplier} (${result.affectedRows} products)`);
        res.json({ 
            success: true, 
            supplierName: decodedSupplier,
            archivedProducts: result.affectedRows,
            message: `All products from ${decodedSupplier} have been archived.`
        });
    });
});

// Restore all products from a supplier
app.put('/suppliers/:supplierName/restore', (req, res) => {
    const { supplierName } = req.params;
    const decodedSupplier = decodeURIComponent(supplierName);
    
    const updateSql = "UPDATE product SET product_status = 'active' WHERE product_supplier = ?";
    db.query(updateSql, [decodedSupplier], (err, result) => {
        if (err) {
            console.error('❌ Restore supplier products error:', err.message);
            return res.status(500).json({ error: "Failed to restore supplier products" });
        }
        
        // Activity log
        db.query(
            "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)",
            [
                'Restored Supplier',
                'admin',
                'supplier',
                `Supplier: ${decodedSupplier}, Restored products: ${result.affectedRows}`
            ],
            (err) => {
                if (err) console.error('⚠️ Activity log error:', err.message);
            }
        );
        
        console.log(`✅ Supplier restored: ${decodedSupplier} (${result.affectedRows} products)`);
        res.json({ 
            success: true, 
            supplierName: decodedSupplier,
            restoredProducts: result.affectedRows,
            message: `All products from ${decodedSupplier} have been restored.`
        });
    });
});

// Get supplier statistics
app.get('/suppliers/:supplierName/stats', (req, res) => {
    const { supplierName } = req.params;
    const decodedSupplier = decodeURIComponent(supplierName);
    
    const sql = `
        SELECT 
            COUNT(DISTINCT product_id) as total_products,
            COUNT(DISTINCT CASE WHEN product_status = 'active' THEN product_id END) as active_products,
            COUNT(DISTINCT CASE WHEN product_status = 'inactive' THEN product_id END) as archived_products,
            COUNT(DISTINCT product_category) as categories_count,
            SUM(product_totalstock) as total_stock,
            SUM(product_totalsold) as total_sold,
            AVG(product_price) as avg_price,
            MIN(product_price) as min_price,
            MAX(product_price) as max_price
        FROM product
        WHERE product_supplier = ?
    `;
    
    db.query(sql, [decodedSupplier], (err, data) => {
        if (err) {
            console.error('❌ Fetch supplier stats error:', err.message);
            return res.status(500).json({ error: "Error fetching supplier statistics" });
        }
        
        if (data.length === 0 || !data[0].total_products) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        
        console.log(`✅ Fetched stats for supplier: ${decodedSupplier}`);
        return res.json(data[0]);
    });
});

// ========== DELIVERY MANAGEMENT ENDPOINTS ==========

// Save delivery information (when cashier books a courier)
app.post('/save-delivery-info', (req, res) => {
    const {
        order_id,
        courier_service,
        tracking_number,
        estimated_delivery,
        delivery_fee,
        booked_by,
        booked_at
    } = req.body;

    if (!order_id || !courier_service || !tracking_number) {
        return res.status(400).json({ error: 'Missing required delivery information' });
    }

    const sql = `
        INSERT INTO delivery_info (
            order_id,
            courier_service,
            tracking_number,
            estimated_delivery,
            notes,
            booked_by,
            booked_at,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            courier_service = VALUES(courier_service),
            tracking_number = VALUES(tracking_number),
            estimated_delivery = VALUES(estimated_delivery),
            notes = VALUES(notes),
            booked_by = VALUES(booked_by),
            booked_at = VALUES(booked_at)
    `;

    const values = [
        order_id,
        courier_service,
        tracking_number,
        estimated_delivery,
        delivery_fee || 0,
        booked_by,
        booked_at
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('❌ Save delivery info error:', err);
            return res.status(500).json({ error: 'Failed to save delivery information' });
        }
        
        console.log('✅ Delivery info saved for order:', order_id);
        res.json({ success: true, message: 'Delivery information saved' });
    });
});

app.post('/send-delivery-notification', async (req, res) => {
    const {
        order_id,
        customer_email,
        customer_name,
        courier_service,
        tracking_number,
        estimated_delivery,
        order_number,
        delivery_fee
    } = req.body;

    if (!customer_email) {
        console.log('⚠️ No customer email provided');
        return res.status(400).json({ error: 'Customer email is required' });
    }

    try {
        const estimatedDate = new Date(estimated_delivery).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const { data, error } = await resend.emails.send({
            from: 'OMGees <noreply@omgees.tech>', 
            to: [customer_email],
            subject: `OMGees - Your Order is Out for Delivery! 📦`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333;">OMGees</h1>
                    </div>
                    
                    <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #1b3eefff; margin-bottom: 20px;">
                            📦 Your Order is Out for Delivery!
                        </h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.5;">
                            Hi ${customer_name},
                        </p>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.5;">
                            Great news! Your order has been picked up by our courier and is on its way to you.
                        </p>

                        <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <h3 style="color: #333; margin-top: 0;">Delivery Details</h3>
                            
                            <p style="margin: 10px 0; color: #666;">
                                <strong>Order Number:</strong> ${order_number}
                            </p>
                            
                            <p style="margin: 10px 0; color: #666;">
                                <strong>Courier Service:</strong> ${courier_service}
                            </p>
                            
                            <p style="margin: 10px 0; color: #666;">
                                <strong>Tracking Number:</strong> 
                                <code style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">
                                    ${tracking_number}
                                </code>
                            </p>
                            
                            <p style="margin: 10px 0; color: #666;">
                                <strong>Estimated Delivery:</strong> ${estimatedDate}
                            </p>
                            <p style="margin: 10px 0; color: #666;">
                                <strong>Shipping fee:</strong> ${delivery_fee ? '₱' + parseFloat(delivery_fee).toFixed(2) : ''}
                            </p>
                        </div>

                        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="color: #333; margin: 0;">
                                <strong>📱 Track Your Order</strong><br/>
                                <small style="color: #666;">
                                    Log in to your OMGees account and visit "Track Your Orders" to monitor your delivery in real-time.
                                </small>
                            </p>
                        </div>

                        <p style="color: #666; font-size: 14px;">
                            If you have any questions about your delivery, please contact us at:<br/>
                            📞 +63 906 512 8417<br/>
                            📧 omgeesbakerysupplies@gmail.com
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} OMGees. All rights reserved.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log(`✅ Delivery notification sent to: ${customer_email}`);
        console.log(`📧 Email ID: ${data.id}`);
        
        res.json({ success: true, message: 'Notification email sent' });
    } catch (error) {
        console.error('❌ Email send error:', error);
        res.status(500).json({ 
            error: 'Failed to send notification email',
            details: error.message
        });
    }
});

// Get delivery information for an order
app.get('/delivery-info/:orderId', (req, res) => {
    const { orderId } = req.params;

    const sql = `
        SELECT * FROM delivery_info 
        WHERE order_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `;

    db.query(sql, [orderId], (err, data) => {
        if (err) {
            console.error('❌ Fetch delivery info error:', err);
            return res.status(500).json({ error: 'Failed to fetch delivery information' });
        }

        if (data.length === 0) {
            return res.json({ success: false, message: 'No delivery information found' });
        }

        res.json({ success: true, deliveryInfo: data[0] });
    });
});

// Update order status to "completed" when customer confirms delivery
app.put('/order/:orderId/mark-received', (req, res) => {
    const { orderId } = req.params;

    console.log(`📬 Marking order as received: ${orderId}`);

    const getOrderSql = `
        SELECT 
            o.order_id,
            o.order_number,
            o.status,
            o.customer_email,
            o.customer_name,
            oi.product_id,
            oi.quantity
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = ? OR o.order_number = ?
    `;

    db.query(getOrderSql, [orderId, orderId], (err, orderData) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (orderData.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentOrder = orderData[0];
        const dbOrderId = currentOrder.order_id;

        // Only allow completion of in-transit orders
        if (currentOrder.status !== 'in-transit') {
            return res.status(400).json({
                error: `Cannot mark as received. Order status is ${currentOrder.status}`,
                success: false
            });
        }

        const updateSql = "UPDATE orders SET status = 'completed' WHERE order_id = ?";

        db.query(updateSql, [dbOrderId], (err, result) => {
            if (err) {
                console.error('Update error:', err);
                return res.status(500).json({ error: 'Failed to update order status' });
            }

            console.log(`✅ Order marked as received: ${currentOrder.order_number}`);

            // Log activity
            const activitySql = "INSERT INTO activity (activity, user, type, timestamp, details) VALUES (?, ?, ?, NOW(), ?)";

            db.query(activitySql, [
                'Order Marked as Received',
                'customer',
                'order',
                `Order: ${currentOrder.order_number}, Status: in-transit → completed`
            ], (err) => {
                if (err) console.error('Activity log error:', err);
            });

            res.json({
                success: true,
                status: 'completed',
                orderId: dbOrderId,
                orderNumber: currentOrder.order_number,
                message: 'Order marked as received'
            });
        });
    });
});

// Basic route
app.get("/", (req, res) => {

})

// Start the server
app.listen(5000, () => {
    console.log("Server started on Port 5000");
})