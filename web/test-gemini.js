const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in .env');
    process.exit(1);
}

console.log('✓ API Key loaded:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function testConnection() {
    try {
        console.log('Testing Gemini API connection...');
        const result = await model.generateContent('Say "Hello from Managify!"');
        const response = result.response;
        const text = response.text();
        console.log('✓ Gemini Response:', text);
        console.log('✓ Connection successful!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testConnection();
