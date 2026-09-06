const express = require('express');
const router = express.Router();
const pool = require('./db');
const model = require('./gemini');

const buildSystemPrompt = require('./prompts/systemPrompt');

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;
        const result = await pool.query('SELECT * FROM products');
        const productList = result.rows
            .map(p => `- ${p.name}: ${p.price}đ. ${p.description}`)
            .join('\n');

        const systemPrompt = buildSystemPrompt(productList);

        const conversation = [
            ["system", systemPrompt],
            ...history.map(msg => [
                msg.sender === 'user' ? 'human' : 'ai',
                msg.text,
            ]),
            ["human", message]
        ]

        const response = await model.invoke(conversation);

        res.json({ reply: response.content });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi xử lý chatbot' });
    }
});

module.exports = router;