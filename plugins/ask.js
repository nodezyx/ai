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

// Interactive chatbot configuration menu
cmd({
  pattern: "chatbot2",
  alias: ["aichat", "ai", "autobot"],
  desc: "Interactive menu to configure AI chatbot settings",
  category: "settings",
  filename: __filename,
  react: "🤖"
}, async (conn, mek, m, {
  from, isGroup, isAdmins, isBotAdmins, isCreator, reply, isOwner
}) => {
  if (!isOwner) return reply("*❌ Only the bot owner can configure chatbot settings!*");

  const menuText =
    `> *CHATBOT SETTINGS*\n` +
    `> Current Status: *${AI_ENABLED === "true" ? "ENABLED" : "DISABLED"}*\n` +
    `> Group Mode: *${AI_GROUPS === "true" ? "ENABLED" : "DISABLED"}*\n\n` +
    `*Reply with one of the following:*\n\n` +
    `1. ✅ Enable in Private Chats\n` +
    `2. 👥 Enable in Groups\n` +
    `3. 🌐 Enable Everywhere\n` +
    `4. ❌ Disable Completely\n\n` +
    `╭───────────────\n│  🤖 AI CHATBOT SETTINGS\n╰───────────────◆`;

  const sent = await conn.sendMessage(from, {
    text: menuText
  }, { quoted: mek });

  const msgId = sent.key.id;

  const handler = async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.message) return;

    const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (quotedId !== msgId) return;

    const response =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    const options = {
      "1": { enabled: "true", groups: "false", text: "✅ AI Chatbot has been enabled for private chats only!" },
      "2": { enabled: AI_ENABLED, groups: "true", text: "✅ AI Chatbot has been enabled for groups!" },
      "3": { enabled: "true", groups: "true", text: "✅ AI Chatbot has been enabled everywhere!" },
      "4": { enabled: "false", groups: "false", text: "❌ AI Chatbot has been completely disabled!" }
    };

    const chosen = options[response.trim()];
    if (!chosen) {
      await conn.sendMessage(from, { text: "❌ Invalid option. Reply with 1, 2, 3 or 4." }, { quoted: msg });
      return;
    }

    // Update settings
    AI_ENABLED = chosen.enabled;
    AI_GROUPS = chosen.groups;
    
    await setConfig("AI_ENABLED", chosen.enabled);
    await setConfig("AI_GROUPS", chosen.groups);

    await conn.sendMessage(from, {
      text: chosen.text
    }, { quoted: msg });

    conn.ev.off("messages.upsert", handler);
  };

  conn.ev.on("messages.upsert", handler);
  setTimeout(() => conn.ev.off("messages.upsert", handler), 60000); // 1 minute timeout
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
        
        // Prevent bot from responding to its own messages
        if (m.key.fromMe) return;
        
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
        
        // Prevent bot from responding to its own messages
        if (m.key.fromMe) return;
        
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
