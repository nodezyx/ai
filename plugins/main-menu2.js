const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

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

function fancy(txt) {
    if (!txt || typeof txt !== 'string') return '';
    const map = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ',
        g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ',
        m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
        s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
        y: 'ʏ', z: 'ᴢ', "1": "𝟏", "2": "𝟐", "3": "𝟑",
        "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖",
        "9": "𝟗", "0": "𝟎", ".": ".", "-": "-", "_": "_"
    };
    return txt.toLowerCase().split('').map(c => map[c] || c).join('');
}

function generateCategorySection(categoryName, commandsList) {
    if (!commandsList || !commandsList.length) return '';
    
    let section = `*🏮 \`${categoryName.toUpperCase()}\` 🏮*\n\n╭─────────────···◈\n`;
    
    commandsList.forEach(cmd => {
        if (cmd.pattern) {
            section += `*┋* *⬡ ${config.PREFIX}${fancy(cmd.pattern)}*\n`;
        }
    });
    
    section += `╰─────────────╶╶···◈\n\n`;
    return section;
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
        const botname = "𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃";
        const ownername = "𝐌𝐑 𝐅𝐑𝐀𝐍𝐊";
        // Quoted message style
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
      caption: 'Subzero Smart Automation',
      jpegThumbnail: null
    }
  }
};
        const subzero = { 
            key: { 
                remoteJid: 'status@broadcast', 
                participant: '0@s.whatsapp.net' 
            }, 
            message: { 
                newsletterAdminInviteMessage: { 
                    newsletterJid: '120363270086174844@newsletter',
                    newsletterName: "𝐈𝐂𝐘 𝐁𝐎𝐓",
                    caption: `${botname} 𝐁𝐘 ${ownername}`, 
                    inviteExpiration: 0
                }
            }
        };

/* const profilePicUrl = "https://cnd.davex.site/ephoto.jpg";
const metaThumbnail = await axios.get(profilePicUrl, { responseType: "arraybuffer" }).then(res => res.data);

const fake = {
  key: {
    remoteJid: "status@broadcast",
    fromMe: false,
    id: "ABCD1234",
    participant: "0@s.whatsapp.net"
  },
  message: {
    imageMessage: {
      mimetype: "image/jpeg",
      jpegThumbnail: metaThumbnail,
      caption: "👤 Contact: Mr Frank"
    }
  }
};
*/
const metaThumbnail = await axios
  .get("https://cnd.davex.site/ephoto.jpg", { responseType: "arraybuffer" })
  .then((res) => res.data);

const fake = {
  key: {
    remoteJid: "status@broadcast",
    fromMe: false,
    id: "ABCD1234",
    participant: "0@s.whatsapp.net"
  },
  message: {
    contactMessage: {
      displayName: "Meta AI ✅ • Status",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:Mr Frank\nTEL;type=CELL:+1234567890\nEND:VCARD",
      jpegThumbnail: metaThumbnail
    }
  }
};
        
        // Filter valid commands
        const validCommands = commands.filter(cmd => 
            cmd.pattern && 
            cmd.category && 
            cmd.category.toLowerCase() !== 'menu' &&
            !cmd.hideCommand
        );

        // Group commands by category
        const categories = {};
        validCommands.forEach(cmd => {
            const category = cmd.category.toLowerCase();
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        });

        // Generate menu sections
        let menuSections = '';
        Object.entries(categories)
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort categories alphabetically
            .forEach(([category, cmds]) => {
                menuSections += generateCategorySection(category, cmds);
            });

        let dec = `
       \`\`\`${config.BOTNAME}\`\`\`
    
⟣──────────────────⟢
▧ *ᴄʀᴇᴀᴛᴏʀ* : *ᴍʀ ғʀᴀɴᴋ (🇿🇼)*
▧ *ᴍᴏᴅᴇ* : *${config.MODE}* 
▧ *ᴘʀᴇғɪx* : *${config.PREFIX}*
▧ *ʀᴀᴍ* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB 
▧ *ᴠᴇʀsɪᴏɴ* : *${version}* 
▧ *ᴜᴘᴛɪᴍᴇ* : ${runtime(process.uptime())} 
▧ *ᴄᴏᴍᴍᴀɴᴅs* : ${totalCommands}
⟣──────────────────⟢

> ＳＵＢＺＥＲＯ - ＭＤ- ＢＯＴ

⟣──────────────────⟢
${readMore}

${menuSections}

*━━━━━━━━━━━━━━━━━━━━*⁠⁠⁠⁠
> ＭＡＤＥ ＢＹ ＭＲ ＦＲＡＮＫ
*━━━━━━━━━━━━━━━━━━━━━*
`;

        const imageUrl = config.BOTIMAGE || 'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png';
        
        await conn.sendMessage(
            from,
            {
                image: { url: imageUrl },
                caption: dec,
                contextInfo: {
                    mentionedJid: [m.sender],
                     forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363304325601080@newsletter',
                        newsletterName: '𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 𝐕𝟓',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: fake }
        );

        await conn.sendPresenceUpdate('paused', from);
        
    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ Error generating menu: ${e.message}`);
    }
});


