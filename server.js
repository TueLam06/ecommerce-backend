const cors = require('cors');
const express = require('express');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;
const pool = require('./db');

const chatRoutes = require('./chat');
app.use('/api/chat', chatRoutes);

app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

app.post('/api/orders', async (req, res) => {
    const { name, phone, address, cart, total } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            'INSERT INTO orders (customer_name, phone, address, total) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, phone, address, total]
        );
        const orderId = orderResult.rows[0].id;

        for (const item of cart) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

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