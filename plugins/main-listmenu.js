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
