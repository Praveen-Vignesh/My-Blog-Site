const express = require('express');

const { Pool } = require('pg');
const db = require('./db');

const bcrypt = require('bcrypt');

const cookieParser = require('cookie-parser');
const requireAuth = require('./middleware');
const { SESSION_COOKIE, generateSessionToken, hashToken } = require('./session');


const app = express();
app.use(express.json());
app.use(cookieParser());


app.get('/api/test', async(req, res) => {
        try{
            const result = await db.query('SELECT NOW()');
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
            return res.status(400).json({error: 'Username and password are required.'});
        }
        const userQuery = `SELECT id, password_hash from users WHERE username = $1`;
        const userResult = await db.query(userQuery, [username])
        
        if(userResult.rowCount == 0){
            return res.status(401).json({error: 'Unauthorized: Invalid credentials.'});
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch){
            return res.status(401).json({error: 'Unauthorized: Invalid credentials.'});
        }

        const sessionToken = generateSessionToken();
        const sessionId = hashToken(sessionToken);

        const maxAge = 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + maxAge);

        // Opportunistically prune expired sessions so the table doesn't grow
        // unbounded with dead rows.
        await db.query(`DELETE FROM sessions WHERE expires_at <= NOW()`);

        const sessionQuery = `INSERT INTO sessions(id, user_id, expires_at) VALUES ($1, $2, $3)`;

        await db.query(sessionQuery, [sessionId, user.id, expiresAt]);

        // The client only ever receives the raw token; the DB only ever stores its hash.
        res.cookie(SESSION_COOKIE, sessionToken, {
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

app.post('/api/auth/logout', requireAuth, async (req, res) => {
    try{
        const sessionToken = req.cookies[SESSION_COOKIE];

        if (sessionToken) {
            const sessionId = hashToken(sessionToken);
            const deleteSessionQuery = `DELETE FROM sessions WHERE id = $1;`;
            await db.query(deleteSessionQuery, [sessionId]);
        }

        res.clearCookie(SESSION_COOKIE, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'

        });

        return res.status(200).json({message: "Successfully Logged out"});
    }catch(error) {
        console.error("[Auth error -logout]: ", error);
        return res.status(500).json({error: "Internal Server error"});
    }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
})