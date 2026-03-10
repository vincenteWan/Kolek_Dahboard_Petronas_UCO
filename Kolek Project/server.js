require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const https = require('https');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

const app = express();
const PORT = 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCUbKxJmeVbFM0bqsvEdCQ1B5Hv7cyjmS4';

// Resend configuration for 2FA email delivery
let resendClient = null;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev';

function initResendClient() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('Warning: RESEND_API_KEY is not set. 2FA codes will be logged to console only.');
        return;
    }

    try {
        resendClient = new Resend(key);
        console.log('✓ Resend client initialized');
    } catch (err) {
        console.warn('Warning: Resend client initialization failed. 2FA codes will be logged to console only.', err.message);
    }
}

// Call this to initialize Resend client on startup
initResendClient();

const KOLEK_AI_SYSTEM_PROMPT = [
    'You are KolekBot, the AI assistant for the Kolek web dashboard.',
    'Stay strictly focused on Kolek features, pages, and workflows.',
    'Answer with clear, step-by-step guidance that an admin can follow in the dashboard UI.',
    'If a request is unrelated to Kolek, respond that you can only help with the Kolek system.',
    'Do not invent features. If unsure, ask a brief clarifying question about the Kolek page or entity.',
    'Avoid any destructive or irreversible actions without explicit admin confirmation.',
    'Example: if asked how to deactivate a collector, instruct: open Collector page, find the collector in the table (search or filter), click Deactivate in the Actions column, and confirm if prompted; verify the status shows Inactive.'
].join(' ');

async function callGemini(prompt) {
    const maxAttempts = 3;
    const baseDelay = 800; // ms

    const bodyPayload = {
        systemInstruction: { parts: [{ text: KOLEK_AI_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    };

    const path = `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const body = JSON.stringify(bodyPayload);
            const options = {
                method: 'POST',
                hostname: 'generativelanguage.googleapis.com',
                path,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const result = await new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => resolve({ statusCode: res.statusCode, data }));
                });
                req.on('error', reject);
                req.write(body);
                req.end();
            });

            if (result.statusCode && result.statusCode >= 400) {
                const err = new Error(`Gemini API error: ${result.statusCode}`);
                err.statusCode = result.statusCode;
                // Retry on 429 with backoff
                if (result.statusCode === 429 && attempt < maxAttempts) {
                    const backoff = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
                    await new Promise(r => setTimeout(r, backoff));
                    continue;
                }
                throw err;
            }

            const parsed = result.data ? JSON.parse(result.data) : {};
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return (text || '').trim();
        } catch (err) {
            // If upstream rate-limited, retry; otherwise rethrow
            if (err && err.statusCode === 429 && attempt < maxAttempts) {
                const backoff = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
                await new Promise(r => setTimeout(r, backoff));
                continue;
            }
            throw err;
        }
    }

    const error = new Error('Gemini API rate limited');
    error.statusCode = 429;
    throw error;
}

// Enable CORS to allow frontend requests
app.use(cors());
app.use(express.json());
const API_KEYS = (process.env.API_KEYS || process.env.API_KEY || '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);

if (API_KEYS.length === 0) {
    console.warn('API key protection is disabled. Set API_KEY or API_KEYS to enable it.');
}

function isValidApiKey(req) {
    const provided = req.get('x-api-key') || req.query.api_key;
    return Boolean(provided && API_KEYS.includes(provided));
}

app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (API_KEYS.length === 0) return next();
    if (!isValidApiKey(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
});
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
    }
}));

// Database configuration for XAMPP
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'kolek_ecosystem',
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

async function ensureSecurityQuestionColumns() {
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        
        if (!columns.includes('security_questions')) {
            console.log('Adding security_questions column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN security_questions LONGTEXT DEFAULT NULL');
        }
        
        if (!columns.includes('security_answers')) {
            console.log('Adding security_answers column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN security_answers LONGTEXT DEFAULT NULL');
        }

        if (!pickAdminPasswordColumn(columns)) {
            console.log('Adding password column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN `password` VARCHAR(255) DEFAULT NULL');
        }
        
        connection.release();
        console.log('✓ Security question columns initialized');
    } catch (error) {
        console.warn('Warning: Could not initialize security question columns:', error.message);
        // Don't throw - this might fail if columns already exist or due to permissions
    }
}

async function ensure2FAColumns() {
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        
        if (!columns.includes('twoFactorCode')) {
            console.log('Adding twoFactorCode column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN twoFactorCode VARCHAR(6) DEFAULT NULL');
        }
        
        if (!columns.includes('twoFactorCodeExpiry')) {
            console.log('Adding twoFactorCodeExpiry column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN twoFactorCodeExpiry DATETIME DEFAULT NULL');
        }

        if (!columns.includes('twoFactorEmail')) {
            console.log('Adding twoFactorEmail column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN twoFactorEmail VARCHAR(255) DEFAULT NULL');
        }

        if (!columns.includes('twoFactorEnabled')) {
            console.log('Adding twoFactorEnabled column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN twoFactorEnabled TINYINT(1) DEFAULT 1');
        }

        if (!columns.includes('tempTwoFactorToken')) {
            console.log('Adding tempTwoFactorToken column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN tempTwoFactorToken VARCHAR(255) DEFAULT NULL');
        }

        if (!columns.includes('tempTwoFactorTokenExpiry')) {
            console.log('Adding tempTwoFactorTokenExpiry column to Admin table...');
            await connection.execute('ALTER TABLE Admin ADD COLUMN tempTwoFactorTokenExpiry DATETIME DEFAULT NULL');
        }
        
        connection.release();
        console.log('✓ 2FA columns initialized');
    } catch (error) {
        console.warn('Warning: Could not initialize 2FA columns:', error.message);
        // Don't throw - this might fail if columns already exist or due to permissions
    }
}

async function getRewardColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM Reward');
    return cols.map(c => c.Field);
}

async function getCollectorColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM Collector');
    return cols.map(c => c.Field);
}

async function getHouseholdColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM Household');
    return cols.map(c => c.Field);
}

async function getApplicationColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM Application');
    return cols.map(c => c.Field);
}

async function getAccidentReportColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM AccidentReport');
    return cols.map(c => c.Field);
}

async function getCollectionReportColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM CollectionReport');
    return cols.map(c => c.Field);
}

async function getManualReportColumns(connection) {
    const [cols] = await connection.execute('SHOW COLUMNS FROM ManualReport');
    return cols.map(c => c.Field);
}

async function getTableColumns(connection, tableName) {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
    return cols.map(c => c.Field);
}

// Activity Logging Helper Function
async function logActivity(connection, adminId, action, resource, details = {}) {
    try {
        const timestamp = new Date();
        const query = `INSERT INTO AdminActivityLog (adminID, action, resource, details, timestamp) 
                      VALUES (?, ?, ?, ?, ?)`;
        await connection.execute(query, [adminId, action, resource, JSON.stringify(details), timestamp]);
    } catch (error) {
        // If table doesn't exist, create it and retry
        if (error.code === 'ER_NO_SUCH_TABLE') {
            try {
                const createTableQuery = `
                    CREATE TABLE IF NOT EXISTS AdminActivityLog (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        adminID VARCHAR(50) NOT NULL,
                        action VARCHAR(100) NOT NULL,
                        resource VARCHAR(100),
                        details JSON,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_admin (adminID),
                        INDEX idx_timestamp (timestamp)
                    )`;
                await connection.execute(createTableQuery);
                // Retry the insert
                await connection.execute(`INSERT INTO AdminActivityLog (adminID, action, resource, details, timestamp) 
                                           VALUES (?, ?, ?, ?, ?)`, 
                                         [adminId, action, resource, JSON.stringify(details), timestamp]);
            } catch (createError) {
                console.error('Failed to create AdminActivityLog table:', createError);
            }
        } else {
            console.error('Failed to log activity:', error);
        }
    }
}

function pickAdminIdColumn(columns) {
    const preferred = columns.find(c => /^admin_id$/i.test(c))
        || columns.find(c => /^adminid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /admin/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickAdminPasswordColumn(columns) {
    const preferred = pickFirstExisting(columns, [
        'password',
        'adminPassword',
        'admin_password',
        'passwordHash',
        'password_hash',
        'passwd'
    ]);
    return preferred;
}

const BCRYPT_SALT_ROUNDS = 12;

function isBcryptHash(value) {
    return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

function hashAdminPassword(plainPassword) {
    return bcrypt.hashSync(String(plainPassword), BCRYPT_SALT_ROUNDS);
}

function verifyAdminPassword(inputPassword, storedPassword) {
    const input = String(inputPassword || '');
    const stored = String(storedPassword || '');
    if (!stored) return false;
    if (isBcryptHash(stored)) {
        return bcrypt.compareSync(input, stored);
    }
    return input === stored;
}

// 2FA Helper Functions
function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateTempToken() {
    return bcrypt.hashSync(Date.now().toString() + Math.random().toString(), 8);
}

async function sendTwoFactorEmail(email, code, adminName = 'Admin') {
    try {
        if (!resendClient) {
            console.warn('⚠️  Resend client not configured. 2FA Code for', email, ':', code);
            return true; // Return success but just log to console
        }

        const mailOptions = {
            from: RESEND_FROM_EMAIL,
            to: email,
            subject: 'Kolek Dashboard - Two Factor Authentication Code',
            html: `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 4px 4px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 4px 4px; }
                        .code-box { background-color: #fff; border: 2px solid #007bff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px; }
                        .code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 2px; }
                        .footer { margin-top: 20px; font-size: 12px; color: #666; }
                        .warning { color: #ff6b6b; font-size: 12px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Kolek Dashboard</h2>
                        </div>
                        <div class="content">
                            <p>Hello ${adminName},</p>
                            <p>Your login attempt has been recognized. To complete the login process and ensure account security, please use the following one-time verification code:</p>
                            <div class="code-box">
                                <div class="code">${code}</div>
                            </div>
                            <p><strong>Please note:</strong></p>
                            <ul>
                                <li>This code will expire in 10 minutes</li>
                                <li>Do not share this code with anyone</li>
                                <li>If you did not attempt to log in, please ignore this email</li>
                            </ul>
                            <div class="footer">
                                <p>This is an automated message from Kolek Dashboard. Please do not reply to this email.</p>
                                <p class="warning">If you did not request this code, someone may be trying to access your account. Please change your password immediately.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const result = await resendClient.emails.send(mailOptions);
        if (result?.error) {
            throw new Error(result.error.message || 'Resend email send failed');
        }

        console.log('✓ 2FA code sent to email:', email);
        return true;
    } catch (error) {
        console.error('Failed to send 2FA email:', error.message);
        // Still log to console as fallback
        console.log('⚠️  2FA Code for', email, ':', code);
        return false;
    }
}

function pickRewardIdColumn(columns) {
    const preferred = columns.find(c => /^reward_id$/i.test(c))
        || columns.find(c => /^rewardid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /reward/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickCollectorIdColumn(columns) {
    const preferred = columns.find(c => /^collector_id$/i.test(c))
        || columns.find(c => /^collectorid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /collector/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickHouseholdIdColumn(columns) {
    const preferred = columns.find(c => /^household_id$/i.test(c))
        || columns.find(c => /^householdid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /household/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickApplicationIdColumn(columns) {
    const preferred = columns.find(c => /^application_id$/i.test(c))
        || columns.find(c => /^applicationid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /application/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickCollectionIdColumn(columns) {
    const preferred = columns.find(c => /^collection_id$/i.test(c))
        || columns.find(c => /^collectionid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /collection/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickReportIdColumn(columns) {
    const preferred = columns.find(c => /^report_id$/i.test(c))
        || columns.find(c => /^reportid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /report/i.test(c) && /id/i.test(c));
    return preferred || columns[0];
}

function pickStationIdColumn(columns) {
    const preferred = pickFirstExisting(columns, ['stationID', 'stationId', 'station_id', 'id']);
    return preferred || columns[0];
}

function pickStationDepositIdColumn(columns) {
    const preferred = pickFirstExisting(columns, ['stationDepositID', 'stationDepositId', 'station_deposit_id', 'depositID', 'depositId', 'deposit_id', 'id']);
    return preferred || columns[0];
}

function pickCampaignIdColumn(columns) {
    const preferred = pickFirstExisting(columns, ['campaignID', 'campaignId', 'campaign_id', 'id']);
    return preferred || columns[0];
}

function pickRewardRedemptionIdColumn(columns) {
    const preferred = pickFirstExisting(columns, ['rewardRedemptionID', 'rewardRedemptionId', 'reward_redemption_id', 'redemptionID', 'redemptionId', 'redemption_id', 'id']);
    return preferred || columns[0];
}

function normalizeReportId(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim().replace(/^#/, '');
}

async function generateNextCollectorId(connection, idCol) {
    const [rows] = await connection.execute(`SELECT \`${idCol}\` AS id FROM Collector`);
    let maxNum = 0;
    for (const row of rows) {
        const raw = row.id;
        const match = String(raw || '').match(/(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!Number.isNaN(num)) maxNum = Math.max(maxNum, num);
        }
    }
    const nextNum = maxNum + 1;
    return `C-${String(nextNum).padStart(3, '0')}`;
}

async function generateNextCollectionId(connection, idCol) {
    const [rows] = await connection.execute(`SELECT \`${idCol}\` AS id FROM Collection`);
    let maxNum = 0;
    for (const row of rows) {
        const raw = row.id;
        const match = String(raw || '').match(/(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!Number.isNaN(num)) maxNum = Math.max(maxNum, num);
        }
    }
    const nextNum = maxNum + 1;
    return `CR-${String(nextNum).padStart(3, '0')}`;
}

function formatDateTime(value) {
    const dt = value instanceof Date ? value : new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    const year = dt.getFullYear();
    const month = pad(dt.getMonth() + 1);
    const day = pad(dt.getDate());
    const hours = pad(dt.getHours());
    const minutes = pad(dt.getMinutes());
    const seconds = pad(dt.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function pickFirstExisting(columns, candidates) {
    const lower = columns.map(c => c.toLowerCase());
    for (const name of candidates) {
        const idx = lower.indexOf(name.toLowerCase());
        if (idx !== -1) return columns[idx];
    }
    return null;
}

const CRUD_ENTITIES = {
    household: {
        table: 'Household',
        getColumns: getHouseholdColumns,
        pickIdColumn: pickHouseholdIdColumn
    },
    collector: {
        table: 'Collector',
        getColumns: getCollectorColumns,
        pickIdColumn: pickCollectorIdColumn
    },
    application: {
        table: 'Application',
        getColumns: getApplicationColumns,
        pickIdColumn: pickApplicationIdColumn
    },
    collection: {
        table: 'Collection',
        getColumns: connection => getTableColumns(connection, 'Collection'),
        pickIdColumn: pickCollectionIdColumn
    },
    reward: {
        table: 'Reward',
        getColumns: getRewardColumns,
        pickIdColumn: pickRewardIdColumn
    },
    report: {
        table: 'Report',
        getColumns: connection => getTableColumns(connection, 'Report'),
        pickIdColumn: pickReportIdColumn
    },
    accidentreport: {
        table: 'AccidentReport',
        getColumns: getAccidentReportColumns,
        pickIdColumn: pickReportIdColumn
    },
    collectionreport: {
        table: 'CollectionReport',
        getColumns: getCollectionReportColumns,
        pickIdColumn: pickReportIdColumn
    },
    manualreport: {
        table: 'ManualReport',
        getColumns: getManualReportColumns,
        pickIdColumn: pickReportIdColumn
    },
    rewardredemption: {
        table: 'RewardRedemption',
        getColumns: connection => getTableColumns(connection, 'RewardRedemption'),
        pickIdColumn: pickRewardRedemptionIdColumn
    },
    station: {
        table: 'Station',
        getColumns: connection => getTableColumns(connection, 'Station'),
        pickIdColumn: pickStationIdColumn
    },
    stationdeposit: {
        table: 'StationDeposit',
        getColumns: connection => getTableColumns(connection, 'StationDeposit'),
        pickIdColumn: pickStationDepositIdColumn
    },
    campaign: {
        table: 'Campaign',
        getColumns: connection => getTableColumns(connection, 'Campaign'),
        pickIdColumn: pickCampaignIdColumn
    },
    admin: {
        table: 'Admin',
        getColumns: getAdminColumns,
        pickIdColumn: pickAdminIdColumn
    }
};

function resolveCrudEntity(key) {
    const normalized = String(key || '').toLowerCase();
    return CRUD_ENTITIES[normalized];
}

app.get('/api/health', async (req, res) => {
    try {
        const connection = await getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        return res.json({ ok: true, db: 'up' });
    } catch (error) {
        console.error('Health check failed:', error);
        return res.status(500).json({ ok: false, db: 'down', error: error.message });
    }
});

app.get('/api/crud/:entity', async (req, res) => {
    const meta = resolveCrudEntity(req.params.entity);
    if (!meta) return res.status(404).json({ error: 'Unknown entity' });
    const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10), 1), 500);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(
            `SELECT * FROM ${meta.table} LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        connection.release();
        return res.json(rows);
    } catch (error) {
        console.error('CRUD list error:', error);
        return res.status(500).json({ error: 'Failed to fetch records', details: error.message });
    }
});

app.get('/api/crud/:entity/:id', async (req, res) => {
    const meta = resolveCrudEntity(req.params.entity);
    if (!meta) return res.status(404).json({ error: 'Unknown entity' });
    try {
        const connection = await getConnection();
        const columns = await meta.getColumns(connection);
        const idCol = meta.pickIdColumn(columns);
        const [rows] = await connection.execute(
            `SELECT * FROM ${meta.table} WHERE \`${idCol}\` = ? LIMIT 1`,
            [req.params.id]
        );
        connection.release();
        return res.json(rows[0] || null);
    } catch (error) {
        console.error('CRUD get error:', error);
        return res.status(500).json({ error: 'Failed to fetch record', details: error.message });
    }
});

app.post('/api/crud/:entity', async (req, res) => {
    const meta = resolveCrudEntity(req.params.entity);
    if (!meta) return res.status(404).json({ error: 'Unknown entity' });
    const payload = req.body || {};
    try {
        const connection = await getConnection();
        const columns = await meta.getColumns(connection);
        const insertColumns = columns.filter(col => payload[col] !== undefined);
        if (insertColumns.length === 0) {
            connection.release();
            return res.status(400).json({ error: 'No valid fields to insert' });
        }
        const placeholders = insertColumns.map(() => '?').join(', ');
        const values = insertColumns.map(col => payload[col]);
        await connection.execute(
            `INSERT INTO ${meta.table} (${insertColumns.map(col => `\`${col}\``).join(', ')}) VALUES (${placeholders})`,
            values
        );
        connection.release();
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error('CRUD create error:', error);
        return res.status(500).json({ error: 'Failed to create record', details: error.message });
    }
});

app.put('/api/crud/:entity/:id', async (req, res) => {
    const meta = resolveCrudEntity(req.params.entity);
    if (!meta) return res.status(404).json({ error: 'Unknown entity' });
    const payload = req.body || {};
    try {
        const connection = await getConnection();
        const columns = await meta.getColumns(connection);
        const idCol = meta.pickIdColumn(columns);
        const updateColumns = columns.filter(col => col !== idCol && payload[col] !== undefined);
        if (updateColumns.length === 0) {
            connection.release();
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        const setClause = updateColumns.map(col => `\`${col}\` = ?`).join(', ');
        const values = updateColumns.map(col => payload[col]);
        values.push(req.params.id);
        await connection.execute(
            `UPDATE ${meta.table} SET ${setClause} WHERE \`${idCol}\` = ?`,
            values
        );
        connection.release();
        return res.json({ success: true });
    } catch (error) {
        console.error('CRUD update error:', error);
        return res.status(500).json({ error: 'Failed to update record', details: error.message });
    }
});

app.delete('/api/crud/:entity/:id', async (req, res) => {
    const meta = resolveCrudEntity(req.params.entity);
    if (!meta) return res.status(404).json({ error: 'Unknown entity' });
    try {
        const connection = await getConnection();
        const columns = await meta.getColumns(connection);
        const idCol = meta.pickIdColumn(columns);
        await connection.execute(
            `DELETE FROM ${meta.table} WHERE \`${idCol}\` = ?`,
            [req.params.id]
        );
        connection.release();
        return res.json({ success: true });
    } catch (error) {
        console.error('CRUD delete error:', error);
        return res.status(500).json({ error: 'Failed to delete record', details: error.message });
    }
});

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

// Update household status
app.put('/api/household/:id', async (req, res) => {
    try {
        const { status } = req.body || {};
        if (status === undefined) {
            return res.status(400).json({ success: false, message: 'Missing status' });
        }

        const connection = await getConnection();
        const columns = await getHouseholdColumns(connection);
        const idCol = pickHouseholdIdColumn(columns);
        const statusCol = pickFirstExisting(columns, ['accountStatus', 'account_status', 'status']);

        if (!statusCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No status column found' });
        }

        const rawId = String(req.params.id || '').trim();
        await connection.execute(`UPDATE Household SET \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`, [status, rawId]);
        let [rows] = await connection.execute(`SELECT * FROM Household WHERE \`${idCol}\` = ? LIMIT 1`, [rawId]);

        if ((!rows || rows.length === 0) && rawId && !rawId.startsWith('#')) {
            const prefixed = `#${rawId}`;
            await connection.execute(`UPDATE Household SET \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`, [status, prefixed]);
            [rows] = await connection.execute(`SELECT * FROM Household WHERE \`${idCol}\` = ? LIMIT 1`, [prefixed]);
        }

        // Log activity
        const adminId = req.body?.adminId;
        if (adminId && rows && rows.length > 0) {
            const householdName = rows[0].householdName || rows[0].name || rawId;
            await logActivity(connection, adminId, 'Update Status', 'Household', { householdId: rawId, newStatus: status, householdName: householdName });
        }

        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error updating household status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update household status', details: error.message });
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

// Update collector status
app.put('/api/collector/:id', async (req, res) => {
    try {
        const { status, adminId } = req.body || {};
        if (status === undefined) {
            return res.status(400).json({ success: false, message: 'Missing status' });
        }

        const connection = await getConnection();
        const columns = await getCollectorColumns(connection);
        const idCol = pickCollectorIdColumn(columns);
        const statusCol = pickFirstExisting(columns, ['accountStatus', 'account_status', 'status']);

        if (!statusCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No status column found' });
        }

        await connection.execute(`UPDATE Collector SET \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`, [status, req.params.id]);
        const [rows] = await connection.execute(`SELECT * FROM Collector WHERE \`${idCol}\` = ? LIMIT 1`, [req.params.id]);
        
        // Log activity
        if (adminId) {
            const collegeName = rows[0] && (rows[0].collectorName || rows[0].name) ? (rows[0].collectorName || rows[0].name) : req.params.id;
            await logActivity(connection, adminId, 'Update Status', 'Collector', { collectorId: req.params.id, newStatus: status, collectorName: collegeName });
        }
        
        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error updating collector status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update collector status', details: error.message });
    }
});

// API endpoint for Application data
app.get('/api/application', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM Application');

        // Convert any Buffer/BLOB/base64 image columns into data-URLs so the
        // frontend can display IC images directly. Also normalize filename/path
        // values into a reachable static URL.
        const sniffImageMime = (buf) => {
            if (!buf || buf.length < 4) return null;
            // JPEG: FF D8 FF
            if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
            // PNG: 89 50 4E 47
            if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
            // GIF: 47 49 46 38
            if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
            // WEBP: RIFF....WEBP
            if (
                buf.length >= 12 &&
                buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
                buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
            ) return 'image/webp';
            return null;
        };

        const looksLikeImageFilename = (s) => /\.(png|jpe?g|gif|webp)$/i.test(s);

        const normalizeToImageSrc = (val) => {
            if (val === null || val === undefined) return null;

            // 1) Already a data URL
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (/^data:image\//i.test(trimmed)) return trimmed;

                // 2) Base64-only string (very common for BLOBs stored as base64)
                if (trimmed.length > 200 && /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed)) {
                    const cleaned = trimmed.replace(/\s+/g, '');
                    // Decode only a small prefix to sniff the mime, to avoid large allocations.
                    const prefix = cleaned.slice(0, 80);
                    let mime = null;
                    try {
                        const head = Buffer.from(prefix, 'base64');
                        mime = sniffImageMime(head);
                    } catch (e) {
                        mime = null;
                    }
                    return `data:${mime || 'image/png'};base64,${cleaned}`;
                }

                // 3) Filename or relative path
                if (trimmed && trimmed.length <= 512 && looksLikeImageFilename(trimmed)) {
                    // Support values like "Naufiq.png" or "uploads/Naufiq.png".
                    const normalized = trimmed.replace(/\\/g, '/');
                    if (/^https?:\/\//i.test(normalized) || normalized.startsWith('/')) return normalized;
                    if (normalized.startsWith('uploads/')) return `/${normalized}`;

                    // Prefer whichever file actually exists.
                    try {
                        const inRoot = path.join(__dirname, normalized);
                        const inUploads = path.join(__dirname, 'uploads', normalized);
                        if (fs.existsSync(inRoot)) return `/${normalized}`;
                        if (fs.existsSync(inUploads)) return `/uploads/${normalized}`;
                    } catch (e) {
                        // ignore
                    }
                    // Fallback to root.
                    return `/${normalized}`;
                }

                return null;
            }

            // 4) Raw Buffer
            if (Buffer.isBuffer(val)) {
                const mime = sniffImageMime(val) || 'image/png';
                return `data:${mime};base64,${val.toString('base64')}`;
            }

            // 5) Transported Buffer shape
            if (val && typeof val === 'object' && val.type === 'Buffer' && Array.isArray(val.data)) {
                try {
                    const buf = Buffer.from(val.data);
                    const mime = sniffImageMime(buf) || 'image/png';
                    return `data:${mime};base64,${buf.toString('base64')}`;
                } catch (e) {
                    return null;
                }
            }

            return null;
        };

        try {
            for (const row of rows) {
                for (const key of Object.keys(row)) {
                    const normalizedSrc = normalizeToImageSrc(row[key]);
                    if (normalizedSrc) row[key] = normalizedSrc;
                }
            }
        } catch (e) {
            console.warn('Failed to normalize image fields for applications:', e && e.message);
        }
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching application data:', error);
        res.status(500).json({ error: 'Failed to fetch application data', details: error.message });
    }
});

// Approve application -> update status, assign collector/admin, create collector
app.post('/api/application/:id/approve', async (req, res) => {
    const { adminId } = req.body || {};
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        const appColumns = await getApplicationColumns(connection);
        const appIdCol = pickApplicationIdColumn(appColumns);
        const appStatusCol = pickFirstExisting(appColumns, ['applicationStatus', 'status', 'application_status']);
        const appCollectorIdCol = pickFirstExisting(appColumns, ['collectorID', 'collectorId', 'collector_id']);
        const appAdminIdCol = pickFirstExisting(appColumns, ['adminID', 'adminId', 'admin_id']);

        if (!appStatusCol || !appCollectorIdCol || !appAdminIdCol) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing application columns' });
        }

        const [appRows] = await connection.execute(`SELECT * FROM Application WHERE \`${appIdCol}\` = ? LIMIT 1`, [req.params.id]);
        if (!appRows || appRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const application = appRows[0];
        const statusRaw = application[appStatusCol] || '';
        const statusLower = String(statusRaw).toLowerCase();
        if (!statusLower.includes('pending')) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'Application is not pending' });
        }

        const collectorColumns = await getCollectorColumns(connection);
        const collectorIdCol = pickCollectorIdColumn(collectorColumns);
        const collectorNameCol = pickFirstExisting(collectorColumns, ['collectorName', 'name', 'fullName', 'fullname', 'collector_name']);
        const collectorPhoneCol = pickFirstExisting(collectorColumns, ['phoneNumber', 'phone', 'phone_number', 'contactNumber', 'contact_number']);
        const collectorEmailCol = pickFirstExisting(collectorColumns, ['emailAddress', 'email', 'email_address']);
        const collectorDobCol = pickFirstExisting(collectorColumns, ['dateOfBirth', 'dob', 'birthDate', 'date_of_birth']);
        const collectorVehicleTypeCol = pickFirstExisting(collectorColumns, ['vehicleType', 'vehicle', 'vehicle_type']);
        const collectorPlateCol = pickFirstExisting(collectorColumns, ['vehiclePlateNumber', 'vehiclePlate', 'plateNumber', 'vehicle_plate_number']);
        const collectorAreaCol = pickFirstExisting(collectorColumns, ['preferredCollectionArea', 'preferredArea', 'preferred_collection_area']);
        const collectorAvailabilityCol = pickFirstExisting(collectorColumns, ['availability', 'availabilityStatus', 'availability_status']);
        const collectorStatusCol = pickFirstExisting(collectorColumns, ['accountStatus', 'status', 'account_status']);

        const appNameCol = pickFirstExisting(appColumns, ['applicantName', 'name', 'fullName', 'fullname', 'applicant_name']);
        const appPhoneCol = pickFirstExisting(appColumns, ['phoneNumber', 'phone', 'phone_number', 'contactNumber', 'contact_number']);
        const appEmailCol = pickFirstExisting(appColumns, ['emailAddress', 'email', 'email_address']);
        const appDobCol = pickFirstExisting(appColumns, ['dateOfBirth', 'dob', 'birthDate', 'date_of_birth']);
        const appVehicleTypeCol = pickFirstExisting(appColumns, ['vehicleType', 'vehicle', 'vehicle_type']);
        const appPlateCol = pickFirstExisting(appColumns, ['vehiclePlateNumber', 'vehiclePlate', 'plateNumber', 'vehicle_plate_number']);
        const appAreaCol = pickFirstExisting(appColumns, ['preferredCollectionArea', 'preferredArea', 'preferred_collection_area']);
        const appAvailabilityCol = pickFirstExisting(appColumns, ['availability', 'availabilityStatus', 'availability_status']);

        const newCollectorId = await generateNextCollectorId(connection, collectorIdCol);

        const insertCols = [];
        const insertVals = [];
        if (collectorIdCol) { insertCols.push(`\`${collectorIdCol}\``); insertVals.push(newCollectorId); }
        if (collectorNameCol && appNameCol) { insertCols.push(`\`${collectorNameCol}\``); insertVals.push(application[appNameCol] || ''); }
        if (collectorPhoneCol && appPhoneCol) { insertCols.push(`\`${collectorPhoneCol}\``); insertVals.push(application[appPhoneCol] || ''); }
        if (collectorEmailCol && appEmailCol) { insertCols.push(`\`${collectorEmailCol}\``); insertVals.push(application[appEmailCol] || ''); }
        if (collectorDobCol && appDobCol) { insertCols.push(`\`${collectorDobCol}\``); insertVals.push(application[appDobCol] || null); }
        if (collectorVehicleTypeCol && appVehicleTypeCol) { insertCols.push(`\`${collectorVehicleTypeCol}\``); insertVals.push(application[appVehicleTypeCol] || ''); }
        if (collectorPlateCol && appPlateCol) { insertCols.push(`\`${collectorPlateCol}\``); insertVals.push(application[appPlateCol] || ''); }
        if (collectorAreaCol && appAreaCol) { insertCols.push(`\`${collectorAreaCol}\``); insertVals.push(application[appAreaCol] || ''); }
        if (collectorAvailabilityCol && appAvailabilityCol) { insertCols.push(`\`${collectorAvailabilityCol}\``); insertVals.push(application[appAvailabilityCol] || ''); }
        if (collectorStatusCol) { insertCols.push(`\`${collectorStatusCol}\``); insertVals.push('Active'); }

        if (insertCols.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'No collector fields to insert' });
        }

        const placeholders = insertCols.map(() => '?').join(', ');
        await connection.execute(`INSERT INTO Collector (${insertCols.join(', ')}) VALUES (${placeholders})`, insertVals);

        const updates = [];
        const updateVals = [];
        updates.push(`\`${appStatusCol}\` = ?`); updateVals.push('Approved');
        updates.push(`\`${appCollectorIdCol}\` = ?`); updateVals.push(newCollectorId);
        if (adminId) {
            updates.push(`\`${appAdminIdCol}\` = ?`); updateVals.push(adminId);
        }
        updateVals.push(req.params.id);
        await connection.execute(`UPDATE Application SET ${updates.join(', ')} WHERE \`${appIdCol}\` = ?`, updateVals);

        await connection.commit();
        
        // Log activity
        if (adminId) {
            const appName = application[appNameCol] || req.params.id;
            await logActivity(connection, adminId, 'Approve Application', 'Application', { applicationId: req.params.id, newCollectorId: newCollectorId, applicantName: appName });
        }
        
        connection.release();
        return res.json({ success: true, collectorId: newCollectorId });
    } catch (error) {
        try { await connection.rollback(); } catch (e) { /* ignore */ }
        connection.release();
        console.error('Error approving application:', error);
        return res.status(500).json({ success: false, message: 'Failed to approve application', details: error.message });
    }
});

// Reject application -> update status and admin
app.post('/api/application/:id/reject', async (req, res) => {
    const { adminId } = req.body || {};
    const connection = await getConnection();
    try {
        const appColumns = await getApplicationColumns(connection);
        const appIdCol = pickApplicationIdColumn(appColumns);
        const appStatusCol = pickFirstExisting(appColumns, ['applicationStatus', 'status', 'application_status']);
        const appAdminIdCol = pickFirstExisting(appColumns, ['adminID', 'adminId', 'admin_id']);
        const appNameCol = pickFirstExisting(appColumns, ['applicantName', 'name', 'fullName', 'fullname', 'applicant_name']);

        if (!appStatusCol || !appAdminIdCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing application columns' });
        }

        const [appRows] = await connection.execute(`SELECT * FROM Application WHERE \`${appIdCol}\` = ? LIMIT 1`, [req.params.id]);
        if (!appRows || appRows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const application = appRows[0];
        const statusRaw = application[appStatusCol] || '';
        const statusLower = String(statusRaw).toLowerCase();
        if (!statusLower.includes('pending')) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Application is not pending' });
        }

        const updates = [];
        const updateVals = [];
        updates.push(`\`${appStatusCol}\` = ?`); updateVals.push('Rejected');
        if (adminId) {
            updates.push(`\`${appAdminIdCol}\` = ?`); updateVals.push(adminId);
        }
        updateVals.push(req.params.id);
        await connection.execute(`UPDATE Application SET ${updates.join(', ')} WHERE \`${appIdCol}\` = ?`, updateVals);

        const [rows] = await connection.execute(`SELECT * FROM Application WHERE \`${appIdCol}\` = ? LIMIT 1`, [req.params.id]);
        
        // Log activity
        if (adminId) {
            const appName = application[appNameCol] || req.params.id;
            await logActivity(connection, adminId, 'Reject Application', 'Application', { applicationId: req.params.id, applicantName: appName });
        }
        
        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        connection.release();
        console.error('Error rejecting application:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject application', details: error.message });
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

// Create station
app.post('/api/station', async (req, res) => {
    try {
        const payload = req.body || {};
        const connection = await getConnection();
        const columns = await getTableColumns(connection, 'Station');

        const idCol = pickStationIdColumn(columns);
        const nameCol = pickFirstExisting(columns, ['stationName', 'station_name', 'name']);
        const locationCol = pickFirstExisting(columns, ['stationLocation', 'station_location', 'location', 'address']);
        const fillCol = pickFirstExisting(columns, ['fillLevel', 'fill_level', 'fill', 'fillPercent', 'fill_percent']);
        const statusCol = pickFirstExisting(columns, ['status', 'stationStatus', 'station_status', 'fillStatus', 'fill_status']);
        const operationCol = pickFirstExisting(columns, ['operationHour', 'operationHours', 'operation_hour', 'operation_hours', 'operatingHour', 'operatingHours', 'operating_hour', 'operating_hours']);
        const adminCol = pickFirstExisting(columns, ['adminID', 'adminId', 'admin_id']);

        if (!idCol || !nameCol || !locationCol || !fillCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing required station columns' });
        }

        const rawId = String(payload.stationId || payload.stationID || payload.station_id || payload.id || '').trim();
        const cleanId = rawId.replace(/^#/, '').trim();
        const stationName = String(payload.stationName || payload.name || '').trim();
        const stationLocation = String(payload.stationLocation || payload.location || payload.address || '').trim();
        const operationHour = String(payload.operationHour || payload.operationHours || payload.operatingHours || '').trim();
        const adminId = String(payload.adminId || payload.adminID || payload.admin_id || '').trim();
        const statusInput = String(payload.status || payload.stationStatus || payload.fillStatus || '').trim();
        const statusKey = statusInput.toLowerCase();
        const statusLabel = (statusKey === 'good') ? 'Good Condition'
            : (statusKey === 'warning') ? 'Nearly Full'
            : (statusKey === 'danger') ? 'Full Bin'
            : statusInput;
        const fillRaw = payload.fillLevel ?? payload.fill ?? payload.fillPercent ?? payload.fill_level ?? '';
        const fillLevel = parseFloat(String(fillRaw).replace(/[^0-9.]/g, ''));

        if (!cleanId || !stationName || !stationLocation || !Number.isFinite(fillLevel)) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing or invalid station fields' });
        }

        if (operationCol && !operationHour) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing operation hour' });
        }

        if (adminCol && !adminId) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing admin ID' });
        }

        if (statusCol && !statusLabel) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing status' });
        }
        const insertCols = [idCol, nameCol, locationCol, fillCol];
        const insertVals = [cleanId, stationName, stationLocation, fillLevel];
        if (statusCol) { insertCols.push(statusCol); insertVals.push(statusLabel); }
        if (operationCol) { insertCols.push(operationCol); insertVals.push(operationHour); }
        if (adminCol) { insertCols.push(adminCol); insertVals.push(adminId); }
        const placeholders = insertCols.map(() => '?').join(', ');

        await connection.execute(
            `INSERT INTO Station (${insertCols.map(col => `\`${col}\``).join(', ')}) VALUES (${placeholders})`,
            insertVals
        );

        const [rows] = await connection.execute(
            `SELECT * FROM Station WHERE \`${idCol}\` = ? LIMIT 1`,
            [cleanId]
        );
        
        // Log activity
        if (adminId) {
            await logActivity(connection, adminId, 'Create Station', 'Station', { stationId: cleanId, stationName: stationName, location: stationLocation });
        }
        
        connection.release();
        return res.status(201).json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error creating station:', error);
        return res.status(500).json({ success: false, message: 'Failed to create station', details: error.message });
    }
});

// Delete station
app.delete('/api/station/:id', async (req, res) => {
    const rawId = String(req.params.id || '').trim();
    const cleanId = rawId.replace(/^#/, '').trim();
    if (!cleanId) {
        return res.status(400).json({ success: false, message: 'Missing station ID' });
    }

    let connection;
    try {
        connection = await getConnection();
        const columns = await getTableColumns(connection, 'Station');
        const idCol = pickStationIdColumn(columns);
        if (!idCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing station ID column' });
        }

        const tryDelete = async (idValue) => {
            const [result] = await connection.execute(
                `DELETE FROM Station WHERE \`${idCol}\` = ?`,
                [idValue]
            );
            return result?.affectedRows || 0;
        };

        let affected = await tryDelete(cleanId);
        if (affected === 0) {
            affected = await tryDelete(`#${cleanId}`);
        }

        if (affected === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        // Log activity
        const adminId = req.body?.adminId;
        if (adminId) {
            await logActivity(connection, adminId, 'Delete Station', 'Station', { stationId: cleanId });
        }

        connection.release();
        return res.json({ success: true, data: { stationId: cleanId } });
    } catch (error) {
        if (connection) connection.release();
        console.error('Error deleting station:', error);
        const code = error?.code || '';
        // MySQL FK constraint errors
        if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED' || code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(409).json({ success: false, message: 'Station is referenced by other records and cannot be deleted.' });
        }
        return res.status(500).json({ success: false, message: 'Failed to delete station', details: error.message });
    }
});

// Empty station bin (set fill to 0 and status to Good Condition)
app.post('/api/station/empty-bin', async (req, res) => {
    const body = req.body || {};
    const rawStationId = body.stationID || body.stationId || body.station_id || body.id || '';

    if (!rawStationId) {
        return res.status(400).json({ success: false, message: 'Missing stationID' });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const stationColumns = await getTableColumns(connection, 'Station');
        const idCol = pickStationIdColumn(stationColumns);
        const fillCol = pickFirstExisting(stationColumns, ['fillLevel', 'fill_level', 'fill', 'fillPercent', 'fill_percent']);
        const statusCol = pickFirstExisting(stationColumns, ['status', 'stationStatus', 'station_status', 'fillStatus', 'fill_status']);
        const stationNameCol = pickFirstExisting(stationColumns, ['stationName', 'station_name', 'name']);

        if (!idCol || !fillCol || !statusCol) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing required station columns' });
        }

        const tryUpdate = async (idValue) => {
            const [result] = await connection.execute(
                `UPDATE Station SET \`${fillCol}\` = ?, \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`,
                [0, 'Good Condition', idValue]
            );
            return result?.affectedRows || 0;
        };

        let finalId = String(rawStationId).trim();
        let affected = await tryUpdate(finalId);
        if (affected === 0 && finalId && !finalId.startsWith('#')) {
            const prefixed = `#${finalId}`;
            affected = await tryUpdate(prefixed);
            if (affected > 0) finalId = prefixed;
        }

        if (affected === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        const [stationRows] = await connection.execute(
            `SELECT * FROM Station WHERE \`${idCol}\` = ? LIMIT 1`,
            [finalId]
        );
        const stationRow = stationRows[0] || null;
        const stationName = stationRow && stationNameCol ? stationRow[stationNameCol] : null;

        const collectionColumns = await getTableColumns(connection, 'Collection');
        const collectionIdCol = pickCollectionIdColumn(collectionColumns);
        const collectionStationCol = pickFirstExisting(collectionColumns, ['stationID', 'stationId', 'station_id']);
        const collectionDateCol = pickFirstExisting(collectionColumns, ['collectionDate', 'collection_date', 'collectedTime', 'collectionTime', 'collection_time', 'date']);
        const requestTimeCol = pickFirstExisting(collectionColumns, ['requestTime', 'request_time', 'requestedTime', 'timeRequested']);
        const collectionStatusCol = pickFirstExisting(collectionColumns, ['collectionStatus', 'status', 'collection_status']);
        const collectionAddressCol = pickFirstExisting(collectionColumns, ['collectionAddress', 'collection_address', 'address', 'location']);

        if (!collectionIdCol || !collectionStationCol || !collectionDateCol || !requestTimeCol || !collectionStatusCol) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Missing required collection columns'
            });
        }

        const nextCollectionId = await generateNextCollectionId(connection, collectionIdCol);
        const now = formatDateTime(new Date());

        const insertCols = collectionColumns;
        const insertValues = insertCols.map(col => {
            if (col === collectionIdCol) return nextCollectionId;
            if (col === collectionStationCol) return finalId;
            if (col === collectionDateCol) return now;
            if (col === requestTimeCol) return now;
            if (col === collectionStatusCol) return 'Pending';
            if (collectionAddressCol && col === collectionAddressCol) return stationName;
            return null;
        });

        const placeholders = insertCols.map(() => '?').join(', ');
        await connection.execute(
            `INSERT INTO Collection (${insertCols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
            insertValues
        );

        if (collectionAddressCol && stationName) {
            await connection.execute(
                `UPDATE Collection SET \`${collectionAddressCol}\` = ? WHERE \`${collectionIdCol}\` = ?`,
                [stationName, nextCollectionId]
            );
        }

        const [collectionRows] = await connection.execute(
            `SELECT * FROM Collection WHERE \`${collectionIdCol}\` = ? LIMIT 1`,
            [nextCollectionId]
        );

        await connection.commit();
        connection.release();
        return res.json({ success: true, data: stationRow, collection: collectionRows[0] || null });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (rollbackError) { /* ignore */ }
            connection.release();
        }
        console.error('Error emptying station bin:', error);
        return res.status(500).json({ success: false, message: 'Failed to empty bin', details: error.message });
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

// Update report status
app.put('/api/report/:id/status', async (req, res) => {
    try {
        const { status } = req.body || {};
        if (status === undefined) {
            return res.status(400).json({ success: false, message: 'Missing status' });
        }

        const connection = await getConnection();
        const columns = await getTableColumns(connection, 'Report');
        const idCol = pickReportIdColumn(columns);
        const statusCol = pickFirstExisting(columns, ['reportStatus', 'report_status', 'status']);

        if (!statusCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No status column found' });
        }

        const rawId = String(req.params.id || '').trim();
        await connection.execute(`UPDATE Report SET \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`, [status, rawId]);
        let [rows] = await connection.execute(`SELECT * FROM Report WHERE \`${idCol}\` = ? LIMIT 1`, [rawId]);

        if ((!rows || rows.length === 0) && rawId && !rawId.startsWith('#')) {
            const prefixed = `#${rawId}`;
            await connection.execute(`UPDATE Report SET \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`, [status, prefixed]);
            [rows] = await connection.execute(`SELECT * FROM Report WHERE \`${idCol}\` = ? LIMIT 1`, [prefixed]);
        }

        // Log activity
        const adminId = req.body?.adminId;
        if (adminId && rows && rows.length > 0) {
            await logActivity(connection, adminId, 'Update Status', 'Report', { reportId: rawId, newStatus: status });
        }

        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error updating report status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update report status', details: error.message });
    }
});

// Admin login (default password: password123)
app.post('/api/admin/login', async (req, res) => {
    const { adminId, password } = req.body || {};
    if (!adminId || !password) {
        return res.status(400).json({ success: false, message: 'Missing credentials' });
    }
    let connection;
    try {
        connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        const passwordCol = pickAdminPasswordColumn(columns);
        const emailCol = pickFirstExisting(columns, ['twoFactorEmail', 'emailAddress', 'email', 'adminEmail', 'email_address']);
        
        const [rows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = rows[0];
        const storedPassword = passwordCol ? String(admin[passwordCol] || '') : '';
        const twoFactorEnabled = admin.twoFactorEnabled !== 0; // Default to enabled
        let shouldUpgradeToHash = false;
        
        // Check password: if admin has a stored password, verify it; otherwise allow 'password123' as default
        let passwordMatch;
        if (storedPassword) {
            passwordMatch = verifyAdminPassword(password, storedPassword);
            if (passwordMatch && !isBcryptHash(storedPassword)) {
                shouldUpgradeToHash = true;
            }
        } else {
            passwordMatch = password === 'password123';
            if (passwordMatch) {
                shouldUpgradeToHash = true;
            }
        }
        
        if (!passwordMatch) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (passwordCol && shouldUpgradeToHash) {
            const hashedPassword = hashAdminPassword(password);
            await connection.execute(`UPDATE Admin SET \`${passwordCol}\` = ? WHERE \`${idCol}\` = ?`, [hashedPassword, adminId]);
            admin[passwordCol] = hashedPassword;
        }

        // Get admin email for 2FA
        const adminEmail = emailCol ? admin[emailCol] : null;

        if (twoFactorEnabled && adminEmail) {
            // Generate 2FA code and temporary token
            const twoFactorCode = generateSixDigitCode();
            const tempTwoFactorToken = generateTempToken();
            const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            const tokenExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for token

            // Store code and token in database
            await connection.execute(
                `UPDATE Admin SET twoFactorCode = ?, twoFactorCodeExpiry = ?, tempTwoFactorToken = ?, tempTwoFactorTokenExpiry = ? WHERE \`${idCol}\` = ?`,
                [twoFactorCode, expiryTime, tempTwoFactorToken, tokenExpiryTime, adminId]
            );

            // Send 2FA email
            const adminName = pickFirstExisting(columns, ['adminName', 'name', 'fullName', 'fullname', 'admin_name']);
            const displayName = adminName ? admin[adminName] : 'Admin';
            await sendTwoFactorEmail(adminEmail, twoFactorCode, displayName);

            console.log(`✓ 2FA initiated for admin ${adminId} with email ${adminEmail}`);

            connection.release();
            return res.json({
                success: true,
                requires2FA: true,
                tempToken: tempTwoFactorToken,
                adminId: adminId,
                message: '2FA code sent to your email. Please verify to complete login.'
            });
        } else if (twoFactorEnabled && !adminEmail) {
            console.warn('⚠️  2FA enabled but no email found for admin:', adminId);
            console.log('Available columns:', columns);
            console.log('Admin data:', admin);
            
            // For testing/development without configured email, proceed with 2FA using console
            const twoFactorCode = generateSixDigitCode();
            const tempTwoFactorToken = generateTempToken();
            const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            const tokenExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

            // Store code and token in database
            await connection.execute(
                `UPDATE Admin SET twoFactorCode = ?, twoFactorCodeExpiry = ?, tempTwoFactorToken = ?, tempTwoFactorTokenExpiry = ? WHERE \`${idCol}\` = ?`,
                [twoFactorCode, expiryTime, tempTwoFactorToken, tokenExpiryTime, adminId]
            );

            console.log(`⚠️  2FA code for admin ${adminId} (development mode): ${twoFactorCode}`);

            connection.release();
            return res.json({
                success: true,
                requires2FA: true,
                tempToken: tempTwoFactorToken,
                adminId: adminId,
                message: '2FA code displayed in server console. Check server logs.'
            });
        } else {
            // 2FA disabled, allow login directly
            const safeAdmin = { ...admin };
            if (passwordCol && Object.prototype.hasOwnProperty.call(safeAdmin, passwordCol)) {
                delete safeAdmin[passwordCol];
            }
            
            connection.release();
            return res.json({ success: true, admin: safeAdmin, requires2FA: false });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        if (connection) connection.release();
        return res.status(500).json({ success: false, message: 'Login failed', details: error.message });
    }
});

// Verify 2FA code and complete login
app.post('/api/admin/verify-2fa-code', async (req, res) => {
    const { adminId, twoFactorCode, tempToken } = req.body || {};
    
    if (!adminId || !twoFactorCode || !tempToken) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    let connection;
    try {
        connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        const passwordCol = pickAdminPasswordColumn(columns);
        
        const [rows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = rows[0];
        const now = new Date();
        
        // Validate temp token
        if (admin.tempTwoFactorToken !== tempToken) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        
        // Check if temp token has expired
        if (!admin.tempTwoFactorTokenExpiry || new Date(admin.tempTwoFactorTokenExpiry) < now) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }
        
        // Check if 2FA code matches
        if (admin.twoFactorCode !== twoFactorCode) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Invalid verification code' });
        }
        
        // Check if 2FA code has expired
        if (!admin.twoFactorCodeExpiry || new Date(admin.twoFactorCodeExpiry) < now) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Verification code expired. Please request a new code.' });
        }
        
        // Clear 2FA code and temp token from database
        await connection.execute(
            `UPDATE Admin SET twoFactorCode = NULL, twoFactorCodeExpiry = NULL, tempTwoFactorToken = NULL, tempTwoFactorTokenExpiry = NULL WHERE \`${idCol}\` = ?`,
            [adminId]
        );
        
        // Return admin data for successful login
        const safeAdmin = { ...admin };
        if (passwordCol && Object.prototype.hasOwnProperty.call(safeAdmin, passwordCol)) {
            delete safeAdmin[passwordCol];
        }
        delete safeAdmin.twoFactorCode;
        delete safeAdmin.twoFactorCodeExpiry;
        delete safeAdmin.tempTwoFactorToken;
        delete safeAdmin.tempTwoFactorTokenExpiry;
        
        connection.release();
        return res.json({
            success: true,
            admin: safeAdmin,
            message: 'Two-factor authentication successful. Login complete.'
        });
    } catch (error) {
        console.error('2FA verification error:', error);
        if (connection) connection.release();
        return res.status(500).json({ success: false, message: 'Verification failed', details: error.message });
    }
});

// Resend 2FA code
app.post('/api/admin/resend-2fa-code', async (req, res) => {
    const { adminId, tempToken } = req.body || {};
    
    if (!adminId || !tempToken) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    let connection;
    try {
        connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        const emailCol = pickFirstExisting(columns, ['twoFactorEmail', 'emailAddress', 'email', 'adminEmail', 'email_address']);
        
        const [rows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = rows[0];
        const now = new Date();
        
        // Validate temp token
        if (admin.tempTwoFactorToken !== tempToken) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        
        // Check if temp token has expired
        if (!admin.tempTwoFactorTokenExpiry || new Date(admin.tempTwoFactorTokenExpiry) < now) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }
        
        // Generate new 2FA code
        const newTwoFactorCode = generateSixDigitCode();
        const newExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Update database with new code
        await connection.execute(
            `UPDATE Admin SET twoFactorCode = ?, twoFactorCodeExpiry = ? WHERE \`${idCol}\` = ?`,
            [newTwoFactorCode, newExpiryTime, adminId]
        );
        
        // Send new 2FA email
        const adminEmail = emailCol ? admin[emailCol] : null;
        if (adminEmail) {
            const adminName = pickFirstExisting(columns, ['adminName', 'name', 'fullName', 'fullname', 'admin_name']);
            const displayName = adminName ? admin[adminName] : 'Admin';
            await sendTwoFactorEmail(adminEmail, newTwoFactorCode, displayName);
            
            connection.release();
            return res.json({
                success: true,
                message: 'New 2FA code sent to your email'
            });
        } else {
            connection.release();
            return res.status(400).json({ success: false, message: 'Email not configured for 2FA' });
        }
    } catch (error) {
        console.error('Resend 2FA code error:', error);
        if (connection) connection.release();
        return res.status(500).json({ success: false, message: 'Failed to resend code', details: error.message });
    }
});

// Get security questions for password reset
app.post('/api/admin/get-security-questions', async (req, res) => {
    const { adminId } = req.body || {};
    
    if (!adminId) {
        return res.status(400).json({ success: false, message: 'Missing adminId' });
    }
    
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        
        const [adminRows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!adminRows || adminRows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = adminRows[0];
        let questions = {};
        
        // Try to get stored security questions
        if (admin.security_questions) {
            try {
                questions = typeof admin.security_questions === 'string' 
                    ? JSON.parse(admin.security_questions) 
                    : admin.security_questions;
            } catch (e) {
                console.error('Error parsing security questions:', e);
            }
        }
        
        if (!questions || Object.keys(questions).length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No security questions configured for this admin' });
        }
        
        connection.release();
        return res.json({ success: true, questions });
    } catch (error) {
        console.error('Get security questions error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve security questions', details: error.message });
    }
});

// Validate security question answers
app.post('/api/admin/validate-security-answers', async (req, res) => {
    const { adminId, answers } = req.body || {};
    
    if (!adminId || !answers) {
        return res.status(400).json({ success: false, message: 'Missing adminId or answers' });
    }
    
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        
        const [adminRows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!adminRows || adminRows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = adminRows[0];
        let storedAnswers = {};
        
        // Try to get stored security answers
        if (admin.security_answers) {
            try {
                storedAnswers = typeof admin.security_answers === 'string' 
                    ? JSON.parse(admin.security_answers) 
                    : admin.security_answers;
            } catch (e) {
                console.error('Error parsing security answers:', e);
                connection.release();
                return res.status(500).json({ success: false, message: 'Failed to validate answers' });
            }
        }
        
        const providedKeys = Object.keys(answers || {});
        const storedKeys = Object.keys(storedAnswers || {});

        if (storedKeys.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No security answers configured for this admin' });
        }

        if (providedKeys.length !== storedKeys.length) {
            connection.release();
            return res.status(400).json({ success: false, message: 'All security answers are required' });
        }

        let allAnswersMatch = true;
        for (const qKey of storedKeys) {
            const userAnswer = String(answers[qKey] || '').trim();
            const storedAnswer = String(storedAnswers[qKey] || '').trim();
            if (!userAnswer || userAnswer !== storedAnswer) {
                allAnswersMatch = false;
                break;
            }
        }

        connection.release();

        if (allAnswersMatch) {
            return res.json({ success: true, message: 'Security answers validated' });
        } else {
            return res.status(401).json({ success: false, message: 'Incorrect security answers' });
        }
    } catch (error) {
        console.error('Validate security answers error:', error);
        return res.status(500).json({ success: false, message: 'Failed to validate answers', details: error.message });
    }
});

// Reset admin password
app.post('/api/admin/reset-password', async (req, res) => {
    const { adminId, newPassword, answers, currentPassword } = req.body || {};
    const hasAnswers = answers && typeof answers === 'object' && Object.keys(answers).length > 0;
    const hasCurrentPassword = typeof currentPassword === 'string' && currentPassword.length > 0;
    
    if (!adminId || !newPassword) {
        return res.status(400).json({ success: false, message: 'Missing adminId or new password' });
    }

    if (!hasAnswers && !hasCurrentPassword) {
        return res.status(400).json({ success: false, message: 'Provide either current password or security answers' });
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
        return res.status(400).json({ success: false, message: passwordValidation.message });
    }
    
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        let passwordCol = pickAdminPasswordColumn(columns);

        if (!passwordCol) {
            await connection.execute('ALTER TABLE Admin ADD COLUMN `password` VARCHAR(255) DEFAULT NULL');
            passwordCol = 'password';
        }
        
        // Check if admin exists
        const [adminRows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!adminRows || adminRows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        if (hasCurrentPassword) {
            const currentStoredPassword = String(adminRows[0][passwordCol] || '');
            if (!currentStoredPassword || !verifyAdminPassword(currentPassword, currentStoredPassword)) {
                connection.release();
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
        } else {
            let storedAnswers = {};

            if (adminRows[0].security_answers) {
                try {
                    storedAnswers = typeof adminRows[0].security_answers === 'string'
                        ? JSON.parse(adminRows[0].security_answers)
                        : adminRows[0].security_answers;
                } catch (e) {
                    connection.release();
                    return res.status(500).json({ success: false, message: 'Failed to validate security answers' });
                }
            }

            const answerKeys = Object.keys(answers);
            const storedAnswerKeys = Object.keys(storedAnswers || {});

            if (storedAnswerKeys.length === 0) {
                connection.release();
                return res.status(400).json({ success: false, message: 'No security answers configured for this admin' });
            }

            if (answerKeys.length !== storedAnswerKeys.length) {
                connection.release();
                return res.status(400).json({ success: false, message: 'All security answers are required' });
            }

            let allAnswersCorrect = true;
            for (const qKey of storedAnswerKeys) {
                const userAnswer = String(answers[qKey] || '').trim();
                const storedAnswer = String(storedAnswers[qKey] || '').trim();
                if (!userAnswer || userAnswer !== storedAnswer) {
                    allAnswersCorrect = false;
                    break;
                }
            }

            if (!allAnswersCorrect) {
                connection.release();
                return res.status(401).json({ success: false, message: 'Security answers validation failed' });
            }
        }

        // Update password hash in database only after validation
        const hashedNewPassword = hashAdminPassword(newPassword);
        await connection.execute(`UPDATE Admin SET \`${passwordCol}\` = ? WHERE \`${idCol}\` = ?`, [hashedNewPassword, adminId]);
        
        connection.release();
        
        console.log(`Password reset for admin: ${adminId}`);
        return res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Admin password reset error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reset password', details: error.message });
    }
});

// Get current admin's security questions
app.post('/api/admin/my-security-questions', async (req, res) => {
    const { adminId } = req.body || {};
    
    if (!adminId) {
        return res.status(400).json({ success: false, message: 'Missing adminId' });
    }
    
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        
        const [adminRows] = await connection.execute(`SELECT security_questions FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!adminRows || adminRows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = adminRows[0];
        let questions = {};
        
        if (admin.security_questions) {
            try {
                questions = typeof admin.security_questions === 'string' 
                    ? JSON.parse(admin.security_questions) 
                    : admin.security_questions;
            } catch (e) {
                console.error('Error parsing security questions:', e);
            }
        }
        
        connection.release();
        return res.json({ success: true, questions });
    } catch (error) {
        console.error('Get security questions error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve security questions', details: error.message });
    }
});

// Set/update security questions and answers
app.post('/api/admin/set-security-questions', async (req, res) => {
    const { adminId, questions, answers } = req.body || {};
    
    if (!adminId || !questions || !answers) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    try {
        const connection = await getConnection();
        const columns = await getAdminColumns(connection);
        const idCol = pickAdminIdColumn(columns);
        
        // Verify admin exists
        const [adminRows] = await connection.execute(`SELECT * FROM Admin WHERE \`${idCol}\` = ? LIMIT 1`, [adminId]);
        
        if (!adminRows || adminRows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        // Store questions and answers as JSON
        const questionsJson = typeof questions === 'string' ? questions : JSON.stringify(questions);
        const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers);
        
        await connection.execute(
            `UPDATE Admin SET security_questions = ?, security_answers = ? WHERE \`${idCol}\` = ?`,
            [questionsJson, answersJson, adminId]
        );
        
        connection.release();
        
        console.log(`Security questions updated for admin: ${adminId}`);
        return res.json({ success: true, message: 'Security questions saved successfully' });
    } catch (error) {
        console.error('Set security questions error:', error);
        return res.status(500).json({ success: false, message: 'Failed to save security questions', details: error.message });
    }
});

// Helper function to validate password strength
function validatePasswordStrength(password) {
    // Minimum 12 characters
    if (password.length < 12) {
        return { 
            valid: false, 
            message: 'Password must be at least 12 characters long' 
        };
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one uppercase letter (A-Z)' 
        };
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one lowercase letter (a-z)' 
        };
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one number (0-9)' 
        };
    }
    
    // Check for special character/symbol
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { 
            valid: false, 
            message: 'Password must contain at least one symbol (!@#$%^&* etc.)' 
        };
    }
    
    return { valid: true, message: '' };
}

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

// Create reward
app.post('/api/reward', async (req, res) => {
    try {
        const connection = await getConnection();
        const columns = await getRewardColumns(connection);
        const idCol = pickRewardIdColumn(columns);
        const fieldMap = {
            id: idCol,
            name: pickFirstExisting(columns, ['rewardName', 'name', 'reward_name']),
            category: pickFirstExisting(columns, ['rewardCategory', 'category', 'reward_category']),
            merchant: pickFirstExisting(columns, ['merchant', 'merchantName', 'merchant_name']),
            value: pickFirstExisting(columns, ['rewardValue', 'value', 'reward_value']),
            pointsRequired: pickFirstExisting(columns, ['pointsRequired', 'points', 'points_required']),
            expiryDate: pickFirstExisting(columns, ['expiryDate', 'expiry', 'expiry_date', 'expireDate']),
            adminId: pickFirstExisting(columns, ['adminID', 'adminId', 'admin_id'])
        };

        const insertCols = [];
        const values = [];

        if (fieldMap.id && req.body?.id !== undefined && req.body?.id !== '') {
            insertCols.push(`\`${fieldMap.id}\``);
            values.push(req.body.id);
        }
        if (fieldMap.name && req.body?.name !== undefined) {
            insertCols.push(`\`${fieldMap.name}\``);
            values.push(req.body.name);
        }
        if (fieldMap.category && req.body?.category !== undefined) {
            insertCols.push(`\`${fieldMap.category}\``);
            values.push(req.body.category);
        }
        if (fieldMap.merchant && req.body?.merchant !== undefined) {
            insertCols.push(`\`${fieldMap.merchant}\``);
            values.push(req.body.merchant);
        }
        if (fieldMap.value && req.body?.value !== undefined) {
            insertCols.push(`\`${fieldMap.value}\``);
            values.push(req.body.value);
        }
        if (fieldMap.pointsRequired && req.body?.pointsRequired !== undefined) {
            insertCols.push(`\`${fieldMap.pointsRequired}\``);
            values.push(req.body.pointsRequired);
        }
        if (fieldMap.expiryDate && req.body?.expiryDate !== undefined) {
            insertCols.push(`\`${fieldMap.expiryDate}\``);
            values.push(req.body.expiryDate);
        }
        if (fieldMap.adminId && req.body?.adminId !== undefined) {
            insertCols.push(`\`${fieldMap.adminId}\``);
            values.push(req.body.adminId);
        }

        if (insertCols.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No insertable fields found' });
        }

        const placeholders = insertCols.map(() => '?').join(', ');
        const sql = `INSERT INTO Reward (${insertCols.join(', ')}) VALUES (${placeholders})`;
        await connection.execute(sql, values);

        if (fieldMap.id && req.body?.id !== undefined && req.body?.id !== '') {
            const [rows] = await connection.execute(`SELECT * FROM Reward WHERE \`${fieldMap.id}\` = ? LIMIT 1`, [req.body.id]);
            
            // Log activity
            const adminId = req.body?.adminId;
            if (adminId) {
                await logActivity(connection, adminId, 'Create Reward', 'Reward', { rewardId: req.body.id, rewardName: req.body.name });
            }
            
            connection.release();
            return res.json({ success: true, data: rows[0] || null });
        }

        // Log activity
        const adminId = req.body?.adminId;
        if (adminId) {
            await logActivity(connection, adminId, 'Create Reward', 'Reward', { rewardName: req.body.name });
        }

        connection.release();
        return res.json({ success: true, data: null });
    } catch (error) {
        console.error('Error creating reward:', error);
        res.status(500).json({ success: false, message: 'Failed to create reward', details: error.message });
    }
});

// Update reward
app.put('/api/reward/:id', async (req, res) => {
    try {
        const connection = await getConnection();
        const columns = await getRewardColumns(connection);
        const idCol = pickRewardIdColumn(columns);
        const fieldMap = {
            name: pickFirstExisting(columns, ['rewardName', 'name', 'reward_name']),
            category: pickFirstExisting(columns, ['rewardCategory', 'category', 'reward_category']),
            merchant: pickFirstExisting(columns, ['merchant', 'merchantName', 'merchant_name']),
            value: pickFirstExisting(columns, ['rewardValue', 'value', 'reward_value']),
            pointsRequired: pickFirstExisting(columns, ['pointsRequired', 'points', 'points_required']),
            expiryDate: pickFirstExisting(columns, ['expiryDate', 'expiry', 'expiry_date', 'expireDate']),
            adminId: pickFirstExisting(columns, ['adminID', 'adminId', 'admin_id'])
        };

        const updates = [];
        const values = [];

        if (fieldMap.name && req.body?.name !== undefined) {
            updates.push(`\`${fieldMap.name}\` = ?`);
            values.push(req.body.name);
        }
        if (fieldMap.category && req.body?.category !== undefined) {
            updates.push(`\`${fieldMap.category}\` = ?`);
            values.push(req.body.category);
        }
        if (fieldMap.merchant && req.body?.merchant !== undefined) {
            updates.push(`\`${fieldMap.merchant}\` = ?`);
            values.push(req.body.merchant);
        }
        if (fieldMap.value && req.body?.value !== undefined) {
            updates.push(`\`${fieldMap.value}\` = ?`);
            values.push(req.body.value);
        }
        if (fieldMap.pointsRequired && req.body?.pointsRequired !== undefined) {
            updates.push(`\`${fieldMap.pointsRequired}\` = ?`);
            values.push(req.body.pointsRequired);
        }
        if (fieldMap.expiryDate && req.body?.expiryDate !== undefined) {
            updates.push(`\`${fieldMap.expiryDate}\` = ?`);
            values.push(req.body.expiryDate);
        }
        if (fieldMap.adminId && req.body?.adminId !== undefined) {
            updates.push(`\`${fieldMap.adminId}\` = ?`);
            values.push(req.body.adminId);
        }

        if (updates.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'No updatable fields found' });
        }

        values.push(req.params.id);
        const sql = `UPDATE Reward SET ${updates.join(', ')} WHERE \`${idCol}\` = ?`;
        await connection.execute(sql, values);

        const [rows] = await connection.execute(`SELECT * FROM Reward WHERE \`${idCol}\` = ? LIMIT 1`, [req.params.id]);
        
        // Log activity
        const adminId = req.body?.adminId;
        if (adminId && rows && rows.length > 0) {
            await logActivity(connection, adminId, 'Update Reward', 'Reward', { rewardId: req.params.id, rewardName: req.body?.name });
        }
        
        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        console.error('Error updating reward:', error);
        res.status(500).json({ success: false, message: 'Failed to update reward', details: error.message });
    }
});

// Delete reward
app.delete('/api/reward/:id', async (req, res) => {
    try {
        const connection = await getConnection();
        const columns = await getRewardColumns(connection);
        const idCol = pickRewardIdColumn(columns);
        await connection.execute(`DELETE FROM Reward WHERE \`${idCol}\` = ?`, [req.params.id]);
        
        // Log activity
        const adminId = req.body?.adminId;
        if (adminId) {
            await logActivity(connection, adminId, 'Delete Reward', 'Reward', { rewardId: req.params.id });
        }
        
        connection.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting reward:', error);
        res.status(500).json({ success: false, message: 'Failed to delete reward', details: error.message });
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

// API endpoint for specific report details (Accident/Collection/Manual)
app.get('/api/report-details', async (req, res) => {
    const type = String(req.query.type || '').toLowerCase();
    const reportIdRaw = normalizeReportId(req.query.reportId || req.query.id || '');
    if (!reportIdRaw) {
        return res.status(400).json({ error: 'Missing reportId' });
    }
    const reportIdWithHash = `#${reportIdRaw}`;
    try {
        const connection = await getConnection();
        let table = null;
        let columns = [];

        if (type.includes('accident')) {
            table = 'AccidentReport';
            columns = await getAccidentReportColumns(connection);
        } else if (type.includes('collection')) {
            table = 'CollectionReport';
            columns = await getCollectionReportColumns(connection);
        } else if (type.includes('manual')) {
            table = 'ManualReport';
            columns = await getManualReportColumns(connection);
        }

        if (!table || columns.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Report type not supported' });
        }

        const idCol = pickReportIdColumn(columns);
        const [rows] = await connection.execute(
            `SELECT * FROM ${table} WHERE \`${idCol}\` = ? OR \`${idCol}\` = ? LIMIT 1`,
            [reportIdRaw, reportIdWithHash]
        );
        connection.release();
        return res.json({ data: rows[0] || null });
    } catch (error) {
        console.error('Error fetching report details:', error);
        return res.status(500).json({ error: 'Failed to fetch report details', details: error.message });
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

// Assign collector to collection
app.post('/api/collection/assign', async (req, res) => {
    const body = req.body || {};
    const rawCollectionId = body.collectionID || body.collectionId || body.id || '';
    const rawCollectorId = body.collectorID || body.collectorId || body.collector_id || '';

    if (!rawCollectionId || !rawCollectorId) {
        return res.status(400).json({ success: false, message: 'Missing collectionID or collectorID' });
    }

    let connection;
    try {
        connection = await getConnection();
        const columns = await getTableColumns(connection, 'Collection');
        const idCol = pickCollectionIdColumn(columns);
        const collectorCol = pickFirstExisting(columns, ['collectorID', 'collectorId', 'collector_id']);
        const statusCol = pickFirstExisting(columns, ['collectionStatus', 'status', 'collection_status']);

        if (!idCol || !collectorCol || !statusCol) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing required collection columns' });
        }

        const tryUpdate = async (idValue) => {
            const [result] = await connection.execute(
                `UPDATE Collection SET \`${collectorCol}\` = ?, \`${statusCol}\` = ? WHERE \`${idCol}\` = ?`,
                [rawCollectorId, 'Assigned', idValue]
            );
            return result?.affectedRows || 0;
        };

        let finalId = String(rawCollectionId).trim();
        let affected = await tryUpdate(finalId);
        if (affected === 0 && finalId && !finalId.startsWith('#')) {
            const prefixed = `#${finalId}`;
            affected = await tryUpdate(prefixed);
            if (affected > 0) finalId = prefixed;
        }

        if (affected === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Collection not found' });
        }

        const [rows] = await connection.execute(
            `SELECT * FROM Collection WHERE \`${idCol}\` = ? LIMIT 1`,
            [finalId]
        );
        
        // Log activity
        const adminId = req.body?.adminId;
        if (adminId) {
            await logActivity(connection, adminId, 'Assign Collector', 'Collection', { collectionId: finalId, collectorId: rawCollectorId });
        }
        
        connection.release();
        return res.json({ success: true, data: rows[0] || null });
    } catch (error) {
        if (connection) connection.release();
        console.error('Error assigning collector to collection:', error);
        return res.status(500).json({ success: false, message: 'Failed to assign collector', details: error.message });
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

app.post('/api/ai/assist', async (req, res) => {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
        return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ ok: false, error: 'AI API key is not configured' });
    }
    try {
        const text = await callGemini(prompt);
        return res.json({ ok: true, text: text || 'No response.' });
    } catch (error) {
        console.error('AI assist error:', error);
        const msg = String(error?.message || '').toLowerCase();
        const isRate = error && (error.statusCode === 429 || /\b429\b|rate[- ]?limit|rate[- ]?limited|rate limit/i.test(msg));
        if (isRate) {
            return res.status(429).json({ ok: false, error: 'AI service is temporarily rate-limited. Please try again in a moment.' });
        }
        return res.status(500).json({ ok: false, error: 'AI request failed' });
    }
});

// Activity Log Endpoints
app.get('/api/activity-log', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10), 1), 500);
        const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
        const adminId = req.query.adminId || null;
        
        const connection = await getConnection();
        
        // Ensure table exists
        try {
            await connection.execute(`SELECT 1 FROM AdminActivityLog LIMIT 1`);
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                const createTableQuery = `
                    CREATE TABLE IF NOT EXISTS AdminActivityLog (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        adminID VARCHAR(50) NOT NULL,
                        action VARCHAR(100) NOT NULL,
                        resource VARCHAR(100),
                        details JSON,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_admin (adminID),
                        INDEX idx_timestamp (timestamp)
                    )`;
                await connection.execute(createTableQuery);
            }
        }
        
        let query = 'SELECT * FROM AdminActivityLog';
        let params = [];
        
        if (adminId) {
            query += ' WHERE adminID = ?';
            params.push(adminId);
        }
        
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [rows] = await connection.execute(query, params);
        connection.release();
        
        return res.json(rows);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        return res.status(500).json({ error: 'Failed to fetch activity log', details: error.message });
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
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints ready for dashboard data`);
    // Initialize security question columns on startup
    await ensureSecurityQuestionColumns();
    // Initialize 2FA columns on startup
    await ensure2FAColumns();
});


// Kaiyean AI Model (Scoring Version, dont remove!!!)
app.get("/api/ai-suggestion/:collectionId", async (req, res) => {

    const collectionId = req.params.collectionId;

    try {

        const connection = await getConnection();

        const [collection] = await connection.execute(
            "SELECT collectionAddress FROM collection WHERE collectionID = ?",
            [collectionId]
        );

        if(collection.length === 0){
            connection.release();
            return res.status(404).json({error:"Collection not found"});
        }

        const location = collection[0].collectionAddress.toLowerCase();

        const [collectors] = await connection.execute(
            "SELECT collectorID, collectorName, preferredCollectionArea FROM collector"
        );

        if(collectors.length === 0){
            connection.release();
            return res.status(404).json({error:"No collectors available"});
        }

        let bestCollector = null;
        let bestScore = Infinity;

        collectors.forEach(c => {

            // Area Match
            let areaScore = location.includes(
                c.preferredCollectionArea.toLowerCase()
            ) ? 0 : 5;

            // Simulated workload (for demo)
            let workloadScore = Math.floor(Math.random() * 5);

            // Simulated distance
            let distanceScore = Math.random() * 10;

            // AI scoring formula
            let score =
                (areaScore * 0.5) +
                (workloadScore * 0.3) +
                (distanceScore * 0.2);

            if(score < bestScore){
                bestScore = score;
                bestCollector = c;
            }

        });

        connection.release();

        // convert score to confidence (0-100)
        const confidence = Math.max(0, 100 - (bestScore * 20)).toFixed(0);

        res.json({
            collectorName: bestCollector.collectorName,
            collectorId: bestCollector.collectorID,
            score: `${confidence}/100`,
            reason: "AI Scoring Model"
        });

    } catch(err) {

        console.error(err);
        res.status(500).json({error:"AI suggestion failed"});

    }

});