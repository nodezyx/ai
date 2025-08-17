const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

function isEnabled(value) {
    return value && value.toString().toLowerCase() === "true";
}

cmd({
    pattern: "configurations",
    alias: ["variables"],
    desc: "Settings of bot",
    category: "menu",
    react: "🦋",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        let envSettings = `╭━━━〔 *SUBZERO-MD* 〕━━━┈⊷
┃▸╭───────────
┃▸┃๏ *SUBZERO MD SETTINGS ❄️*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━〔 *Enabled / Disabled* 〕━━┈⊷
┇๏ *Auto Status Seen:* ${isEnabled(config.AUTOSTATUSSEEN) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Status Reply:* ${isEnabled(config.AUTOSTATUSREPLY) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Reply:* ${isEnabled(config.AUTOREPLY) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Sticker:* ${isEnabled(config.AUTOSTICKER) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Voice:* ${isEnabled(config.AUTOVOICE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Custom Reacts:* ${isEnabled(config.CUSTOMREACT) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto React:* ${isEnabled(config.AUTOREACT) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Delete Links:* ${isEnabled(config.DELETELINKS) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Link:* ${isEnabled(config.ANTILINK) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Bad Words:* ${isEnabled(config.ANTIBAD) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Delete:* ${isEnabled(config.ANTIDELETE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Call:* ${isEnabled(config.ANTICALL) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Anti-Bot:* ${isEnabled(config.ANTIBOT) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Typing:* ${isEnabled(config.AUTOTYPING) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Auto Recording:* ${isEnabled(config.AUTORECORDING) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Always Online:* ${isEnabled(config.ALWAYSONLINE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *Welcome/Goodbye:* ${isEnabled(config.WELCOME_GOODBYE) ? "Enabled ✅" : "Disabled ❌"}
┇๏ *PM Blocker:* ${isEnabled(config.PMBLOCKER) ? "Enabled ✅" : "Disabled ❌"}
╰━━━━━━━━━━━━──┈⊷
> 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐁𝐎𝐓`;

        await conn.sendMessage(
            from,
            {
                image: { url: 'https://i.postimg.cc/yNf7rQFw/prn.jpg' },
                caption: envSettings,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363304325601080@newsletter',
                        newsletterName: "❄️『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』❄️",
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            audio: { url: 'https://files.catbox.moe/qda847.m4a' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: mek });

    } catch (error) {
        console.log(error);
        reply(`Error: ${error.message}`);
    }
});
