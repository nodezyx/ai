const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

cmd({
    pattern: "veo3",
    alias: ["veo", "videogen", "aivideo"],
    desc: "Generate AI videos using Veo3",
    category: "ai",
    react: "🎬",
    use: '<prompt>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎬 *Usage:* .veo3 <prompt>\nExample: .veo3 A futuristic cityscape with flying cars and neon lights');

        // Send initial reaction
        try {
            if (mek?.key?.id) {
                await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });
            }
        } catch (reactError) {
            console.error('Reaction error:', reactError);
        }

        // Show generating message
        await reply('🎬 Generating your AI video... This may take a few moments.');

        // Make API request to Veo3
        const apiUrl = 'https://draculamd-bot.kingdrax.my.id/smartVeo3';
        
        const response = await axios.post(apiUrl, {
            prompt: text
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 300000 // 5 minutes timeout for video generation
        });

        const data = response.data;

        if (!data.success || !data.downloadUrl) {
            return reply('❌ Failed to generate video. Please try again with a different prompt.');
        }

        // Send success reaction
        try {
            if (mek?.key?.id) {
                await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });
            }
        } catch (reactError) {
            console.error('Success reaction failed:', reactError);
        }

        // Send the generated video
        await conn.sendMessage(mek.chat, {
            video: { url: data.downloadUrl },
            caption: `🎬 *Veo3 AI Video Generated*\n\n` +
                     `🔹 *Prompt:* ${data.prompt}\n` +
                     `🔸 *Generated at:* ${data.timestamp || new Date().toLocaleString()}\n\n` +
                     `> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error('Veo3 Error:', error);
        
        if (error.code === 'ECONNABORTED') {
            reply('⏰ Video generation timed out. The prompt might be too complex or the server is busy. Please try again.');
        } else if (error.response?.status === 429) {
            reply('🚫 Rate limit exceeded. Please wait a few minutes before trying again.');
        } else if (error.response?.status >= 500) {
            reply('🔧 Server error. The Veo3 service might be temporarily unavailable. Please try again later.');
        } else {
            reply('❌ Error generating video: ' + (error.message || 'Please try again with a different prompt'));
        }

        // Send error reaction
        try {
            if (mek?.key?.id) {
                await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            }
        } catch (reactError) {
            console.error('Error reaction failed:', reactError);
        }
    }
});

// Additional command for Veo3 with different styles
