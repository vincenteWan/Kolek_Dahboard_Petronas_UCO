const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS to allow frontend requests
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database configuration for XAMPP
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kolek_dashboard',
    socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to get connection
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Database connection error:', error);
        throw new Error('Database connection failed');
    }
}

async function getAdminColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM Admin');
    return cols.map(c => c.Field);
}

function pickAdminIdColumn(columns) {
    const preferred = columns.find(c => /^admin_id$/i.test(c))
        || columns.find(c => /^adminid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /admin/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickFirstExisting(columns, candidates) {
    const lower = columns.map(c => c.toLowerCase());
    for (const name of candidates) {
        const idx = lower.indexOf(name.toLowerCase());
        if (idx !== -1) return columns[idx];
    }
    return null;
}

// API endpoint for Household data
app.get('/api/household', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Household');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching household data:', error);
        res.status(500).json({ error: 'Failed to fetch household data', details: error.message });
    }
});

// API endpoint for Collector data
app.get('/api/collector', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Collector');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching collector data:', error);
        res.status(500).json({ error: 'Failed to fetch collector data', details: error.message });
    }
});

// API endpoint for Application data
app.get('/api/application', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Application');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching application data:', error);
        res.status(500).json({ error: 'Failed to fetch application data', details: error.message });
    }
});

// API endpoint for Station data
app.get('/api/station', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Station');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching station data:', error);
        res.status(500).json({ error: 'Failed to fetch station data', details: error.message });
    }
});

// API endpoint for Campaign data
app.get('/api/campaign', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Campaign');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching campaign data:', error);
        res.status(500).json({ error: 'Failed to fetch campaign data', details: error.message });
    }
});

// API endpoint for Admin data
app.get('/api/admin', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Admin');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).json({ error: 'Failed to fetch admin data', details: error.message });
    }
});

// Admin login (default password: password123)
app.post('/api/admin/login', async (req, res) => {
    const { adminId, password } = req.body || {};
    if (!adminId || !password) {
        return res.status(400).json({ success: false, message: 'Missing credentials' });
    }
    if (password !== 'password123') {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        const [rows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        connection.release();
        if (!rows || rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }
        return res.json({ success: true, admin: rows[0] });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ success: false, message: 'Login failed', details: error.message });
    }
});

// Get single admin by ID
app.get('/api/admin/:id', async (req, res) => {
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        const [rows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [req.params.id]);
        connection.release();
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching admin by ID:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch admin', details: error.message });
    }
});

// Update admin by ID
app.put('/api/admin/:id', async (req, res) => {
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        const fieldMap = {
            fullName: pickFirstExisting(columns, ['adminName', 'name', 'fullName', 'fullname', 'adminFullName']),
            email: pickFirstExisting(columns, ['emailAddress', 'email', 'adminEmail', 'email_address']),
            phone: pickFirstExisting(columns, ['phoneNumber', 'phone', 'adminPhone', 'contactNumber', 'phone_number']),
            phoneCode: pickFirstExisting(columns, ['phoneCode', 'phone_code', 'adminPhoneCode']),
            gender: pickFirstExisting(columns, ['gender', 'adminGender', 'sex'])
        };

        const updates = [];
        const values = [];

        if (fieldMap.fullName && req.body?.fullName !== undefined) {
            updates.push(`\`${fieldMap.fullName}\` = ?`);
            values.push(req.body.fullName);
        }
        if (fieldMap.email && req.body?.email !== undefined) {
            updates.push(`\`${fieldMap.email}\` = ?`);
            values.push(req.body.email);
        }
        if (fieldMap.phone && req.body?.phone !== undefined) {
            updates.push(`\`${fieldMap.phone}\` = ?`);
            values.push(req.body.phone);
        }
        if (fieldMap.phoneCode && req.body?.phoneCode !== undefined) {
            updates.push(`\`${fieldMap.phoneCode}\` = ?`);
            values.push(req.body.phoneCode);
        }
        if (fieldMap.gender && req.body?.gender !== undefined) {
            updates.push(`\`${fieldMap.gender}\` = ?`);
            values.push(req.body.gender);
        }

        if (updates.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No updatable fields found' });
        }

        values.push(req.params.id);
        const sql = `UPDATE Admin SET ${updates.join(', ')} WHERE \`${idCol}\` = ?`;
        await connection.execute(sql, values);

        const [rows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [req.params.id]);
        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error updating admin:', error);
        return res.status(500).json({ success: false, message: 'Failed to update admin', details: error.message });
    }
});

// API endpoint for Reward data
app.get('/api/reward', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Reward');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching reward data:', error);
        res.status(500).json({ error: 'Failed to fetch reward data', details: error.message });
    }
});

// API endpoint for Report data
app.get('/api/report', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Report');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ error: 'Failed to fetch report data', details: error.message });
    }
});

// API endpoint for AccidentReport data
app.get('/api/accidentreport', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM AccidentReport');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching accident report data:', error);
        res.status(500).json({ error: 'Failed to fetch accident report data', details: error.message });
    }
});

// API endpoint for ManualReport data
app.get('/api/manualreport', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM ManualReport');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching manual report data:', error);
        res.status(500).json({ error: 'Failed to fetch manual report data', details: error.message });
    }
});

// API endpoint for CollectionReport data
// API endpoint for Collection data
app.get('/api/collection', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Collection ORDER BY collectionDate ASC, requestTime ASC');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching collection data:', error);
        res.status(500).json({ error: 'Failed to fetch collection data', details: error.message });
    }
});

app.get('/api/collectionreport', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM CollectionReport');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching collection report data:', error);
        res.status(500).json({ error: 'Failed to fetch collection report data', details: error.message });
    }
});

// API endpoint for StationDeposit data
app.get('/api/stationdeposit', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM StationDeposit');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching station deposit data:', error);
        res.status(500).json({ error: 'Failed to fetch station deposit data', details: error.message });
    }
});

// API endpoint for RewardRedemption data
app.get('/api/rewardredemption', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM RewardRedemption');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching reward redemption data:', error);
        res.status(500).json({ error: 'Failed to fetch reward redemption data', details: error.message });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const connection = await getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        res.json({ status: 'ok', message: 'Database connection successful' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Database connection failed', details: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints ready for dashboard data`);
});
