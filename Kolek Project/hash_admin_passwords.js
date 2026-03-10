require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const BCRYPT_SALT_ROUNDS = 12;

function isBcryptHash(value) {
    return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

function pickFirstExisting(columns, candidates) {
    const lower = columns.map(c => String(c || '').toLowerCase());
    for (const candidate of candidates) {
        const idx = lower.indexOf(candidate.toLowerCase());
        if (idx >= 0) return columns[idx];
    }
    return null;
}

function pickAdminIdColumn(columns) {
    return columns.find(c => /^admin_id$/i.test(c))
        || columns.find(c => /^adminid$/i.test(c))
        || columns.find(c => /^id$/i.test(c))
        || columns.find(c => /admin/i.test(c) && /id/i.test(c))
        || columns[0];
}

function pickAdminPasswordColumn(columns) {
    return pickFirstExisting(columns, [
        'password',
        'adminPassword',
        'admin_password',
        'passwordHash',
        'password_hash',
        'passwd'
    ]);
}

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'kolek_dashboard'
    });

    try {
        const [columnRows] = await connection.execute('SHOW COLUMNS FROM Admin');
        const columns = columnRows.map(c => c.Field);
        const idCol = pickAdminIdColumn(columns);
        const passwordCol = pickAdminPasswordColumn(columns);

        if (!passwordCol) {
            throw new Error('No password column found in Admin table');
        }

        const [rows] = await connection.execute(`SELECT \`${idCol}\` AS adminId, \`${passwordCol}\` AS passwordValue FROM Admin`);

        let hashedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
            const adminId = row.adminId;
            const passwordValue = row.passwordValue == null ? '' : String(row.passwordValue);

            if (!passwordValue || isBcryptHash(passwordValue)) {
                skippedCount += 1;
                continue;
            }

            const hashed = bcrypt.hashSync(passwordValue, BCRYPT_SALT_ROUNDS);
            await connection.execute(
                `UPDATE Admin SET \`${passwordCol}\` = ? WHERE \`${idCol}\` = ?`,
                [hashed, adminId]
            );
            hashedCount += 1;
        }

        console.log(`Done. Hashed ${hashedCount} password(s), skipped ${skippedCount}.`);
    } finally {
        await connection.end();
    }
}

run().catch(err => {
    console.error('Failed to hash admin passwords:', err.message);
    process.exit(1);
});
