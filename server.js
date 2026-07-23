const express = require('express');

const { Pool, Client } = require('pg');
const db = require('./db');

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const cookieParser = require('cookie-parser');
app.use(cookieParser());


const app = express();
app.use(express.json());


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

app.post('/api/auth/login', async (req, res) => {
    try{
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({error: 'Username or password are required.'});
        }
        const userQuery = `SELECT id, password_hash from users WHERE $1`;
        const userResult = await db.query(userQuery, [username])
        
        if(userResult.rowCount == 0){
            return res.status(401).json({error: 'Unauthorized: Invalid credentials.'});
        }

        const user = userResult[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch){
            return res.status(401).json({error: 'Unauthorised: Invalid crefentials.'});
        }

        const sessionID = crypto.randomUUID();

        const maxAge = 24 * 60 * 60 * 1000;
        const expiresAT = new Date(Date.now() + maxAge);

        const sessionQuery = `INSERT INTO sessions(id, user_id, expires_at) VALUES ($1, $2, $3)`;

        await db.query(sessionQuery, [sessionID, user.id, expiresAT]);

        res.cookie('sessionId', sessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: maxAge
        });

        return res.status(200).json({message: 'Authentication successful', userID: user.id});

    } catch(err){
        console.error('Auth-error login:', err);
        return res.status(500).json({error: 'Internal Server Error'});
    }

})


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
})