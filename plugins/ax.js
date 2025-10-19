/*const config = require('../config');
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

// Function to find a command by pattern or alias
function findCommand(cmdName) {
    return commands.find(c => 
        c.pattern === cmdName || 
        (c.alias && c.alias.includes(cmdName))
    );
}

// Function to simulate command execution
async function executeCommand(conn, from, commandName, originalMsg) {
    try {
        const cmdName = commandName.replace(config.PREFIX, '');
        const command = findCommand(cmdName);
        
        if (!command || typeof command.function !== 'function') {
            return conn.sendMessage(from, { 
                text: `❌ Command *${commandName}* not found!` 
            }, { quoted: originalMsg });
        }
        
        // Create a proper message object structure
        const fakeMessage = {
            key: {
                remoteJid: from,
                fromMe: false,
                id: `${Date.now()}-button-${cmdName}`,
            },
            message: { 
                conversation: commandName 
            },
            pushName: originalMsg?.pushName || "User",
        };
        
        // Create the context object that command handlers expect
        const context = {
            from: from,
            text: commandName,
            args: [cmdName],
            reply: (text, options = {}) => 
                conn.sendMessage(from, { text }, { quoted: fakeMessage, ...options }),
            sender: originalMsg?.sender || from
        };
        
        // Execute the command function
        await command.function(conn, fakeMessage, context);
        
    } catch (error) {
        console.error('Command execution error:', error);
        await conn.sendMessage(from, { 
            text: `❌ Error executing ${commandName}: ${error.message}` 
        });
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
                        await executeCommand(conn, from, `${config.PREFIX}allmenu`, receivedMsg);
                    } 
                    else if (buttonId.startsWith(`menu-system-${sessionId}`)) {
                        // Execute system command
                        await executeCommand(conn, from, `${config.PREFIX}system`, receivedMsg);
                    } 
                    else if (buttonId.startsWith(`menu-about-${sessionId}`)) {
                        // Execute about command
                        await executeCommand(conn, from, `${config.PREFIX}about`, receivedMsg);
                    }
                    
                    await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
                } catch (error) {
                    console.error('Button action error:', error);
                    await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                    conn.sendMessage(from, { text: `❌ Error: ${error.message || 'Action failed'}` });
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

// Create simple implementations for the menu commands if they don't exist
if (!findCommand('allmenu')) {
    cmd({
        pattern: "allmenu",
        desc: "Show all commands",
        category: "core",
        filename: __filename
    }, async (conn, mek, m, { from, reply }) => {
        try {
            let allCommands = "📋 *ALL COMMANDS*\n\n";
            
            commands.filter(cmd => cmd.pattern && !cmd.hideCommand)
                .sort((a, b) => a.pattern.localeCompare(b.pattern))
                .forEach(cmd => {
                    allCommands += `• ${config.PREFIX}${cmd.pattern} - ${cmd.desc || 'No description'}\n`;
                });
                
            allCommands += `\nTotal: ${commands.filter(cmd => cmd.pattern).length} commands`;
            
            await reply(allCommands);
        } catch (error) {
            reply(`❌ Error showing all commands: ${error.message}`);
        }
    });
}

if (!findCommand('system')) {
    cmd({
        pattern: "system",
        desc: "Show system information",
        category: "core",
        filename: __filename
    }, async (conn, mek, m, { from, reply }) => {
        try {
            const systemInfo = `
⚙️ *SYSTEM INFORMATION*

• Platform: ${process.platform}
• Architecture: ${process.arch}
• Node.js: ${process.version}
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
• Uptime: ${runtime(process.uptime())}
• CPU: ${os.cpus()[0].model}
• CPU Cores: ${os.cpus().length}
            `;
            
            await reply(systemInfo);
        } catch (error) {
            reply(`❌ Error showing system info: ${error.message}`);
        }
    });
}

if (!findCommand('about')) {
    cmd({
        pattern: "about",
        desc: "Show bot information",
        category: "core",
        filename: __filename
    }, async (conn, mek, m, { from, reply }) => {
        try {
            const aboutInfo = `
ℹ️ *ABOUT ${config.BOTNAME || "BOT"}*

• Creator: ${config.OWNER_NAME || "Mr Frank"}
• Version: ${await getBotVersion()}
• Prefix: ${config.PREFIX}
• Mode: ${config.MODE}
• Repository: ${config.REPO || "Not specified"}
• Total Commands: ${commands.filter(cmd => cmd.pattern).length}

This bot is powered by Subzero-MD framework.
            `;
            
            await reply(aboutInfo);
        } catch (error) {
            reply(`❌ Error showing about info: ${error.message}`);
        }
    });
}
*/
