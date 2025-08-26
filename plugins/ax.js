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
        
        // Create buttons message
        const buttonsMessage = {
            image: { url: imageUrl },
            caption: topInfo,
            footer: config.FOOTER || 'Select an option below',
            buttons: [
                {
                    buttonId: `${config.PREFIX}allmenu`,
                    buttonText: { displayText: '📋 ALL MENU' },
                    type: 1
                },
                {
                    buttonId: `${config.PREFIX}system`,
                    buttonText: { displayText: '⚙️ SYSTEM' },
                    type: 1
                },
                {
                    buttonId: `${config.PREFIX}about`,
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
        await conn.sendMessage(from, buttonsMessage, { quoted: mek });

        await conn.sendPresenceUpdate('paused', from);
        
    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ Error generating menu: ${e.message}`);
    }
});
