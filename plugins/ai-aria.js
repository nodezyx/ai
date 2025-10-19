const axios = require('axios');
const { cmd } = require('../command');
const { getConfig, setConfig } = require("../lib/configdb");
const config = require("../config");

// Default AI state
let ARIA_ENABLED = "false";
let ARIA_GROUPS = "false";

// Initialize AI state on startup
(async () => {
    const savedState = await getConfig("ARIA_ENABLED");
    const savedGroups = await getConfig("ARIA_GROUPS");
    if (savedState) ARIA_ENABLED = savedState;
    if (savedGroups) ARIA_GROUPS = savedGroups;
})();

// API configuration
const ARIA_API = "https://kaiz-apis.gleeze.com/api/aria";
const API_KEY = "cf2ca612-296f-45ba-abbc-473f18f991eb";

// Aria message template
const aria = {
  key: {
    remoteJid: "status@broadcast",
    fromMe: false,
    participant: "13135550003@s.whatsapp.net"
  },
  message: {
    contactMessage: {
      displayName: "Aria AI",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:Aria AI
TEL;type=CELL;type=VOICE;waid=13135550003:+1 3135550003
END:VCARD`
    }
  }
};

// Process Aria request
async function processAriaRequest(text, userId, userName) {
    try {
        // Build API URL
        const apiUrl = `${ARIA_API}?ask=${encodeURIComponent(text)}&uid=${userId}&apikey=${API_KEY}`;
        
        // Call Aria API
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const ariaData = response.data;

        if (ariaData && ariaData.response) {
            let formattedResponse = ariaData.response;
            
            // Truncate if too long
            if (formattedResponse.length > 3500) {
                formattedResponse = formattedResponse.substring(0, 3500) + '...\n\n*Response truncated due to length*';
            }
            
            return formattedResponse;
        } else {
            return "❌ I couldn't generate a response. Please try again.";
        }
    } catch (error) {
        console.error('Aria processing error:', error);
        return "❌ An error occurred while processing your request. Please try again later.";
    }
}

// Aria chatbot enable/disable command
cmd({
    pattern: "aria",
    alias: ["ariabot", "assistant"],
    desc: "Enable or disable Aria AI chatbot responses",
    category: "settings",
    filename: __filename,
    react: "🤖"
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        ARIA_ENABLED = "true";
        await setConfig("ARIA_ENABLED", "true");
        return reply("🌟 Aria AI chatbot is now enabled");
    } else if (status === "off") {
        ARIA_ENABLED = "false";
        await setConfig("ARIA_ENABLED", "false");
        return reply("🌟 Aria AI chatbot is now disabled");
    } else if (status === "group") {
        const groupStatus = args[1]?.toLowerCase();
        if (groupStatus === "on") {
            ARIA_GROUPS = "true";
            await setConfig("ARIA_GROUPS", "true");
            return reply("🌟 Aria AI chatbot is now enabled for groups");
        } else if (groupStatus === "off") {
            ARIA_GROUPS = "false";
            await setConfig("ARIA_GROUPS", "false");
            return reply("🌟 Aria AI chatbot is now disabled for groups");
        } else {
            return reply(`Group Aria state: ${ARIA_GROUPS === "true" ? "ON" : "OFF"}\nUsage: .aria group on/off`);
        }
    } else {
        return reply(`Current Aria state: ${ARIA_ENABLED === "true" ? "ON" : "OFF"}\nGroup Aria state: ${ARIA_GROUPS === "true" ? "ON" : "OFF"}\nUsage: .aria on/off/group on/group off`);
    }
});

// Aria Chatbot - Auto reply to messages
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
        // Check if Aria is disabled
        if (ARIA_ENABLED !== "true") return;

        // Skip if it's a group and group Aria is disabled
        if (isGroup && ARIA_GROUPS !== "true") return;

        // Prevent bot responding to its own messages or commands
        if (!body || m.key.fromMe || body.startsWith(config.PREFIX)) return;

        // Ignore very short messages
        if (body.length < 2) return;

        // Get user ID
        const userId = sender.split('@')[0];

        // Process the request
        const ariaResponse = await processAriaRequest(body, userId, sender.split('@')[0]);

        // Send response with Aria template
        await conn.sendMessage(from, {
            text: ariaResponse
        }, { quoted: aria });

    } catch (err) {
        console.error("Aria Chatbot Error:", err.message);
    }
});

// Manual Aria command for specific requests
cmd({
    pattern: "askai",
    alias: ["question", "quiz"],
    desc: "Ask Aria AI a question",
    category: "AI",
    filename: __filename,
    react: "❓"
}, async (conn, mek, m, { from, args, reply, sender, name }) => {
    try {
        const question = args.join(' ') || "Hello, how can you help me?";

        if (!question || question.length < 2) {
            return reply("❌ Please provide a question to ask Aria.");
        }

        // Get user ID
        const userId = sender.split('@')[0];

        await reply("💭 Aria is thinking...");

        // Process the request
        const ariaResponse = await processAriaRequest(question, userId, name);

        // Send response with Aria template
        await conn.sendMessage(from, {
            text: ariaResponse
        }, { quoted: aria });

    } catch (error) {
        console.error('Aria command error:', error);
        await reply("❌ An error occurred. Please try again later.");
    }
});

// Aria information command
cmd({
    pattern: "ariainfo",
    alias: ["aboutaria", "ariahelp"],
    desc: "Get information about Aria AI",
    category: "AI",
    filename: __filename,
    react: "ℹ️"
}, async (conn, mek, m, { from, reply }) => {
    const infoText = 
        `🌟 *Aria AI Information*\n\n` +
        `Aria is an advanced AI assistant powered by advanced language models.\n\n` +
        `*Features:*\n` +
        `• Answer questions and provide information\n` +
        `• Real-time data and current events\n` +
        `• Friendly and helpful responses\n\n` +
        `*Commands:*\n` +
        `• .aria on/off - Enable/disable auto-reply\n` +
        `• .aria group on/off - Enable/disable in groups\n` +
        `• .ask [question] - Ask Aria a question\n` +
        `• .ariainfo - Show this help message\n\n` +
        `*Current Status:*\n` +
        `Auto-reply: ${ARIA_ENABLED === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n` +
        `Group responses: ${ARIA_GROUPS === "true" ? "✅ ENABLED" : "❌ DISABLED"}`;

    await reply(infoText);
});

// Status command to check current settings
cmd({
    pattern: "ariastatus",
    alias: ["astatus", "ariastat"],
    desc: "Check current Aria AI status",
    category: "settings",
    filename: __filename,
    react: "📊"
}, async (conn, mek, m, { from, reply }) => {
    const status = await reply(
        `📊 *Aria AI Status*\n\n` +
        `Auto-reply: ${ARIA_ENABLED === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n` +
        `Group responses: ${ARIA_GROUPS === "true" ? "✅ ENABLED" : "❌ DISABLED"}\n\n` +
        `Use .aria to configure settings\n` +
        `Use .ask to ask questions manually`
    );
});

module.exports = {
    ARIA_ENABLED,
    ARIA_GROUPS,
    processAriaRequest
};
