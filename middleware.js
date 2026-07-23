const db = require('./db');
const { SESSION_COOKIE, hashToken } = require('./session');

const requireAuth = async (req, res, next) => {
    try{
        const sessionToken = req.cookies[SESSION_COOKIE];
        if(!sessionToken){
            return res.status(401).json({error: "Unauthorized: No Session Found."});
        }

        const sessionId = hashToken(sessionToken);
        const sessionQuery = `SELECT user_id FROM sessions WHERE id = $1 AND expires_at > NOW();`;

        const sessionResult = await db.query(sessionQuery, [sessionId]);

        if(sessionResult.rowCount == 0){
            return res.status(401).json({error: "Unauthorized: No Session Found."});
        }

        req.user = {
            id: sessionResult.rows[0].user_id
        };

        next();
    } catch(error){
        console.error("[Auth Middleware Error]: ", error);
        return res.status(500).json({error: "Internal Server error"});
    }
};

module.exports = requireAuth;