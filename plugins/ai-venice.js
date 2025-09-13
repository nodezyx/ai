const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
    timeout: 15000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
    }
});

// Venice AI API configuration
const VENICE_API_URL = 'https://api-toxxic.zone.id/api/ai/venice';

// Utility function to call Venice AI
async function callVeniceAI(prompt) {
    try {
        const apiUrl = `${VENICE_API_URL}?prompt=${encodeURIComponent(prompt)}`;
        const response = await axiosInstance.get(apiUrl);
        
        if (!response.data?.result) {
            throw new Error('Invalid API response');
        }
        
        return response.data.data || 'No response from AI';
    } catch (error) {
        console.error('Venice AI API Error:', error);
        
        if (error.response?.status === 404) {
            throw new Error('Venice AI service is temporarily unavailable');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - AI server is busy');
        } else {
            throw new Error('Failed to get response from Venice AI');
        }
    }
}

// Utility function to format AI response
function formatAIResponse(response, prompt) {
    // Remove any markdown formatting and clean up the response
    let cleanResponse = response
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1')     // Remove italics
        .replace(/`(.*?)`/g, '$1')       // Remove code blocks
        .replace(/\n{3,}/g, '\n\n');     // Limit consecutive newlines
    
    return `🧠 *Venice AI* 🤖\n\n` +
           `💭 *Your Prompt:*\n${prompt}\n\n` +
           `🤖 *AI Response:*\n${cleanResponse}\n\n` +
           `${Config.FOOTER || 'Powered by Venice AI • Toxxic API'}`;
}

// Main Venice AI command
cmd({
    pattern: 'venice',
    alias: ['vai', 'vask', 'vchat', 'veniceai'],
    desc: 'Chat with Venice AI - Advanced artificial intelligence',
    category: 'ai',
    react: '🤖',
    use: '<your question or prompt>',
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('🤖 *Subzero AI* 🧠\n\n' +
                        'Chat with advanced artificial intelligence\n\n' +
                        '*Usage:* .venice <your question>\n' +
                        'Examples:\n' +
                        `• ${Config.PREFIX}venice Hello, how are you?\n` +
                        `• ${Config.PREFIX}venice Explain quantum physics\n` +
                        `• ${Config.PREFIX}venice Write a poem about nature\n\n` +
                        `${Config.FOOTER || 'Powered by Venice AI • Toxxic API'}`);
        }

        // Send processing reaction
        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        // Show typing indicator
        await conn.sendPresenceUpdate('composing', mek.chat);

        // Call Venice AI API
        const aiResponse = await callVeniceAI(text);

        // Format the response
        const formattedResponse = formatAIResponse(aiResponse, text);

        // Send the AI response
        await reply(formattedResponse);

        // Send success reaction
        await conn.sendMessage(mek.chat, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Venice AI Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        
        let errorMessage = `❌ *Error:* ${error.message || 'Failed to process your request'}\n\n`;
        
        if (error.message.includes('unavailable') || error.message.includes('timeout')) {
            errorMessage += '💡 *Tip:* The AI service might be busy. Please try again in a few moments.';
        } else {
            errorMessage += '💡 *Tip:* Make sure your prompt is clear and try again.';
        }
        
        errorMessage += `\n\n${Config.FOOTER || 'Powered by Venice AI • Toxxic API'}`;
        
        await reply(errorMessage);
    }
});

