// server.js - Complete Electricity Billing System
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Database connection (PostgreSQL for cloud, falls back to SQLite for testing)
let pool;

// Try PostgreSQL, fallback to SQLite
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  console.log('✅ Using PostgreSQL database');
} catch (error) {
  console.log('⚠️ Using SQLite (local testing)');
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./billing.db');
  
  pool = {
    query: (text, params) => {
      return new Promise((resolve, reject) => {
        let sql = text.replace(/\$(\d+)/g, '?');
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows });
        });
      });
    }
  };
  
  // Create SQLite tables
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      address TEXT,
      contact_number TEXT,
      email TEXT,
      meter_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'Active'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS meter_readings (
      reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      previous_reading REAL,
      current_reading REAL,
      consumption REAL,
      reading_date TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bills (
      bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      reading_id INTEGER,
      billing_period TEXT,
      amount REAL,
      due_date TEXT,
      status TEXT DEFAULT 'Unpaid',
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      payment_date TEXT,
      amount_paid REAL,
      payment_method TEXT,
      receipt_number TEXT,
      FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
    )`);
    console.log('✅ SQLite tables created');
  });
}

// ============ CUSTOMERS CRUD ============
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY customer_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  console.log('📝 Received customer data:', req.body);
  
  const { fullname, address, contact_number, email, meter_number, status } = req.body;
  
  // Check if required fields are present
  if (!fullname || !meter_number) {
    console.log('❌ Missing required fields!');
    return res.status(400).json({ error: 'Full name and meter number are required' });
  }
  
  try {
    console.log('💾 Inserting customer into database...');
    const result = await pool.query(
      'INSERT INTO customers (fullname, address, contact_number, email, meter_number, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [fullname, address, contact_number, email, meter_number, status || 'Active']
    );
    console.log('✅ Customer added successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('❌ Full error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { fullname, address, contact_number, email, meter_number, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE customers SET fullname=$1, address=$2, contact_number=$3, email=$4, meter_number=$5, status=$6 WHERE customer_id=$7 RETURNING *',
      [fullname, address, contact_number, email, meter_number, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE customer_id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ READINGS CRUD ============
app.get('/api/readings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.fullname, c.meter_number 
      FROM meter_readings r
      JOIN customers c ON r.customer_id = c.customer_id
      ORDER BY r.reading_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/readings', async (req, res) => {
  const { customer_id, previous_reading, current_reading, reading_date } = req.body;
  const consumption = parseFloat(current_reading) - parseFloat(previous_reading);
  try {
    const result = await pool.query(
      'INSERT INTO meter_readings (customer_id, previous_reading, current_reading, consumption, reading_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_id, previous_reading, current_reading, consumption, reading_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/readings/:id', async (req, res) => {
  const { id } = req.params;
  const { previous_reading, current_reading, reading_date } = req.body;
  const consumption = parseFloat(current_reading) - parseFloat(previous_reading);
  try {
    const result = await pool.query(
      'UPDATE meter_readings SET previous_reading=$1, current_reading=$2, consumption=$3, reading_date=$4 WHERE reading_id=$5 RETURNING *',
      [previous_reading, current_reading, consumption, reading_date, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/readings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM meter_readings WHERE reading_id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ BILLS CRUD ============
app.get('/api/bills', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.fullname, c.meter_number 
      FROM bills b
      JOIN customers c ON b.customer_id = c.customer_id
      ORDER BY b.bill_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  const { customer_id, reading_id, billing_period, amount, due_date, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO bills (customer_id, reading_id, billing_period, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id, reading_id, billing_period, amount, due_date, status || 'Unpaid']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  const { id } = req.params;
  const { billing_period, amount, due_date, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE bills SET billing_period=$1, amount=$2, due_date=$3, status=$4 WHERE bill_id=$5 RETURNING *',
      [billing_period, amount, due_date, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM bills WHERE bill_id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PAYMENTS CRUD ============
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.bill_id, c.fullname, b.amount as bill_amount
      FROM payments p
      JOIN bills b ON p.bill_id = b.bill_id
      JOIN customers c ON b.customer_id = c.customer_id
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const { bill_id, payment_date, amount_paid, payment_method, receipt_number } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO payments (bill_id, payment_date, amount_paid, payment_method, receipt_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [bill_id, payment_date, amount_paid, payment_method, receipt_number]
    );
    // Update bill status to Paid
    await pool.query('UPDATE bills SET status=$1 WHERE bill_id=$2', ['Paid', bill_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  const { id } = req.params;
  const { payment_date, amount_paid, payment_method, receipt_number } = req.body;
  try {
    const result = await pool.query(
      'UPDATE payments SET payment_date=$1, amount_paid=$2, payment_method=$3, receipt_number=$4 WHERE payment_id=$5 RETURNING *',
      [payment_date, amount_paid, payment_method, receipt_number, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get bill_id before deleting
    const billResult = await pool.query('SELECT bill_id FROM payments WHERE payment_id=$1', [id]);
    if (billResult.rows.length > 0) {
      const billId = billResult.rows[0].bill_id;
      await pool.query('DELETE FROM payments WHERE payment_id=$1', [id]);
      // Update bill status back to Unpaid
      await pool.query('UPDATE bills SET status=$1 WHERE bill_id=$2', ['Unpaid', billId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ REPORTS ============
app.get('/api/reports/summary', async (req, res) => {
  try {
    const customers = await pool.query('SELECT COUNT(*) FROM customers');
    const unpaid = await pool.query("SELECT COUNT(*) FROM bills WHERE status = 'Unpaid'");
    const paid = await pool.query("SELECT COUNT(*) FROM bills WHERE status = 'Paid'");
    const revenue = await pool.query('SELECT COALESCE(SUM(amount_paid), 0) FROM payments');
    res.json({
      totalCustomers: parseInt(customers.rows[0].count),
      unpaidBills: parseInt(unpaid.rows[0].count),
      paidBills: parseInt(paid.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].coalesce)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/monthly', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        strftime('%Y-%m', payment_date) as month,
        SUM(amount_paid) as total
      FROM payments
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month DESC
      LIMIT 6
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 System ready - Electricity Billing Management`);
});