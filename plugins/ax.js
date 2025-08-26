const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');

function getHarareTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Harare',
        hour12: true,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
}

async function getBotVersion() {
    try {
        if (!config.REPO) return 'Ultimate';
        const repoUrl = config.REPO;
        const rawUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
        const { data } = await axios.get(rawUrl);
        return data.version || 'Ultimate';
    } catch (error) {
        console.error("Version check error:", error);
        return 'Ultimate';
    }
}

cmd({
    pattern: "menu",
    desc: "subzero menu",
    alias: ["help", "commands"],
    category: "core",
    react: "✅",
    filename: __filename
}, 
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const version = await getBotVersion();
        const totalCommands = commands.filter(cmd => cmd.pattern).length;
        const botname = config.BOTNAME || "𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃";
        const ownername = config.OWNER_NAME || "𝐌𝐑 𝐅𝐑𝐀𝐍𝐊";
        const currentTime = getHarareTime();

        // Generate the top info section only (no readmore content)
        const topInfo = `
╔══════════════════════╗
   🧊 *${botname}* 🧊
╚══════════════════════╝

▧ *ᴄʀᴇᴀᴛᴏʀ* : *${ownername}* 🇿🇼
▧ *ᴍᴏᴅᴇ* : *${config.MODE}* 
▧ *ᴘʀᴇғɪx* : *${config.PREFIX}*
▧ *ᴛɪᴍᴇ* : ${currentTime}
▧ *ʀᴀᴍ* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB 
▧ *ᴠᴇʀsɪᴏɴ* : *${version}* 
▧ *ᴜᴘᴛɪᴍᴇ* : ${runtime(process.uptime())} 
▧ *ᴄᴏᴍᴍᴀɴᴅs* : ${totalCommands}

╔══════════════════════╗
    📋 *QUICK ACCESS*
╚══════════════════════╝
`;

        const imageUrl = config.BOTIMAGE || 'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png';
        
        // Generate unique session ID for this menu
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create buttons message
        const buttonsMessage = {
            image: { url: imageUrl },
            caption: topInfo,
            footer: config.FOOTER || 'Select an option below',
            buttons: [
                {
                    buttonId: `menu-allmenu-${sessionId}`,
                    buttonText: { displayText: '📋 ALL MENU' },
                    type: 1
                },
                {
                    buttonId: `menu-system-${sessionId}`,
                    buttonText: { displayText: '⚙️ SYSTEM' },
                    type: 1
                },
                {
                    buttonId: `menu-about-${sessionId}`,
                    buttonText: { displayText: 'ℹ️ ABOUT' },
                    type: 1
                }
            ],
            headerType: 4,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `${botname} Menu`,
                    body: `Version ${version} | ${totalCommands} commands`,
                    thumbnail: { url: imageUrl },
                    mediaType: 1,
                    mediaUrl: config.REPO || 'https://github.com/mrfrankofcc/SUBZERO-MD',
                    sourceUrl: config.REPO || 'https://github.com/mrfrankofcc/SUBZERO-MD'
                }
            }
        };

        // Send the message with buttons
        const sentMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
        const messageId = sentMsg.key.id;

        // Button handler
        const buttonHandler = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg.message?.buttonsResponseMessage) return;

            const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
            const senderId = receivedMsg.key.remoteJid;
            const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

            if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
                // Remove listener to prevent multiple triggers
                conn.ev.off('messages.upsert', buttonHandler);
                
                await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });
                
                try {
                    if (buttonId.startsWith(`menu-allmenu-${sessionId}`)) {
                        // Execute allmenu command
                        await conn.sendMessage(from, { text: `Executing: ${config.PREFIX}allmenu` });
                        // You would call your allmenu function here
                    } 
                    else if (buttonId.startsWith(`menu-system-${sessionId}`)) {
                        // Execute system command
                        await conn.sendMessage(from, { text: `Executing: ${config.PREFIX}system` });
                        // You would call your system function here
                    } 
                    else if (buttonId.startsWith(`menu-about-${sessionId}`)) {
                        // Execute about command
                        await conn.sendMessage(from, { text: `Executing: ${config.PREFIX}about` });
                        // You would call your about function here
                    }
                    
                    await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
                } catch (error) {
                    console.error('Button action error:', error);
                    await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                    reply(`❌ Error: ${error.message || 'Action failed'}`);
                }
            }
        };

        // Add listener for button responses
        conn.ev.on('messages.upsert', buttonHandler);

        // Remove listener after 2 minutes
        setTimeout(() => {
            conn.ev.off('messages.upsert', buttonHandler);
        }, 120000);

        await conn.sendPresenceUpdate('paused', from);
        
    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ Error generating menu: ${e.message}`);
    }
});
