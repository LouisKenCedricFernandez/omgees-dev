const express = require("express");
const mysql = require("mysql");

const app = express();
app.use(express.json()); // <-- Add this line
// ...existing code...

const cors = require('cors');
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database:'OMGees-test'
})

app.post('/signup', (req, res) => {
    const sql = "INSERT INTO users (`name`, `email`, `password`) VALUES (?)"
    const values = [
        req.body.name,
        req.body.email,
        req.body.password

    ]
    db.query(sql, [values], (err, data) => {
        if(err) {
            return res.json("Error")
        }
        return res.json(data)
    })
})

app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE `email` = ? AND `password` = ?"
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if(err) {
            return res.json("Error")
        }
        if(data.length > 0) {
            return res.json("Success")
        } else {
            return res.json("User not found")
        }
    })
})

app.post('/payment', (req, res) => {

    const { userId, amount } = req.body;

    const sql = "INSERT INTO payments (`user_id`, `amount`) VALUES (?)"
    const values = [
        userId,
        amount
    ]

    db.query(sql, [values], (err, data) => {
        if(err) {
            return res.json("Error")
        }
        return res.json(data)
    })
})

app.post('/payment-history', (req, res) => {

    const { userId } = req.body;

    const sql = "SELECT * FROM payments WHERE `user_id` = ?"

    db.query(sql, [userId], (err, data) => {
        if(err) {
            return res.json("Error")
        }
        return res.json(data)
    })
})

app.post('/cart', (req, res) => {

    const { userId, productId, quantity } = req.body;
    const sql = "INSERT INTO cart (`user_id`, `product_id`, `quantity`) VALUES (?)"
    const values = [
        userId,
        productId,
        quantity
    ]
    db.query(sql, [values], (err, data) => {
        if(err) {
            return res.json("Error")
        }
        return res.json(data)
    })
})

app.get('/inventory', (req, res) => {
    const sql = "SELECT * FROM product";
    db.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error fetching inventory" });
        }
        return res.json(data);
    });
});

app.post('/add-product', (req, res) => {
    const sql = "INSERT INTO product (`product_name`, `product_category`, `product_variant`, `product_totalstock`, `product_totalsold`, `product_description`, `product_supplier`, `product_price`, `product_status`) VALUES (?)"
    const values = [
        req.body.product_name,
        req.body.product_category,
        req.body.product_variant,
        req.body.product_totalstock,
        req.body.product_totalsold,
        req.body.product_description,
        req.body.product_supplier,
        req.body.product_price,
        req.body.product_status
    ]
    db.query(sql, [values], (err, data) => {
        if(err) {
            return res.json("Error")
        }
        return res.json(data)
    }
    )
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

app.post('/update-product', (req, res) => {
    const { product_id, updated_data } = req.body;
    const sql = "UPDATE product SET ? WHERE product_id = ?";
    db.query(sql, [updated_data, product_id], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to update product" });
        }
        return res.json({ success: true });
    });
});

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

app.get("/", (req, res) => {
    res.send("<h1>Backend API</h1>")
})


app.listen(5000, () => {
 console.log("Server started on Port 5000");
})