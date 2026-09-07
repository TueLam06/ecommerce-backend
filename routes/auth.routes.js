const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const pool = require('../db');
const { generateToken } = require('../utils/token');
const { verifyToken } = require('../middleware/auth.middleware');

const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Thiếu name, email hoặc password' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password phải có ít nhất 6 ký tự' });
    }

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email đã được sử dụng' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role, created_at`,
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Lỗi server khi đăng ký' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Thiếu email hoặc password' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Email hoặc password không đúng' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Email hoặc password không đúng' });
        }

        const token = generateToken(user);

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy user' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;