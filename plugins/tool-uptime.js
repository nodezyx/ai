const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');

cmd({
    pattern: 'sb',
    alias: ['uptime', 'status', 'runtime'],
    desc: 'Check bot status and uptime',
    category: 'general',
    react: '🤖',
    filename: __filename
}, async (message, reply) => {
    try {
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        // Social media info
        const social = {
            instagram: "mrfrankofc",
            github: "mrfr8nk",
            facebook: "Darrell Mucheri",
            botName: "SUBZERO MD"
        };

        // Generate API URL for image
        const apiUrl = `https://kaiz-apis.gleeze.com/api/uptime?instag=${social.instagram}&ghub=${social.github}&fb=${social.facebook}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${social.botName}`;

        // Status message template
        const statusMessage = `╭──「 *${social.botName} STATUS* 」──╮
│
│ ✅ *Bot Status:* Online
│ ⏱️ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s
│ 
│ 📊 *System Info:*
│ ⚡ *Version:* ${config.VERSION || "1.0.0"}
│ 💻 *Mode:* ${config.MODE || "Default"}
│
│ 🔗 *Social Media:*
│ 📷 Instagram: ${social.instagram}
│ 💻 GitHub: ${social.github}
│
╰──────────────────╯`;

        // Try to send with image
        try {
            await reply(
                { 
                    image: { url: apiUrl },
                    caption: statusMessage,
                    contextInfo: {
                        mentionedJid: [message.sender],
                        forwardingScore: 999,
                        isForwarded: true
                    }
                },
                { quoted: message }
            );
        } catch (imageError) {
            console.error("Image API failed, sending text only:", imageError);
            await reply(
                `${statusMessage}\n\n⚠️ *Image service temporarily unavailable*`,
                { quoted: message }
            );
        }

    } catch (error) {
        console.error("Error in alive command:", error);
        await reply(
            `❌ Error checking bot status. Please try again later.`,
            { quoted: message }
        );
    }
});
