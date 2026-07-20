const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'blog_local',
    password: 'praveen',
    port: 5432
});

app.get('/api/test', async(req, res) => {
        try{
            const result = await pool.query('SELECT NOW()');
            res.json(result.rows);
        }
        catch(err){
            console.error('Database connection err', err);
            res.status(500).json({error: 'Failed to connect to database'});
        }
    }
);


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
})