const express = require("express");
const mysql = require("mysql");
const multer = require('multer');
const path = require('path');

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
    database:'OMGees-test'
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
            cb(null, 'public/uploads/'); // Specify the directory to store images
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
        }
    });

// Middleware to handle image uploads
const upload = multer({ storage: storage });

// Connect to the database signup and login
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

// Online order endpoint

app.post('/online-order', (req, res) => {
  const order = req.body;
  // Parse items if they are sent as a JSON string
  let items = order.items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch (e) {
      return res.status(400).json({ error: "Invalid items format" });
    }
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: "Transaction start failed" });
    }

    const sql = "INSERT INTO orders (type, customer, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [
      order.type || order.orderType || "online",
      order.customer || order.cashierName || "",
      JSON.stringify(items),
      order.total,
      order.status || "pending",
      order.date || order.timestamp
    ];

    db.query(sql, values, (err, data) => {
      if (err) {
        return db.rollback(() => {
          console.error('Order insert error:', err);
          res.status(500).json({ error: "Order insert failed" });
        });
      }

      // Update stock and sold for each item
      let updateCount = 0;
      let hasError = false;

      if (!Array.isArray(items) || items.length === 0) {
        // No items, just commit
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: "Commit failed" });
            });
          }
          res.json({ success: true, data });
        });
        return;
      }

      items.forEach(item => {
        // item.id or item.product_id, item.quantity
        const productId = item.id || item.product_id;
        const quantity = Number(item.quantity) || 1;
        const updateSql = `
          UPDATE product 
          SET 
            product_totalstock = product_totalstock - ?, 
            product_totalsold = product_totalsold + ?
          WHERE product_id = ?`;

        db.query(updateSql, [quantity, quantity, productId], (err, result) => {
          if (hasError) return; // Prevent multiple responses
          if (err) {
            hasError = true;
            return db.rollback(() => {
              console.error('Stock/sold update error:', err);
              res.status(500).json({ error: "Stock/sold update failed" });
            });
          }
          updateCount++;
          if (updateCount === items.length && !hasError) {
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: "Commit failed" });
                });
              }
              res.json({ success: true, data });
            });
          }
        });
      });
    });
  });
});


// Add a new user (used by admin)
app.post('/add-users', (req, res) => {
  const sql = "INSERT INTO users (`fullname`, `email`, `contact`, `address`, `password`, `user_type`, `status`) VALUES (?)";
  const values = [
    req.body.fullname,
    req.body.email,
    req.body.contact,
    req.body.address,
    req.body.password,
    req.body.user_type || 'customer',
    req.body.status || 'active'
  ];
  db.query(sql, [values], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error adding user" });
    }
    // Return the new user (with the inserted id)
    res.json({ id: data.insertId, ...req.body });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE `email` = ? AND `password` = ?";
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) {
            return res.json("Error");
        }
        if (data.length > 0) {
            // Return user type and other info as needed
            return res.json({
                status: "Success",
                user_type: data[0].user_type,
                user: {
                    id: data[0].id,
                    name: data[0].name,
                    email: data[0].email,
                    // ...add other fields as needed
                }
            });
        } else {
            return res.json({ status: "User not found" });
        }
    });
});

// manage orders endpoint
app.get('/manage-orders', (req, res) => {
  const sql = "SELECT * FROM orders ORDER BY date DESC";  
  db.query(sql, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching orders" });
    }
    return res.json(data);
  });
});

// Update stock endpoint
app.post('/update-stock', (req, res) => {
    const { product_id, updated_data } = req.body;
    console.log('Received update:', product_id, updated_data);
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

// Reports endpoint
app.get('/reports', (req, res) => {
  const sql = "SELECT * FROM orders WHERE status = 'completed'";
  db.query(sql, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching reports" });
    }
    return res.json(data);
  });
});

// Add order endpoint (used by POS system)
app.post('/add-order', (req, res) => {
  const order = req.body;
  const sql = "INSERT INTO orders (order_id, type, customer, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [
    order.orderId,
    order.orderType || "in-store", // or order.userId
    order.cashierName,
    JSON.stringify(order.items),
    order.total,
    order.status,
    order.timestamp
  ];
  db.query(sql, values, (err, data) => {
    if (err) {
      console.error('Order insert error:', err);
      return res.json("Error");
    }
    return res.json({ success: true, data });
  });
});

// Inventory endpoints
app.get('/inventory', (req, res) => {
    const sql = "SELECT * FROM product";
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching inventory" });
        }
        return res.json(data);
    });
});


// Add product endpoint with image upload
app.post('/add-product', upload.single('product_image'), (req, res) => {
    // Get product data from the form fields
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

    // Get image path if uploaded
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

// Restock product endpoint
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

// Update product endpoint
app.post('/update-product', (req, res) => {
    
    const { product_id, updated_data } = req.body;
    console.log('Received update:', product_id, updated_data);
    const sql = "UPDATE product SET product_name = ?, product_category = ?, product_variant = ?, product_totalstock = ?, product_price = ?, product_description = ?, product_supplier = ?, product_totalsold = ? WHERE product_id = ?";
    db.query(sql, values, (err, data) => {
  if (err) {
    console.error('SQL error:', err); // <-- Add this
    return res.status(500).json({ error: "Failed to update product" });
  }
  return res.json({ success: true });
});
});

// Fetch products by category
app.get('/ingredients', (req, res) => {
    const sql = "SELECT * FROM product WHERE product_category = 'ingredients'";
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching ingredients" });
        }
        return res.json(data);
    });
});

app.get('/tools', (req, res) => {
    const sql = "SELECT * FROM product WHERE product_category = 'tools'";
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching tools" });
        }
        return res.json(data);
    });
});

app.get('/packaging', (req, res) => {
    const sql = "SELECT * FROM product WHERE product_category = 'packaging'";
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching packaging" });
        }
        return res.json(data);
    });
});


// Basic route
app.get("/", (req, res) => {
    res.send("<h1>Backend API</h1>")
})

// Start the server
app.listen(5000, () => {
 console.log("Server started on Port 5000");
})