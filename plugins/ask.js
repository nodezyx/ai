const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');
const { getConfig, setConfig } = require("../lib/configdb");

// Default AI state
let AI_ENABLED = "false";
let AI_GROUPS = "false";

// Initialize AI state on startup
(async() => {
    const savedState = await getConfig("AI_ENABLED");
    const savedGroups = await getConfig("AI_GROUPS");
    if (savedState) AI_ENABLED = savedState;
    if (savedGroups) AI_GROUPS = savedGroups;
})();

// API configuration
const GEMINI_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
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
            headers: formData.getHeaders(),
            timeout: 30000
        });
        
        return response.data;
    } catch (error) {
        console.error('Error uploading to Catbox:', error);
        return null;
    }
}

// Process AI request
async function processAIRequest(text, imageBuffer, userId, userName) {
    try {
        let imageUrl = null;
        
        // Upload image if provided
        if (imageBuffer) {
            imageUrl = await uploadToCatbox(imageBuffer);
            if (!imageUrl) {
                return "❌ Failed to process the image. Please try again.";
            }
        }
        
        // Build API URL
        let apiUrl = `${GEMINI_API}?q=${encodeURIComponent(text || 'Describe this image')}&uid=${userId}&apikey=${API_KEY}`;
        
        if (imageUrl) {
            apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;
        }
        
        // Call Gemini API
        const response = await axios.get(apiUrl, { timeout: 45000 });
        const geminiData = response.data;

        if (geminiData && geminiData.response) {
            let formattedResponse = geminiData.response;
            
            // Remove personalized greeting if present
            if (formattedResponse.includes("Okay, Darrell, here's what I see in the image:")) {
                formattedResponse = formattedResponse.replace("Okay, Darrell, here's what I see in the image:", "Here's what I see in the image:");
            }
            
            // Truncate if too long
            if (formattedResponse.length > 3500) {
                formattedResponse = formattedResponse.substring(0, 3500) + '...\n\n*Response truncated due to length*';
            }
            
            return formattedResponse;
        } else {
            return "❌ I couldn't generate a response. Please try again.";
        }
    } catch (error) {
        console.error('AI processing error:', error);
        return "❌ An error occurred while processing your request. Please try again later.";
    }
}

// Chatbot command to enable/disable AI
cmd({ 
    pattern: "chatbot2", 
    alias: ["aichat", "ai", "autobot"], 
    desc: "Enable or disable AI chatbot auto-reply", 
    category: "settings", 
    filename: __filename, 
    react: "🤖" 
}, async (conn, mek, m, { from, args, isOwner, reply, sender }) => { 
    if (!isOwner) return reply("📛 Only the owner can use this command!");
    
    if (!args[0]) {
        return reply(
            `⚙️ *AI Chatbot Status*\n\n` +
            `Auto-reply: ${AI_ENABLED === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n` +
            `Group responses: ${AI_GROUPS === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n\n` +
            `Use: .chatbot on - Enable in PMs\n` +
            `Use: .chatbot group on - Enable in groups\n` +
            `Use: .chatbot off - Disable completely`
        );
    }
    
    const action = args[0].toLowerCase();
    const secondParam = args[1] ? args[1].toLowerCase() : null;
    
    if (action === 'on' && secondParam === 'group') {
        AI_GROUPS = "true";
        await setConfig("AI_GROUPS", "true");
        return reply("✅ AI Chatbot has been enabled for groups!");
    } else if (action === 'off' && secondParam === 'group') {
        AI_GROUPS = "false";
        await setConfig("AI_GROUPS", "false");
        return reply("❌ AI Chatbot has been disabled for groups!");
    } else if (action === 'on') {
        AI_ENABLED = "true";
        await setConfig("AI_ENABLED", "true");
        return reply("✅ AI Chatbot has been enabled for private messages!");
    } else if (action === 'off') {
        AI_ENABLED = "false";
        AI_GROUPS = "false";
        await setConfig("AI_ENABLED", "false");
        await setConfig("AI_GROUPS", "false");
        return reply("❌ AI Chatbot has been completely disabled!");
    } else {
        return reply("❌ Invalid option! Use: .chatbot on/off/group on/group off");
    }
});

// AI message template
const ai = {
  key: {
    remoteJid: "status@broadcast",
    fromMe: false,
    participant: "13135550002@s.whatsapp.net"
  },
  message: {
    contactMessage: {
      displayName: "Gemini AI",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:Gemini AI
TEL;type=CELL;type=VOICE;waid=13135550002:+1 3135550002
END:VCARD`
    }
  }
};

// Auto-reply AI handler - Using "on: body" like in your example
cmd({
    on: "body"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    isBotAdmins,
    isAdmins,
    reply
}) => {
    try {
        // Check if AI is disabled
        if (AI_ENABLED !== "true") return;
        
        // Skip if it's a group and group AI is disabled
        if (isGroup && AI_GROUPS !== "true") return;
        
        // Ignore commands and messages starting with prefixes
        if (!body || body.startsWith('.') || body.startsWith('!') || body.startsWith('/') || 
            body.startsWith('#') || body.startsWith('\\') || body.startsWith('@')) return;
            
        // Ignore very short messages
        if (body.length < 3) return;
        
        // Get user ID
        const userId = sender.split('@')[0];
        
        // Show typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Process the request
        const aiResponse = await processAIRequest(body, null, userId, sender.split('@')[0]);
        
        // Send response with AI template
        await conn.sendMessage(from, {
            text: `🤖 ${aiResponse}`
        }, { quoted: ai });
        
    } catch (error) {
        console.error('Auto-reply text error:', error);
        // Don't reply on error to avoid spam
    }
});

// Manual AI command for specific requests
cmd({
    pattern: "ai",
    alias: ["ask", "gemini"],
    desc: "Ask the AI a question or analyze an image",
    category: "AI",
    filename: __filename,
    react: "🤖"
}, async (conn, mek, m, { from, args, reply, quotedMsg, sender, name, isGroup }) => {
    try {
        // Check if quoted message has media
        const hasQuotedMedia = quotedMsg && (quotedMsg.image || quotedMsg.video);
        const question = args.join(' ') || (hasQuotedMedia ? "Describe this image" : "Hello, how can you help me?");
        
        // Get user ID
        const userId = sender.split('@')[0];
        
        let mediaBuffer = null;
        if (hasQuotedMedia) {
            await reply("📤 Processing media...");
            mediaBuffer = await conn.downloadMediaMessage(quotedMsg);
        }
        
        await reply("💭 Thinking...");
        
        // Process the request
        const aiResponse = await processAIRequest(question, mediaBuffer, userId, name);
        
        // Send response with AI template
        await conn.sendMessage(from, {
            text: `🤖 ${aiResponse}`
        }, { quoted: ai });
        
    } catch (error) {
        console.error('AI command error:', error);
        await reply("❌ An error occurred. Please try again later.");
    }
});

// Special handler for media messages
cmd({
    on: "media"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    isBotAdmins,
    isAdmins,
    reply
}) => {
    try {
        // Check if AI is disabled
        if (AI_ENABLED !== "true") return;
        
        // Skip if it's a group and group AI is disabled
        if (isGroup && AI_GROUPS !== "true") return;
        
        // Get user ID
        const userId = sender.split('@')[0];
        
        // Show typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Download the media
        const mediaBuffer = await conn.downloadMediaMessage(m);
        
        // Process the request with the image
        const aiResponse = await processAIRequest("Describe this image in detail", mediaBuffer, userId, sender.split('@')[0]);
        
        // Send response with AI template
        await conn.sendMessage(from, {
            text: `🤖 ${aiResponse}`
        }, { quoted: ai });
        
    } catch (error) {
        console.error('Auto-reply image error:', error);
        // Don't reply on error to avoid spam
    }
});

module.exports = {
    AI_ENABLED,
    AI_GROUPS,
    processAIRequest
};

/*const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');
const { getConfig, setConfig } = require("../lib/configdb");

// Default AI state
let AI_ENABLED = "false";
let AI_GROUPS = "false";

// Initialize AI state on startup
(async() => {
    const savedState = await getConfig("AI_ENABLED");
    const savedGroups = await getConfig("AI_GROUPS");
    if (savedState) AI_ENABLED = savedState;
    if (savedGroups) AI_GROUPS = savedGroups;
})();

// API configuration
const GEMINI_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
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
            headers: formData.getHeaders(),
            timeout: 30000
        });
        
        return response.data;
    } catch (error) {
        console.error('Error uploading to Catbox:', error);
        return null;
    }
}

// Process AI request
async function processAIRequest(text, imageBuffer, userId, userName) {
    try {
        let imageUrl = null;
        
        // Upload image if provided
        if (imageBuffer) {
            imageUrl = await uploadToCatbox(imageBuffer);
            if (!imageUrl) {
                return "❌ Failed to process the image. Please try again.";
            }
        }
        
        // Build API URL
        let apiUrl = `${GEMINI_API}?q=${encodeURIComponent(text || 'Describe this image')}&uid=${userId}&apikey=${API_KEY}`;
        
        if (imageUrl) {
            apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;
        }
        
        // Call Gemini API
        const response = await axios.get(apiUrl, { timeout: 45000 });
        const geminiData = response.data;

        if (geminiData && geminiData.response) {
            let formattedResponse = geminiData.response;
            
            // Remove personalized greeting if present
            if (formattedResponse.includes("Okay, Darrell, here's what I see in the image:")) {
                formattedResponse = formattedResponse.replace("Okay, Darrell, here's what I see in the image:", "Here's what I see in the image:");
            }
            
            // Truncate if too long
            if (formattedResponse.length > 3500) {
                formattedResponse = formattedResponse.substring(0, 3500) + '...\n\n*Response truncated due to length*';
            }
            
            return formattedResponse;
        } else {
            return "❌ I couldn't generate a response. Please try again.";
        }
    } catch (error) {
        console.error('AI processing error:', error);
        return "❌ An error occurred while processing your request. Please try again later.";
    }
}

// Chatbot command to enable/disable AI
cmd({ 
    pattern: "chatbot2", 
    alias: ["aichat", "ai", "autobot"], 
    desc: "Enable or disable AI chatbot auto-reply", 
    category: "settings", 
    filename: __filename, 
    react: "🤖" 
}, async (conn, mek, m, { from, args, isOwner, reply, sender }) => { 
    if (!isOwner) return reply("📛 Only the owner can use this command!");
    
    if (!args[0]) {
        return reply(
            `⚙️ *AI Chatbot Status*\n\n` +
            `Auto-reply: ${AI_ENABLED === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n` +
            `Group responses: ${AI_GROUPS === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n\n` +
            `Use: .chatbot on - Enable in PMs\n` +
            `Use: .chatbot group on - Enable in groups\n` +
            `Use: .chatbot off - Disable completely`
        );
    }
    
    const action = args[0].toLowerCase();
    const secondParam = args[1] ? args[1].toLowerCase() : null;
    
    if (action === 'on' && secondParam === 'group') {
        AI_GROUPS = "true";
        await setConfig("AI_GROUPS", "true");
        return reply("✅ AI Chatbot has been enabled for groups!");
    } else if (action === 'off' && secondParam === 'group') {
        AI_GROUPS = "false";
        await setConfig("AI_GROUPS", "false");
        return reply("❌ AI Chatbot has been disabled for groups!");
    } else if (action === 'on') {
        AI_ENABLED = "true";
        await setConfig("AI_ENABLED", "true");
        return reply("✅ AI Chatbot has been enabled for private messages!");
    } else if (action === 'off') {
        AI_ENABLED = "false";
        AI_GROUPS = "false";
        await setConfig("AI_ENABLED", "false");
        await setConfig("AI_GROUPS", "false");
        return reply("❌ AI Chatbot has been completely disabled!");
    } else {
        return reply("❌ Invalid option! Use: .chatbot on/off/group on/group off");
    }
});

// Auto-reply AI handler for text messages
cmd({ 
    on: "text"
}, async (conn, m, store, { from, body, sender, isGroup, isBotAdmins, isAdmins, reply, quotedMsg, name }) => { 
    try {
        // Check if AI is disabled
        if (AI_ENABLED !== "true") return;
        
        // Skip if it's a group and group AI is disabled
        if (isGroup && AI_GROUPS !== "true") return;
        
        // Ignore commands and messages starting with prefixes
        if (body.startsWith('.') || body.startsWith('!') || body.startsWith('/') || 
            body.startsWith('#') || body.startsWith('\\') || body.startsWith('@')) return;
            
        // Ignore very short messages
        if (body.length < 3) return;
        
        // Get user ID
        const userId = sender.split('@')[0];
        
        // Show typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Process the request
        const aiResponse = await processAIRequest(body, null, userId, name);
        
        // Send response
        await reply(`🤖 ${aiResponse}`);
        
    } catch (error) {
        console.error('Auto-reply text error:', error);
        // Don't reply on error to avoid spam
    }
});

// Auto-reply AI handler for images
cmd({ 
    on: "media"
}, async (conn, m, store, { from, body, sender, isGroup, isBotAdmins, isAdmins, reply, name }) => { 
    try {
        // Check if AI is disabled
        if (AI_ENABLED !== "true") return;
        
        // Skip if it's a group and group AI is disabled
        if (isGroup && AI_GROUPS !== "true") return;
        
        // Get user ID
        const userId = sender.split('@')[0];
        
        // Show typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Download the media
        const mediaBuffer = await conn.downloadMediaMessage(m);
        
        // Process the request with the image
        const aiResponse = await processAIRequest("Describe this image in detail", mediaBuffer, userId, name);
        
        // Send response
        await reply(`🤖 ${aiResponse}`);
        
    } catch (error) {
        console.error('Auto-reply image error:', error);
        // Don't reply on error to avoid spam
    }
});

// Manual AI command for specific requests
cmd({
    pattern: "ai",
    alias: ["ask", "gemini"],
    desc: "Ask the AI a question or analyze an image",
    category: "AI",
    filename: __filename,
    react: "🤖"
}, async (conn, mek, m, { from, args, reply, quotedMsg, sender, name, isGroup }) => {
    try {
        // Check if quoted message has media
        const hasQuotedMedia = quotedMsg && (quotedMsg.image || quotedMsg.video);
        const question = args.join(' ') || (hasQuotedMedia ? "Describe this image" : "Hello, how can you help me?");
        
        // Get user ID
        const userId = sender.split('@')[0];
        
        let mediaBuffer = null;
        if (hasQuotedMedia) {
            await reply("📤 Processing media...");
            mediaBuffer = await conn.downloadMediaMessage(quotedMsg);
        }
        
        await reply("💭 Thinking...");
        
        // Process the request
        const aiResponse = await processAIRequest(question, mediaBuffer, userId, name);
        
        // Send response
        await reply(`🤖 ${aiResponse}`);
        
    } catch (error) {
        console.error('AI command error:', error);
        await reply("❌ An error occurred. Please try again later.");
    }
});

module.exports = {
    AI_ENABLED,
    AI_GROUPS,
    processAIRequest
};

*/
/*const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');

// API configuration
const GEMINI_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
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
            headers: formData.getHeaders(),
            timeout: 30000
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
    alias: ["ai", "googleai", "ask", "vision"],
    desc: "Interact with Gemini Vision AI - ask questions or analyze images",
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

        const question = args.join(' ') || 'What do you see in this image?';
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
            `⏳ *Thinking*\nQuerying Gemini Vision${imageUrl ? ' with image analysis' : ''}:\n${question}\nPlease wait for the response...`
        );

        try {
            // Use actual user ID for memory (remove @s.whatsapp.net)
            const uid = sender.split('@')[0];
            
            // Build API URL
            let apiUrl = `${GEMINI_API}?q=${encodeURIComponent(question)}&uid=${uid}&apikey=${API_KEY}`;
            
            if (imageUrl) {
                apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;
            }

            // Call Gemini API
            const response = await axios.get(apiUrl, { timeout: 45000 });
            const geminiData = response.data;

            if (geminiData && geminiData.response) {
                // Format response to fit within WhatsApp message limits
                let formattedResponse = geminiData.response;
                
                // Remove "Okay, Darrell, here's what I see in the image:" if present
                if (formattedResponse.includes("Okay, Darrell, here's what I see in the image:")) {
                    formattedResponse = formattedResponse.replace("Okay, Darrell, here's what I see in the image:", "Here's what I see in the image:");
                }
                
                // Split into chunks if too long
                if (formattedResponse.length > 3500) {
                    const chunks = [];
                    while (formattedResponse.length > 0) {
                        let chunk = formattedResponse.substring(0, 3500);
                        const lastPeriod = chunk.lastIndexOf('.');
                        if (lastPeriod > 3000 && lastPeriod !== -1) {
                            chunk = formattedResponse.substring(0, lastPeriod + 1);
                        }
                        chunks.push(chunk);
                        formattedResponse = formattedResponse.substring(chunk.length);
                    }
                    
                    // Send first chunk
                    await reply(
                        `🤖 *Gemini Vision Response* (Part 1/${chunks.length})\n\n${chunks[0]}` + 
                        (imageUrl ? `\n\n📷 *Image Analyzed:* ${imageUrl}` : '')
                    );
                    
                    // Send remaining chunks after a delay
                    for (let i = 1; i < chunks.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await reply(
                            `🤖 *Gemini Vision Response* (Part ${i + 1}/${chunks.length})\n\n${chunks[i]}`
                        );
                    }
                } else {
                    return reply(
                        `🤖 *Gemini Vision Response*\n\n${formattedResponse}` + 
                        (imageUrl ? `\n\n📷 *Image Analyzed:* ${imageUrl}` : '') +
                        `\n\n_User ID: ${uid}_`
                    );
                }
            } else {
                return reply(
                    '❓ *Hmm...*\n' +
                    'Gemini Vision did not provide a response.\n' +
                    'Please try asking again later.'
                );
            }
        } catch (error) {
            console.error('Error querying Gemini Vision:', error);
            
            if (error.code === 'ECONNABORTED') {
                return reply(
                    '⏰ *Timeout Error*\n' +
                    'The request took too long to process.\n' +
                    'Please try again with a simpler query or smaller image.'
                );
            }
            
            return reply(
                '❌ *Error*\n' +
                'An error occurred while communicating with Gemini Vision.\n' +
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

// Quick analysis command for images
cmd({
    pattern: "analyze",
    alias: ["whatisthis", "describe"],
    desc: "Quickly analyze an image using Gemini Vision",
    category: "AI",
    filename: __filename,
    react: "🔍"
}, async (conn, mek, m, { from, args, reply, quotedMsg, sender }) => {
    if (!quotedMsg || !(quotedMsg.image || quotedMsg.video)) {
        return reply(
            '❌ *Error*\n' +
            'Please reply to an image with .analyze\n\n' +
            '*Usage:* Reply to an image with .analyze'
        );
    }

    // Set a simple question for analysis
    const question = "What do you see in this image? Describe it in detail.";
    
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
        
        if (!catboxUrl) {
            return reply(
                '❌ *Upload Error*\n' +
                'Failed to upload the image for analysis.\n' +
                'Please try again later.'
            );
        }

        // Use actual user ID
        const uid = sender.split('@')[0];
        
        // Build API URL
        const apiUrl = `${GEMINI_API}?q=${encodeURIComponent(question)}&uid=${uid}&imageUrl=${encodeURIComponent(catboxUrl)}&apikey=${API_KEY}`;

        // Call Gemini API
        const response = await axios.get(apiUrl, { timeout: 45000 });
        const geminiData = response.data;

        if (geminiData && geminiData.response) {
            let formattedResponse = geminiData.response;
            
            // Split into chunks if too long
            if (formattedResponse.length > 3500) {
                formattedResponse = formattedResponse.substring(0, 3500) + '...\n\n*Response truncated due to length*';
            }
            
            return reply(
                `🔍 *Image Analysis*\n\n${formattedResponse}` + 
                `\n\n📷 *Image URL:* ${catboxUrl}`
            );
        } else {
            return reply(
                '❓ *Analysis Failed*\n' +
                'Could not analyze this image.\n' +
                'Please try again with a different image.'
            );
        }
    } catch (error) {
        console.error('Analyze command error:', error);
        return reply(
            '❌ *Analysis Error*\n' +
            'Failed to analyze the image. Please try again later.'
        );
    }
});

module.exports = {
    uploadToCatbox,
    GEMINI_API
};
*/
/*const axios = require('axios');
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
*/
