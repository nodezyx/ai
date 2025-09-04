const { cmd } = require('../command');
const config = require('../config');
const { setConfig, getConfig } = require("../lib/configdb");
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Utility function to check if buttons should be used
function shouldUseButtons() {
    const buttonStatus = getConfig("BUTTON") || config.BUTTON || "false";
    return buttonStatus === "true" || buttonStatus === true;
}

// Settings menu command with list feature
cmd({
    pattern: "settings",
    alias: ["setting", "config", "cfg"],
    react: "⚙️",
    desc: "Bot settings and configuration menu",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const useButtons = shouldUseButtons();
    
    if (useButtons) {
        // Button-based settings menu with list feature
        try {
            // Get current status of all settings
            const settings = {
                MODE: getConfig("MODE") || config.MODE || "public",
                BUTTON: getConfig("BUTTON") || config.BUTTON || "false",
                HEARTREACT: getConfig("HEARTREACT") || config.HEARTREACT || "false",
                AUTOTYPING: getConfig("AUTOTYPING") || config.AUTOTYPING || "false",
                ALWAYSONLINE: getConfig("ALWAYSONLINE") || config.ALWAYSONLINE || "false",
                AUTORECORDING: getConfig("AUTORECORDING") || config.AUTORECORDING || "false",
                AUTOSTATUSREACT: getConfig("AUTOSTATUSREACT") || config.AUTOSTATUSREACT || "false",
                AUTOSTATUSSEEN: getConfig("AUTOSTATUSSEEN") || config.AUTOSTATUSSEEN || "false",
                ANTICALL: getConfig("ANTICALL") || config.ANTICALL || "false",
                ANTIBADWORD: getConfig("ANTIBADWORD") || config.ANTIBADWORD || "false",
                AUTOSTICKER: getConfig("AUTOSTICKER") || config.AUTOSTICKER || "false",
                AUTOREPLY: getConfig("AUTOREPLY") || config.AUTOREPLY || "false",
                AUTOREACT: getConfig("AUTOREACT") || config.AUTOREACT || "false",
                AUTOSTATUSREPLY: getConfig("AUTOSTATUSREPLY") || config.AUTOSTATUSREPLY || "false",
                ANTILINK: getConfig("ANTILINK") || config.ANTILINK || "false",
                ANTIBOT: getConfig("ANTIBOT") || config.ANTIBOT || "false"
            };

            // Get bot uptime
            const startTime = global.socketCreationTime || Date.now();
            const uptimeMs = Date.now() - startTime;
            const hours = Math.floor(uptimeMs / 3600000);
            const minutes = Math.floor((uptimeMs % 3600000) / 60000);
            const seconds = Math.floor((uptimeMs % 60000) / 1000);
            const uptime = `${hours}h ${minutes}m ${seconds}s`;
            
            // Get memory usage
            const memoryUsage = process.memoryUsage();
            const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
            
            // Get user's pushname
            let pushname = 'Owner';
            try {
                const userJid = conn.user.id;
                pushname = conn.user.name || 'Owner';
            } catch (error) {
                console.error('Failed to get user name:', error);
            }

            await conn.sendMessage(from, {
                buttons: [
                    {
                        buttonId: 'settings-action',
                        buttonText: {
                            displayText: '⚙️ Configure Settings'
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: 'SUBZERO BOT SETTINGS',
                                sections: [
                                    {
                                        title: '🔧 Bot Configuration',
                                        highlight_label: 'Settings Menu',
                                        rows: [
                                            {
                                                title: `🌐 Mode: ${settings.MODE.toUpperCase()}`,
                                                description: 'Set bot to public or private mode',
                                                id: `${config.PREFIX}mode`,
                                            },
                                            {
                                                title: `🔘 Buttons: ${settings.BUTTON === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable interactive buttons',
                                                id: `${config.PREFIX}buttons`,
                                            },
                                            {
                                                title: `❤️ Heart React: ${settings.HEARTREACT === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable heart reactions',
                                                id: `${config.PREFIX}heartreact`,
                                            },
                                            {
                                                title: `🫟 Auto Typing: ${settings.AUTOTYPING === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto typing indicator',
                                                id: `${config.PREFIX}autotyping`,
                                            },
                                            {
                                                title: `🌐 Always Online: ${settings.ALWAYSONLINE === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Set bot to always show online',
                                                id: `${config.PREFIX}alwaysonline`,
                                            },
                                            {
                                                title: `🎙️ Auto Recording: ${settings.AUTORECORDING === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto recording',
                                                id: `${config.PREFIX}autorecording`,
                                            },
                                            {
                                                title: `📖 Auto Read Status: ${settings.AUTOSTATUSREACT === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto status reading',
                                                id: `${config.PREFIX}autostatusreact`,
                                            },
                                            {
                                                title: `👀 Auto View Status: ${settings.AUTOSTATUSSEEN === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto status viewing',
                                                id: `${config.PREFIX}autostatusview`,
                                            },
                                            {
                                                title: `📞 Anti Call: ${settings.ANTICALL === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable anti-call feature',
                                                id: `${config.PREFIX}anticall`,
                                            },
                                            {
                                                title: `🚫 Anti Bad Words: ${settings.ANTIBADWORD === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable anti-bad words',
                                                id: `${config.PREFIX}antibad`,
                                            },
                                            {
                                                title: `🖼️ Auto Sticker: ${settings.AUTOSTICKER === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto sticker conversion',
                                                id: `${config.PREFIX}autosticker`,
                                            },
                                            {
                                                title: `💬 Auto Reply: ${settings.AUTOREPLY === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto reply',
                                                id: `${config.PREFIX}autoreply`,
                                            },
                                            {
                                                title: `❤️ Auto React: ${settings.AUTOREACT === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto reactions',
                                                id: `${config.PREFIX}autoreact`,
                                            },
                                            {
                                                title: `📢 Status Reply: ${settings.AUTOSTATUSREPLY === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable auto status replies',
                                                id: `${config.PREFIX}autostatusreply`,
                                            },
                                            {
                                                title: `🔗 Anti Link: ${settings.ANTILINK === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable anti-link feature',
                                                id: `${config.PREFIX}antilink`,
                                            },
                                            {
                                                title: `🤖 Anti Bot: ${settings.ANTIBOT === "true" ? '✅ ON' : '❌ OFF'}`,
                                                description: 'Enable/disable anti-bot feature',
                                                id: `${config.PREFIX}antibot`,
                                            }
                                        ],
                                    },
                                ],
                            }),
                        },
                    },
                ],
                headerType: 1,
                image: { url: "https://mrfrankk-cdn.hf.space/mrfrank/mini/settings.png" },
                caption: formatMessage(
                    '🎀 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 🎀',
                    `*╭─「 BOT INFORMATION 」*
*│*🔮 *\`Bot:\`* sᴜʙᴢᴇʀᴏ ᴍᴅ ᴍɪɴɪ ッ
*│*👤 *\`User:\`* ${pushname}
*│*🧩 *\`Owner:\`* ᴍʀ ғʀᴀɴᴋ ᴏғᴄ
*│*⏰ *\`Uptime:\`* ${uptime}
*│*📂 *\`Ram:\`* ${ramUsed}MB / ${ramTotal}MB
*│*🎐 *\`Prefix:\`* ${config.PREFIX}
╰──────────ᐧᐧᐧ

*\`Ξ\` Select a setting to configure:*`,
                    '© 𝘾𝙧𝙚𝙖𝙩𝙚𝙙 𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ'
                )
            }, { quoted: mek });

        } catch (error) {
            console.error('Settings menu error:', error);
            await showTextSettings();
        }
    } else {
        await showTextSettings();
    }

    async function showTextSettings() {
        const settings = {
            MODE: getConfig("MODE") || config.MODE || "public",
            BUTTON: getConfig("BUTTON") || config.BUTTON || "false",
            HEARTREACT: getConfig("HEARTREACT") || config.HEARTREACT || "false",
            AUTOTYPING: getConfig("AUTOTYPING") || config.AUTOTYPING || "false",
            ALWAYSONLINE: getConfig("ALWAYSONLINE") || config.ALWAYSONLINE || "false",
            AUTORECORDING: getConfig("AUTORECORDING") || config.AUTORECORDING || "false",
            AUTOSTATUSREACT: getConfig("AUTOSTATUSREACT") || config.AUTOSTATUSREACT || "false",
            AUTOSTATUSSEEN: getConfig("AUTOSTATUSSEEN") || config.AUTOSTATUSSEEN || "false",
            ANTICALL: getConfig("ANTICALL") || config.ANTICALL || "false",
            ANTIBADWORD: getConfig("ANTIBADWORD") || config.ANTIBADWORD || "false",
            AUTOSTICKER: getConfig("AUTOSTICKER") || config.AUTOSTICKER || "false",
            AUTOREPLY: getConfig("AUTOREPLY") || config.AUTOREPLY || "false",
            AUTOREACT: getConfig("AUTOREACT") || config.AUTOREACT || "false",
            AUTOSTATUSREPLY: getConfig("AUTOSTATUSREPLY") || config.AUTOSTATUSREPLY || "false",
            ANTILINK: getConfig("ANTILINK") || config.ANTILINK || "false",
            ANTIBOT: getConfig("ANTIBOT") || config.ANTIBOT || "false"
        };

        const settingsList = `
🎀 *𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒* 🎀

*╭─「 CURRENT STATUS 」─*
*│* 🌐 Mode: *${settings.MODE.toUpperCase()}*
*│* 🔘 Buttons: *${settings.BUTTON === "true" ? '✅ ON' : '❌ OFF'}*
*│* ❤️ Heart React: *${settings.HEARTREACT === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🫟 Auto Typing: *${settings.AUTOTYPING === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🌐 Always Online: *${settings.ALWAYSONLINE === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🎙️ Auto Recording: *${settings.AUTORECORDING === "true" ? '✅ ON' : '❌ OFF'}*
*│* 📖 Auto Read Status: *${settings.AUTOSTATUSREACT === "true" ? '✅ ON' : '❌ OFF'}*
*│* 👀 Auto View Status: *${settings.AUTOSTATUSSEEN === "true" ? '✅ ON' : '❌ OFF'}*
*│* 📞 Anti Call: *${settings.ANTICALL === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🚫 Anti Bad Words: *${settings.ANTIBADWORD === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🖼️ Auto Sticker: *${settings.AUTOSTICKER === "true" ? '✅ ON' : '❌ OFF'}*
*│* 💬 Auto Reply: *${settings.AUTOREPLY === "true" ? '✅ ON' : '❌ OFF'}*
*│* ❤️ Auto React: *${settings.AUTOREACT === "true" ? '✅ ON' : '❌ OFF'}*
*│* 📢 Status Reply: *${settings.AUTOSTATUSREPLY === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🔗 Anti Link: *${settings.ANTILINK === "true" ? '✅ ON' : '❌ OFF'}*
*│* 🤖 Anti Bot: *${settings.ANTIBOT === "true" ? '✅ ON' : '❌ OFF'}*
*╰─────────────────*

*📝 Usage:*
• Use *.mode public* to change mode
• Use *.buttons on* to enable buttons
• Use *.heartreact off* to disable heart react
• etc...

*💡 Example:* \`${config.PREFIX}mode private\`
*💡 Example:* \`${config.PREFIX}buttons on\`

© 𝘾𝙧𝙚𝙖𝙩𝙚𝙙 𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ
`;

        await conn.sendMessage(from, {
            image: { url: 'https://mrfrankk-cdn.hf.space/mrfrank/mini/settings.png' },
            caption: settingsList
        }, { quoted: mek });
    }
});

// Helper function to format message (similar to your menu example)
function formatMessage(title, body, footer) {
    return `${title}\n\n${body}\n\n${footer}`;
}

// Initialize global socket creation time if not exists
if (!global.socketCreationTime) {
    global.socketCreationTime = Date.now();
}

module.exports = { shouldUseButtons };
