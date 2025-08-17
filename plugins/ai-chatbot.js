





const axios = require('axios');
const { cmd, commands } = require('../command');
const config = require("../config");
const { setConfig, getConfig } = require("../lib/configdb");
const ice = {
  key: {
    remoteJid: '120363025036063173@g.us',
    fromMe: false,
    participant: '0@s.whatsapp.net'
  },
  message: {
    groupInviteMessage: {
      groupJid: '120363025036063173@g.us',
      inviteCode: 'ABCD1234',
      groupName: 'WhatsApp ✅ • Group',
      caption: 'Subzero Smart Project',
      jpegThumbnail: null
    }
  }
}
// Default AI state if not set
let AIENABLED = "false"; // Default enabled

cmd({
    pattern: "chatbot",
    alias: ["aichat", "subzerobot"],
    desc: "Enable or disable AI chatbot responses",
    category: "settings",
    filename: __filename,
    react: "✅"
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        AIENABLED = "true";
        await setConfig("AIENABLED", "true");
        return reply("🤖 AI chatbot is now enabled");
    } else if (status === "off") {
        AIENABLED = "false";
        await setConfig("AIENABLED", "false");
        return reply("🤖 AI chatbot is now disabled");
    } else {
        return reply(`Current AI state: ${AIENABLED === "true" ? "ON" : "OFF"}\nUsage: ${prefix}aichat on/off`);
    }
});

// Initialize AI state on startup
(async () => {
    const savedState = await getConfig("AI_ENABLED");
    if (savedState) AI_ENABLED = savedState;
})();

// AI Chatbot - Subzero MD by Darrell Mucheri
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

        // Optional: Prevent bot responding to its own messages or commands
        if (!body || m.key.fromMe || body.startsWith(config.PREFIX)) return;

        // Encode message for the query
        const query = encodeURIComponent(body);
        const prompt = encodeURIComponent("you are subzero md whatsapp bot made by mr frank ofc ( darrell mucheri ). a tech genius in zimbabwe. act smart and enigmatic about personal stuff about him. He is 17 years (2025).Every mesaage you reply put footer \n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ғʀᴀɴᴋ 🤖");

        // BK9 API Request
        const apiUrl = `https://api.bk9.dev/ai/BK93?BK9=${prompt}&q=${query}`;

        const { data } = await axios.get(apiUrl);

        if (data && data.status && data.BK9) {
            await conn.sendMessage(from, {
                text: data.BK9
            }, { quoted: ice });
        } else {
            reply("⚠️ Subzero AI failed to generate a response.");
        }

    } catch (err) {
        console.error("AI Chatbot Error:", err.message);
        reply("❌ An error occurred while contacting the AI.");
    }
});




