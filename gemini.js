require('dotenv').config();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-3.6-flash',
});

module.exports = model;
