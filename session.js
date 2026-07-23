const crypto = require('crypto');

// Single source of truth for the auth cookie name so login, logout and the
// auth middleware can never drift out of sync.
const SESSION_COOKIE = 'sessionId';

// A high-entropy opaque token handed to the client in the cookie.
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// We persist only a hash of the token, never the raw value. If the sessions
// table ever leaks, the stored hashes cannot be replayed as valid cookies.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { SESSION_COOKIE, generateSessionToken, hashToken };
