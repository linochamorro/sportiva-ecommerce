const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS simple
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Root
app.get('/', (req, res) => {
    res.json({ message: 'Sportiva API' });
});

// Test DB
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./src/config/database');
        const [rows] = await pool.query('SELECT 1 as test');
        res.json({ success: true, db: 'connected', result: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
