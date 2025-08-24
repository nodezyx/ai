const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { cmd } = require('../command');

// API configuration
const GEMINI_API = "https://kaiz-apis.gleeze.com/api/gemini-flash-2.0";
const API_KEY = "cf2ca612-296f-45ba-abbc-473f18f991eb";

// Upload image to Catbox
async function uploadToCatbox(imageBuffer) {
    try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', imageBuffer, {
            filename: 'upload.jpg',
            contentType: 'image/jpeg'
        });
        
        const response = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders()
        });
        
        return response.data;
    } catch (error) {
        console.error('Error uploading to Catbox:', error);
        return null;
    }
}

// Gemini AI command
cmd({
    pattern: "gemini",
    alias: ["ai", "googleai", "ask"],
    desc: "Interact with Gemini Flash 2.0 AI - ask questions or analyze images",
    category: "AI",
    filename: __filename,
    react: "🤖"
}, async (conn, mek, m, { from, args, reply, quotedMsg, sender, name }) => {
    try {
        const isImageAnalysis = quotedMsg && (quotedMsg.image || quotedMsg.video);
        
        if (!args[0] && !isImageAnalysis) {
            return reply(
                '❌ *Error*\n' +
                'Please provide a question or quote an image to analyze.\n\n' +
                '*Usage (Question):* .gemini [your question]\n' +
                '*Usage (Image Analysis):* Reply to an image with .gemini [optional question]'
            );
        }

        const question = args.join(' ');
        let imageUrl = null;

        // Process image if available
        if (isImageAnalysis) {
            await reply(
                '⏳ *Processing Image*\n' +
                'Downloading and preparing the image for analysis...\n' +
                'Please wait a moment...'
            );

            try {
                // Download the media
                const mediaBuffer = await conn.downloadMediaMessage(quotedMsg);
                
                // Upload to Catbox
                const catboxUrl = await uploadToCatbox(mediaBuffer);
                
                if (catboxUrl) {
                    imageUrl = catboxUrl;
                } else {
                    return reply(
                        '❌ *Upload Error*\n' +
                        'Failed to upload the image for analysis.\n' +
                        'Please try again later.'
                    );
                }
            } catch (error) {
                console.error('Error processing image:', error);
                return reply(
                    '❌ *Image Error*\n' +
                    'An error occurred while processing the image.\n' +
                    'Please try again later.'
                );
            }
        }

        // Show processing message
        await reply(
            `⏳ *Thinking*\nQuerying Gemini Flash 2.0${imageUrl ? ' with image analysis' : ''}:\n${question || 'Analyzing image...'}\nPlease wait for the response...`
        );

        try {
            // Use actual user ID for memory (remove @s.whatsapp.net)
            const uid = sender.split('@')[0];
            
            // Build API URL
            let apiUrl = `${GEMINI_API}?q=${encodeURIComponent(question || 'Describe this image.')}&uid=${uid}&apikey=${API_KEY}`;
            
            if (imageUrl) {
                apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;
            }

            // Call Gemini API
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const geminiData = response.data;

            if (geminiData && geminiData.response) {
                // Format response to fit within WhatsApp message limits
                let formattedResponse = geminiData.response;
                if (formattedResponse.length > 3500) {
                    formattedResponse = formattedResponse.substring(0, 3500) + '...\n\n*Response truncated due to length*';
                }
                
                return reply(
                    `🤖 *Gemini Response*\n\n${formattedResponse}` + 
                    (imageUrl ? `\n\n📷 *Image Analyzed:* ${imageUrl}` : '') +
                    `\n\n_User ID: ${uid}_`
                );
            } else {
                return reply(
                    '❓ *Hmm...*\n' +
                    'Gemini Flash 2.0 did not provide a response.\n' +
                    'Please try asking again later.'
                );
            }
        } catch (error) {
            console.error('Error querying Gemini:', error);
            
            if (error.code === 'ECONNABORTED') {
                return reply(
                    '⏰ *Timeout Error*\n' +
                    'The request took too long to process.\n' +
                    'Please try again with a simpler query.'
                );
            }
            
            return reply(
                '❌ *Error*\n' +
                'An error occurred while communicating with Gemini Flash 2.0.\n' +
                'Please try again later.'
            );
        }
    } catch (error) {
        console.error('Gemini command error:', error);
        return reply(
            '❌ *Unexpected Error*\n' +
            'Something went wrong. Please try again later.'
        );
    }
});

// Enable/disable command
cmd({
    pattern: "aichat",
    alias: ["aion", "aioff"],
    desc: "Enable or disable AI responses in chat",
    category: "AI",
    filename: __filename,
    react: "⚙️"
}, async (conn, mek, m, { from, args, reply, isOwner }) => {
    if (!isOwner) return reply("📛 Only the owner can use this command!");
    
    if (!args[0]) {
        return reply(
            '⚙️ *AI Status*\n' +
            'AI responses are currently: ENABLED\n\n' +
            'Use: .aichat on - to enable\n' +
            'Use: .aichat off - to disable'
        );
    }
    
    const action = args[0].toLowerCase();
    if (action === 'on') {
        return reply(
            '✅ *AI Enabled*\n' +
            'AI responses are now ENABLED\n' +
            'The bot will respond to messages'
        );
    } else if (action === 'off') {
        return reply(
            '❌ *AI Disabled*\n' +
            'AI responses are now DISABLED\n' +
            'The bot will not respond to messages'
        );
    } else {
        return reply(
            '❌ *Invalid Command*\n' +
            'Please use: .aichat on/off'
        );
    }
});

module.exports = {
    uploadToCatbox,
    GEMINI_API
};
