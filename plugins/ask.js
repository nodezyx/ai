const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');
const { getConfig, setConfig } = require("../lib/configdb");
const config = require("../config");

// Default AI state
let AI_ENABLED = "false";
let AI_GROUPS = "false";

// Initialize AI state on startup
(async () => {
    const savedState = await getConfig("AI_ENABLED");
    const savedGroups = await getConfig("AI_GROUPS");
    if (savedState) AI_ENABLED = savedState;
    if (savedGroups) AI_GROUPS = savedGroups;
})();

// API configuration
const GEMINI_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
const API_KEY = "cf2ca612-296f-45ba-abbc-473f18f991eb";

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

// Simple chatbot enable/disable command
cmd({
    pattern: "chatbot2",
    alias: ["aichat", "subzerobot"],
    desc: "Enable or disable AI chatbot responses",
    category: "settings",
    filename: __filename,
    react: "✅"
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        AI_ENABLED = "true";
        await setConfig("AI_ENABLED", "true");
        return reply("🤖 AI chatbot is now enabled");
    } else if (status === "off") {
        AI_ENABLED = "false";
        await setConfig("AI_ENABLED", "false");
        return reply("🤖 AI chatbot is now disabled");
    } else if (status === "group") {
        const groupStatus = args[1]?.toLowerCase();
        if (groupStatus === "on") {
            AI_GROUPS = "true";
            await setConfig("AI_GROUPS", "true");
            return reply("🤖 AI chatbot is now enabled for groups");
        } else if (groupStatus === "off") {
            AI_GROUPS = "false";
            await setConfig("AI_GROUPS", "false");
            return reply("🤖 AI chatbot is now disabled for groups");
        } else {
            return reply(`Group AI state: ${AI_GROUPS === "true" ? "ON" : "OFF"}\nUsage: .chatbot group on/off`);
        }
    } else {
        return reply(`Current AI state: ${AI_ENABLED === "true" ? "ON" : "OFF"}\nGroup AI state: ${AI_GROUPS === "true" ? "ON" : "OFF"}\nUsage: .chatbot on/off/group on/group off`);
    }
});

// AI Chatbot - Auto reply to messages
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

        // Prevent bot responding to its own messages or commands
        if (!body || m.key.fromMe || body.startsWith(config.PREFIX)) return;

        // Ignore very short messages
        if (body.length < 2) return;

        // Get user ID
        const userId = sender.split('@')[0];

        // Process the request
        const aiResponse = await processAIRequest(body, null, userId, sender.split('@')[0]);

        // Send response with AI template
        await conn.sendMessage(from, {
            text: aiResponse
        }, { quoted: ai });

    } catch (err) {
        console.error("AI Chatbot Error:", err.message);
    }
});

// AI Chatbot - Auto reply to media messages
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

        // Prevent bot responding to its own messages
        if (m.key.fromMe) return;

        // Get user ID
        const userId = sender.split('@')[0];

        // Download the media
        const mediaBuffer = await conn.downloadMediaMessage(m);

        // Process the request with the image
        const aiResponse = await processAIRequest("Describe this image in detail", mediaBuffer, userId, sender.split('@')[0]);

        // Send response with AI template
        await conn.sendMessage(from, {
            text: aiResponse
        }, { quoted: ai });

    } catch (err) {
        console.error("AI Media Chatbot Error:", err.message);
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
}, async (conn, mek, m, { from, args, reply, quotedMsg, sender, name }) => {
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
            text: aiResponse
        }, { quoted: ai });

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
