const express = require('express');
const router = express.Router();
const pool = require('./db');
const model = require('./gemini');
const { z } = require('zod')

const chatResponseSchema = z.object({
    message: z.string().describe("Câu trả lời bằng lời cho khách hàng"),
    productIds: z.array(z.number()).describe("Danh sách id sản phẩm được gợi ý, để trống nếu không có sản phẩm phù hợp"),
})

const buildSystemPrompt = require('./prompts/systemPrompt');
const structuredModel = model.withStructuredOutput(chatResponseSchema);

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log("1. Bắt đầu, message:", message);
        const result = await pool.query('SELECT * FROM products');
        console.log("2. Đã lấy xong products từ DB");
        const productList = result.rows
            .map(p => `- id ${p.id}: ${p.name} - ${p.price}đ. ${p.description}`)
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
        console.log("3. Chuẩn bị gọi Gemini...");

        const response = await structuredModel.invoke(conversation);
        console.log("4. Gemini đã trả lời:", response);
        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi xử lý chatbot' });
    }
});

module.exports = router;