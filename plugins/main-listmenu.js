/*const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

// Get Harare Time
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

// Get Bot Version
async function getBotVersion() {
    try {
        if (!config.REPO) return 'Ultimate';
        const rawUrl = config.REPO.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
        const { data } = await axios.get(rawUrl);
        return data.version || 'Ultimate';
    } catch (err) {
        console.error("Version error:", err);
        return 'Ultimate';
    }
}

// Generate a section with numbered commands and descriptions
function generateCommandListSection(categoryName, cmds) {
    let section = `╭──────────◯\n\n*\`📁 ${categoryName.toUpperCase()}\`*\n`;
    cmds.forEach((cmd, index) => {
        if (cmd.pattern) {
            section += `\n🏮 \`Command ${index + 1}:\` *${config.PREFIX}${cmd.pattern}*\n💡 \`Description:\` \n\n> ➢ \`\`\`${cmd.desc || "No description"}\`\`\`\n\n`;
        }
    });
    return section + '\n╰────────────◯\n';
}

cmd({
    pattern: "listmenu",
    desc: "Detailed numbered command list",
    alias: ["commandlist", "helpme", "menulist", "showcmd"],
    category: "core",
    react: "📃",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const version = await getBotVersion();
        const botname = "SUBZERO MD";
        const ownername = "MR FRANK";
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = Math.round(os.totalmem() / 1024 / 1024);
        const uptime = runtime(process.uptime());
        const totalCommands = commands.filter(c => c.pattern).length;
        const subzerox = {
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
        // Filter and group commands
        const grouped = {};
        commands.forEach(cmd => {
            if (!cmd.pattern || cmd.category.toLowerCase() === "menu" || cmd.hideCommand) return;
            const cat = cmd.category.toUpperCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(cmd);
        });

        // Generate full menu
        let commandList = '';
        Object.keys(grouped).sort().forEach(category => {
            commandList += generateCommandListSection(category, grouped[category]);
        });

        const caption = `          \`${botname}-V5\`\n
*╭──────────◯*
*│* *⬡ ᴅᴇᴠᴇʟᴏᴘᴇʀ:* ${ownername}
*│* *⬡ ᴍᴏᴅᴇ:* ${config.MODE}
*│* *⬡ ᴘʀᴇꜰɪx:* ${config.PREFIX}
*│* *⬡ ʀᴀᴍ:* ${ram}MB / ${totalMem}MB
*│* *⬡ ᴜᴘᴛɪᴍᴇ:* ${uptime}
*│* *⬡ ᴠᴇʀꜱɪᴏɴ:* ${version}
*│* *⬡ ᴄᴏᴍᴍᴀɴᴅꜱ:* ${totalCommands}
*╰───────◯*

${readMore}${commandList}

╭──────────────◯
│ ${config.FOOTER}
╰──────────────◯
`.trim();

        const menuImage = config.BOTIMAGE || 'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png';

        await conn.sendMessage(from, {
            image: { url: menuImage },
            caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363304325601080@newsletter',
                    newsletterName: '🏮 SUBZERO-MD-V5 🏮',
                    serverMessageId: 143
                }
            }
        }, { quoted: subzerox });

    } catch (err) {
        console.error(err);
        reply("❌ Error loading menu: " + err.message);
    }
});
*/


const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

// Get Harare Time
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

// Get Bot Version
async function getBotVersion() {
    try {
        if (!config.REPO) return 'Ultimate';
        const rawUrl = config.REPO.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
        const { data } = await axios.get(rawUrl);
        return data.version || 'Ultimate';
    } catch (err) {
        console.error("Version error:", err);
        return 'Ultimate';
    }
}

// Generate a beautiful section with emojis and better formatting
function generateCommandListSection(categoryName, cmds) {
    const categoryEmojis = {
        'CORE': '⚙️',
        'AI': '🤖',
        'DOWNLOAD': '📥',
        'OWNER': '👑',
        'GROUP': '👥',
        'UTILITY': '🔧',
        'FUN': '🎮',
        'MEDIA': '🎬',
        'STICKER': '🖼️',
        'SEARCH': '🔍',
        'ANIME': '🎌',
        'EDUCATION': '📚',
        'GAMES': '🎯',
        'ECONOMY': '💰',
        'SETTINGS': '⚡',
        'MISC': '📦'
    };

    const emoji = categoryEmojis[categoryName] || '📁';
    
    let section = `╭─「 ${emoji} *${categoryName}* 」─\n`;
    
    cmds.forEach((cmd, index) => {
        if (cmd.pattern) {
            const commandName = Array.isArray(cmd.pattern) ? cmd.pattern[0] : cmd.pattern;
            const aliases = cmd.alias ? ` (${cmd.alias.join(', ')})` : '';
            const description = cmd.desc || "No description available";
            
            section += `│\n│ 🏮 *${config.PREFIX}${commandName}*${aliases}\n`;
            section += `│ 💡 ${description}\n`;
        }
    });
    
    section += `╰─「 ${cmds.length} Commands 」─\n\n`;
    return section;
}

// Generate category index for quick navigation
function generateCategoryIndex(categories) {
    const categoryEmojis = {
        'CORE': '⚙️',
        'AI': '🤖',
        'DOWNLOAD': '📥',
        'OWNER': '👑',
        'GROUP': '👥',
        'UTILITY': '🔧',
        'FUN': '🎮',
        'MEDIA': '🎬',
        'STICKER': '🖼️',
        'SEARCH': '🔍',
        'ANIME': '🎌',
        'EDUCATION': '📚',
        'GAMES': '🎯',
        'ECONOMY': '💰',
        'SETTINGS': '⚡',
        'MISC': '📦'
    };

    let index = `╭─「 📋 *QUICK CATEGORY INDEX* 」─\n│\n`;
    
    categories.forEach((category, i) => {
        const emoji = categoryEmojis[category] || '📁';
        index += `│ ${i + 1}. ${emoji} ${category}\n`;
    });
    
    index += `╰─「 ${categories.length} Categories 」─\n\n`;
    return index;
}

cmd({
    pattern: "listmenu",
    desc: "Beautiful categorized command list with descriptions",
    alias: ["menu", "help", "commands", "cmdlist", "allcmds"],
    category: "core",
    react: "📖",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const version = await getBotVersion();
        const botname = config.BOTNAME || "SUBZERO MD";
        const ownername = config.OWNER_NAME || "MR FRANK";
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = Math.round(os.totalmem() / 1024 / 1024);
        const uptime = runtime(process.uptime());
        const totalCommands = commands.filter(c => c.pattern).length;
        const harareTime = getHarareTime();
        
        const subzerox = {
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
        };

        // Filter and group commands
        const grouped = {};
        commands.forEach(cmd => {
            if (!cmd.pattern || cmd.category.toLowerCase() === "menu" || cmd.hideCommand) return;
            const cat = cmd.category.toUpperCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(cmd);
        });

        // Sort categories
        const sortedCategories = Object.keys(grouped).sort();
        
        // Generate category index
        const categoryIndex = generateCategoryIndex(sortedCategories);
        
        // Generate full menu
        let commandList = categoryIndex;
        sortedCategories.forEach(category => {
            commandList += generateCommandListSection(category, grouped[category]);
        });

        const caption = `
╭───「 🌟 *${botname}* 」───
│
│ 🤖 *Bot Version:* ${version}
│ 👑 *Developer:* ${ownername}
│ ⚡ *Mode:* ${config.MODE}
│ 🔧 *Prefix:* ${config.PREFIX}
│ 
│ 📊 *System Info:*
│ 💾 RAM: ${ram}MB / ${totalMem}MB
│ ⏰ Uptime: ${uptime}
│ 📝 Commands: ${totalCommands}
│ 🌍 Time: ${harareTime}
│
╰───「 🚀 *Powered by ${ownername}* 」───

${readMore}

${commandList}

╭───「 💫 *QUICK TIPS* 」───
│
│ 📌 Use ${config.PREFIX}help <command> for detailed help
│ 📌 Example: ${config.PREFIX}help sticker
│ 📌 React with ❓ to any command for info
│
╰───「 ${config.FOOTER || '🔮 SUBZERO MD • THE ULTIMATE WHATSAPP BOT'} 」───
`.trim();

        const menuImage = config.BOTIMAGE || 'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png';

        await conn.sendMessage(from, {
            image: { url: menuImage },
            caption: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363304325601080@newsletter',
                    newsletterName: `🏮 ${botname} 🏮`,
                    serverMessageId: 143
                }
            }
        }, { quoted: subzerox });

    } catch (err) {
        console.error("Menu error:", err);
        reply("❌ Error loading menu: " + err.message);
    }
});

// Additional help command for specific commands
cmd({
    pattern: "help",
    desc: "Get detailed help for a specific command",
    alias: ["commandhelp", "cmdinfo"],
    category: "core",
    react: "❓",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ Please specify a command\nExample: ${config.PREFIX}help sticker`);
        }

        const commandName = args[0].toLowerCase();
        const command = commands.find(cmd => 
            (cmd.pattern && (typeof cmd.pattern === 'string' ? cmd.pattern.toLowerCase() === commandName : 
            Array.isArray(cmd.pattern) ? cmd.pattern.includes(commandName) : false)) ||
            (cmd.alias && cmd.alias.includes(commandName))
        );

        if (!command) {
            return reply(`❌ Command "${commandName}" not found\nUse ${config.PREFIX}menu to see all commands`);
        }

        const commandPattern = Array.isArray(command.pattern) ? command.pattern[0] : command.pattern;
        const aliases = command.alias ? `\n• Aliases: ${command.alias.join(', ')}` : '';
        const category = command.category ? `\n• Category: ${command.category.toUpperCase()}` : '';

        const helpText = `
╭───「 🆘 *COMMAND HELP* 」───
│
│ 🏮 *Command:* ${config.PREFIX}${commandPattern}
│ 💡 *Description:* ${command.desc || 'No description available'}
${aliases}${category}
│
│ 📌 *Usage:* 
│ • ${config.PREFIX}${commandPattern}${command.use ? ` ${command.use}` : ''}
│
╰───「 🚀 Need more help? Contact ${config.OWNER_NAME || "MR FRANK"} 」───
`.trim();

        await reply(helpText);

    } catch (err) {
        console.error("Help error:", err);
        reply("❌ Error showing help: " + err.message);
    }
});
