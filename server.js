const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;
const pool = require('./db');

const chatRoutes = require('./chat');
const productRoutes = require("./routes/products");
const authRoutes = require('./routes/auth.routes');
const { optionalAuth } = require('./middleware/auth.middleware');

app.use('/api/chat', chatRoutes);
app.use("/api/products", productRoutes);
app.use('/api/auth', authRoutes);


app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Không tìm thấy sản phẩm'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Lỗi server'
        });
    }
});

app.post('/api/orders', optionalAuth, async (req, res) => {
    console.log('req.user:', req.user);
    console.log('header auth:', req.headers['authorization']);
    const { name, phone, address, cart, total } = req.body;
    const userId = req.user ? req.user.id : null;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            'INSERT INTO orders (customer_name, phone, address, total, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, phone, address, total, userId]
        );
        const orderId = orderResult.rows[0].id;

        for (const item of cart) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );
        };

        await client.query('COMMIT');
        res.status(201).json({ message: 'Đặt hàng thành công', orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi tạo đơn hàng' });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});