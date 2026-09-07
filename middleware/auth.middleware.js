const { verifyTokenString } = require('../utils/token');

// Middleware bắt buộc phải đăng nhập mới được đi tiếp
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']; // dạng: "Bearer <token>"

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Thiếu token xác thực' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyTokenString(token);
        req.user = decoded; // { id, email, role } — dùng ở các route sau
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token đã hết hạn, vui lòng đăng nhập lại' });
        }
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
}

// Middleware chỉ cho phép admin đi tiếp (dùng sau verifyToken)
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được phép thực hiện hành động này' });
    }
    next();
}

// Middleware "tuỳ chọn": nếu có token thì gắn req.user, không có cũng không lỗi
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = verifyTokenString(token);
        } catch (err) {
            // token sai/hết hạn thì bỏ qua, coi như khách vãng lai
        }
    }
    next();
}

module.exports = { verifyToken, requireAdmin, optionalAuth };