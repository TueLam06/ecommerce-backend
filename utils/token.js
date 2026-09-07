const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET chưa được set trong file .env');
}

function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyTokenString(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyTokenString };