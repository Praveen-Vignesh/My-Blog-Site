const { Pool, Query } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// A pooled client can emit 'error' while sitting idle (e.g. the database
// restarts or drops the connection). Without a listener Node treats this as an
// unhandled 'error' event and crashes the whole process, so we log it and let
// the pool recycle the bad client instead.
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client:', err);
});

module.exports = {
    query : (queryString, params) => pool.query(queryString, params),
}
