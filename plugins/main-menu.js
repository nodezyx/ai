  // *▧ ᴛɪᴍᴇ* : ${getHarareTime()} ⌛
const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);
const fs = require('fs');
const path = require('path');

function getHarareTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Harare',
        hour12: true, // Use 12-hour format (optional)
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
        if (!config.REPO) throw new Error('config.REPO is not defined');
        // Get the package.json from the repository specified in config.REPO
        const repoUrl = config.REPO;
        const rawUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
        const { data } = await axios.get(rawUrl);
        return data.version || '1.0.0';
    } catch (error) {
        console.error("Version check error:", error);
        return 'Ultimate';
    }
}

const imageUrl = config.BOTIMAGE ||  'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png';

cmd({
    pattern: "menu2",
    desc: "subzero menu",
    alias: "help",
    category: "menu",
    react: "✅",
    filename: __filename
}, 
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        // Show typing indicator
      //  await conn.sendPresenceUpdate('composing', from);

        // Fetch version dynamically from config.REPO's package.json
        const version = await getBotVersion();
        
        // Calculate total commands from the commands collection (supports both arrays and objects)
        const totalCommands = Array.isArray(commands) ? commands.length : Object.keys(commands).length;
        
        const botname = "𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃"; //add your name
const ownername = "𝐌𝐑 𝐅𝐑𝐀𝐍𝐊"; // add your name

const subzero = { 
  key: { 
    remoteJid: 'status@broadcast', 
    participant: '0@s.whatsapp.net' 
  }, 
  message: { 
    newsletterAdminInviteMessage: { 
      newsletterJid: '120363270086174844@newsletter', // your channel jid
      newsletterName: "𝐈𝐂𝐘 𝐁𝐎𝐓", // your bot name
      caption: botname + ` 𝐁𝐘 ` + ownername, 
      inviteExpiration: 0
    }
  }
};
      

        let dec = `

       \`\`\`${config.BOTNAME}\`\`\`
    
⟣──────────────────⟢
▧ *ᴄʀᴇᴀᴛᴏʀ* : *ᴍʀ ғʀᴀɴᴋ (🇿🇼)*
▧ *ᴍᴏᴅᴇ* : *${config.MODE}* 
▧ *ᴘʀᴇғɪx* : *${config.PREFIX}*
▧ *ʀᴀᴍ* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB 
▧ *ᴠᴇʀsɪᴏɴ* : *${version}* 
▧ *ᴜᴘᴛɪᴍᴇ* : ${runtime(process.uptime())} 
▧ *ᴄᴏᴍᴍᴀɴᴅs* : ${totalCommands}
⟣──────────────────⟢

> ＳＵＢＺＥＲＯ - ＭＤ- ＢＯＴ

⟣──────────────────⟢
${readMore}

*🏮 \`SUBZERO DOWNLOADER\` 🏮* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}sᴇʀɪᴇs*
*┋* *⬡ ${config.PREFIX}ᴍᴏᴠɪᴇ*
*┋* *⬡ ${config.PREFIX}ғᴀᴄᴇʙᴏᴏᴋ*
*┋* *⬡ ${config.PREFIX}ɪɴꜱᴛᴀɢʀᴀᴍ*
*┋* *⬡ ${config.PREFIX}sᴘᴏᴛɪғʏᴅᴏᴡɴʟᴏᴀᴅ*
*┋* *⬡ ${config.PREFIX}sᴏᴜɴᴅᴄʟᴏᴜᴅᴅʟ*
*┋* *⬡ ${config.PREFIX}sɴᴀᴘᴄʜᴀᴛᴅʟ*
*┋* *⬡ ${config.PREFIX}ᴠɪᴅᴇᴏ*
*┋* *⬡ ${config.PREFIX}ɢᴅʀɪᴠᴇ*
*┋* *⬡ ${config.PREFIX}ᴛᴡɪᴛᴛᴇʀ*
*┋* *⬡ ${config.PREFIX}ᴛɪᴋᴛᴏᴋ*
*┋* *⬡ ${config.PREFIX}ᴍᴇᴅɪᴀғɪʀᴇ*
*┋* *⬡ ${config.PREFIX}ᴍᴇᴅɪᴀғɪʀᴇᴘʀᴏ*
*┋* *⬡ ${config.PREFIX}ꜱᴏɴɢ*
*┋* *⬡ ${config.PREFIX}ᴘʟᴀʏ*
*┋* *⬡ ${config.PREFIX}ᴘʟᴀʏ2*
*┋* *⬡ ${config.PREFIX}ᴘʟᴀʏ3*
*┋* *⬡ ${config.PREFIX}ᴠɪᴅᴇᴏ*
*┋* *⬡ ${config.PREFIX}ᴠɪᴅᴇᴏ2*
*┋* *⬡ ${config.PREFIX}ɢɪᴛᴄʟᴏɴᴇ*
*┋* *⬡ ${config.PREFIX}ɪᴍɢ*
*┋* *⬡ ${config.PREFIX}ᴀᴘᴋ*
*┋* *⬡ ${config.PREFIX}ʏᴛᴍᴘ3*
*┋* *⬡ ${config.PREFIX}ʏᴛᴍᴘ4*
*┋* *⬡ ${config.PREFIX}ᴘɪɴᴛᴇʀᴇsᴛ*
*┋* *⬡ ${config.PREFIX}sᴏɴɢx*
*┋* *⬡ ${config.PREFIX}ᴠɪᴅᴇᴏx*
*┋* *⬡ ${config.PREFIX}ʙɪʙʟᴇ*
╰─────────────╶╶···◈*

*🔎 \`SEARCH-CMD\` 🔍* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}sᴘᴏᴛɪғʏ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴄɪᴘᴇ*
*┋* *⬡ ${config.PREFIX}sᴏᴜɴᴅᴄʟᴏᴜᴅ*
*┋* *⬡ ${config.PREFIX}ᴀᴘᴘʟᴇᴍᴜsɪᴄ*
*┋* *⬡ ${config.PREFIX}ɪᴍᴅʙ*
*┋* *⬡ ${config.PREFIX}ᴡᴇᴇʙ*
*┋* *⬡ ${config.PREFIX}ᴍᴀʟ*
*┋* *⬡ ${config.PREFIX}ϙᴜɪᴢ*
*┋* *⬡ ${config.PREFIX}ʀɪᴅᴅʟᴇ*
*┋* *⬡ ${config.PREFIX}ϙᴜᴏᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴀɴɪᴍᴇϙᴜᴏᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴅʏᴋ*
*┋* *⬡ ${config.PREFIX}ᴇᴘʟ*
*┋* *⬡ ${config.PREFIX}ᴇᴘʟʀᴇsᴜʟᴛs*
*┋* *⬡ ${config.PREFIX}ᴇᴘʟᴛᴀʙʟᴇ*
*┋* *⬡ ${config.PREFIX}ᴘᴇʀᴘʟᴇxɪᴛʏ*
*┋* *⬡ ${config.PREFIX}ɪɢsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ғʙsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ᴛᴛsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ᴡᴀsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ɢɪᴛsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴘᴏsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ɴᴀsᴀ*
*┋* *⬡ ${config.PREFIX}ɴᴇᴡs*
*┋* *⬡ ${config.PREFIX}ʙʙᴄ*
*┋* *⬡ ${config.PREFIX}ᴛᴇᴄʜɴᴇᴡs*
*┋* *⬡ ${config.PREFIX}ᴄᴏᴜɴᴛʀʏ*
*┋* *⬡ ${config.PREFIX}ɪᴘʟᴏᴏᴋᴜᴘ*
*┋* *⬡ ${config.PREFIX}ʏᴛꜱ*
*┋* *⬡ ${config.PREFIX}ʏᴛᴀ*
*┋* *⬡ ${config.PREFIX}ɢᴏᴏɢʟᴇ*
*┋* *⬡ ${config.PREFIX}ʟᴏʟɪ*
*┋* *⬡ ${config.PREFIX}ɢɪᴛsᴛᴀʟᴋ*
*┋* *⬡ ${config.PREFIX}ᴡɪᴋɪᴘᴇᴅɪᴀ*
*┋* *⬡ ${config.PREFIX}sʀᴇᴘᴏ*
*┋* *⬡ ${config.PREFIX}ᴍᴏᴠɪᴇɪɴғᴏ*
*┋* *⬡ ${config.PREFIX}ɢᴏᴏɢʟᴇ*
*┋* *⬡ ${config.PREFIX}ᴍᴏᴠɪᴇ*
*┋* *⬡ ${config.PREFIX}ᴡᴇᴀᴛʜᴇʀ*
*┋* *⬡ ${config.PREFIX}ssᴡᴇʙ*
*┋* *⬡ ${config.PREFIX}ɴᴘᴍ*
╰─────────────╶╶···◈*

*🧠 \`AI-CMD\` 🧠* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}ᴍɪᴅᴊᴏᴜʀɴᴇʀʏ*
*┋* *⬡ ${config.PREFIX}ᴀɪᴅᴇᴛᴇᴄᴛ*
*┋* *⬡ ${config.PREFIX}ɢᴘᴛ*
*┋* *⬡ ${config.PREFIX}ᴀɪ*
*┋* *⬡ ${config.PREFIX}ʙᴏᴛ*
*┋* *⬡ ${config.PREFIX}ᴅᴀʀᴋɢᴘᴛ*
*┋* *⬡ ${config.PREFIX}ᴠɪsɪᴏɴ*
*┋* *⬡ ${config.PREFIX}sᴜʙᴢᴇʀᴏ*
*┋* *⬡ ${config.PREFIX}ɢᴇᴍɪɴɪ*
*┋* *⬡ ${config.PREFIX}ɢᴇᴍɪɴɪᴘʀᴏ*
*┋* *⬡ ${config.PREFIX}ʙɪɴɢ*
*┋* *⬡ ${config.PREFIX}ᴄᴏᴘɪʟᴏᴛ*
*┋* *⬡ ${config.PREFIX}ᴄʟᴀᴜᴅᴇᴀɪ*
*┋* *⬡ ${config.PREFIX}ᴍɪsᴛʀᴀᴀɪ*
*┋* *⬡ ${config.PREFIX}ᴍᴇᴛᴀᴀɪ*
*┋* *⬡ ${config.PREFIX}ᴄʜᴀᴛɢᴘᴛ*
*┋* *⬡ ${config.PREFIX}ɢᴘᴛ3*
*┋* *⬡ ${config.PREFIX}ɢᴘᴛ4*
*┋* *⬡ ${config.PREFIX}ɢᴘᴛ4ᴏ*
*┋* *⬡ ${config.PREFIX}ʟʟᴀᴍᴀ2*
*┋* *⬡ ${config.PREFIX}ʟʟᴀᴍᴀ3*
*┋* *⬡ ${config.PREFIX}ғʟᴜx*
*┋* *⬡ ${config.PREFIX}ғʟᴜxᴘʀᴏ*
*┋* *⬡ ${config.PREFIX}ɪᴍᴀɢɪɴᴇ*
*┋* *⬡ ${config.PREFIX}ᴅᴀʟʟᴇ*
*┋* *⬡ ${config.PREFIX}sᴛᴀʙʟᴇᴅɪғғᴜsɪᴏɴ*
╰─────────────╶╶···◈*

*👨‍💻 \`OWNER-CMD\` 👨‍💻* 

╭─────────────···◈
*┋* *⬡  ${config.PREFIX}ᴀɴᴛɪᴄᴀʟʟ ᴏɴ/ᴏғғ*
*┋* *⬡  ${config.PREFIX}sᴇᴛʙᴏᴛɴᴀᴍᴇ*
*┋* *⬡  ${config.PREFIX}sᴇᴛᴏᴡɴᴇʀɴᴀᴍᴇ*
*┋* *⬡  ${config.PREFIX}sᴇᴛʙᴏᴛɪᴍᴀɢᴇ* <ᴜʀʟ>/ʀᴇᴘʟʏ
*┋* *⬡ ${config.PREFIX}ᴘᴍʙʟᴏᴄᴋᴇʀ*
*┋* *⬡ ${config.PREFIX}ᴀᴅᴅᴏᴡɴᴇʀ*
*┋* *⬡ ${config.PREFIX}ᴀᴅᴅsᴜᴅᴏ*
*┋* *⬡ ${config.PREFIX}ᴅᴇʟsᴜᴅᴏ*
*┋* *⬡ ${config.PREFIX}ʟɪsᴛsᴜᴅᴏ*
*┋* *⬡ ${config.PREFIX}ʙᴀɴ*
*┋* *⬡ ${config.PREFIX}ᴜɴʙᴀɴ*
*┋* *⬡ ${config.PREFIX}ʟɪsᴛʙᴀɴ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴍɪɴᴅᴇʀ*
*┋* *⬡ &*
*┋* *⬡ ${config.PREFIX}ᴠᴠ*
*┋* *⬡ ${config.PREFIX}ᴠᴠ2*
*┋* *⬡ ${config.PREFIX}sᴀᴠᴇ*
*┋* *⬡ ${config.PREFIX}sᴀᴠᴇ2*
*┋* *⬡ ${config.PREFIX}👀*
*┋* *⬡ ${config.PREFIX}ᴘɪɴɢ*
*┋* *⬡ ${config.PREFIX}ᴘɪɴɢ2*
*┋* *⬡ ${config.PREFIX}ᴘɪɴɢ3*
*┋* *⬡ ${config.PREFIX}ᴄʍᴅʟɪsᴛ*
*┋* *⬡ ${config.PREFIX}ᴀʟɪᴠᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴛɪɴɢs*
*┋* *⬡ ${config.PREFIX}ᴏᴡɴᴇʀ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴘᴏ*
*┋* *⬡ ${config.PREFIX}ʙᴏᴛsᴇᴛᴛɪɴɢs*
*┋* *⬡ ${config.PREFIX}ꜱʏꜱᴛᴇᴍ*
*┋* *⬡ ${config.PREFIX}ᴜᴘᴅᴀᴛᴇ*
*┋* *⬡ ${config.PREFIX}ꜱᴛᴀᴛᴜꜱ*
*┋* *⬡ ${config.PREFIX}ʙʟᴏᴄᴋ*
*┋* *⬡ ${config.PREFIX}ᴜɴʙʟᴏᴄᴋ*
*┋* *⬡ ${config.PREFIX}sʜᴜᴛᴅᴏᴡɴ*
*┋* *⬡ ${config.PREFIX}ᴄʟᴇᴀʀᴄʜᴀᴛs*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴍᴏᴅᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴘʀᴇғɪx*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴘᴘ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴘᴘᴀʟʟ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴏɴʟɪɴᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛɴᴀᴍᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛʙɪᴏ*
*┋* *⬡ ${config.PREFIX}ɢʀᴏᴜᴘᴘʀɪᴠᴀᴄʏ*
*┋* *⬡ ${config.PREFIX}ᴘʀɪᴠᴀᴄʏsᴇᴛᴛɪɴɢs*
*┋* *⬡ ${config.PREFIX}ʙʟᴏᴄᴋʟɪsᴛ*
*┋* *⬡ ${config.PREFIX}ɢᴇᴛᴘᴘ*
*┋* *⬡ ${config.PREFIX}ʙʀᴏᴀᴅᴄᴀsᴛ*
*┋* *⬡ ${config.PREFIX}ᴊɪᴅ*
*┋* *⬡ ${config.PREFIX}ɢᴊɪᴅ*
*┋* *⬡ ${config.PREFIX}ʀᴇꜱᴛᴀʀᴛ*
╰─────────────╶╶···◈*

*👥 \`GROUP-CMD\` 👥* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}ᴏᴜᴛ*
*┋* *⬡ ${config.PREFIX}ᴠᴄғ*
*┋* *⬡ ${config.PREFIX}ᴛᴀɢᴀᴅᴍɪɴ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴍᴏᴠᴇ*
*┋* *⬡ ${config.PREFIX}ᴅᴇʟᴇᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴀᴅᴅ*
*┋* *⬡ ${config.PREFIX}ᴋɪᴄᴋ*
*┋* *⬡ ${config.PREFIX}ᴋɪᴄᴋ2*
*┋* *⬡ ${config.PREFIX}ᴋɪᴄᴋᴀʟʟ*
*┋* *⬡ ${config.PREFIX}ᴋɪᴄᴋᴀʟʟ2*
*┋* *⬡ ${config.PREFIX}sᴇᴛɢᴏᴏᴅʙʏᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴡᴇʟᴄᴏᴍᴇ*
*┋* *⬡ ${config.PREFIX}ᴘʀᴏᴍᴏᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴅᴇᴍᴏᴛᴇ*
*┋* *⬡ ${config.PREFIX}ʜɪᴅᴇᴛᴀɢ*
*┋* *⬡ ${config.PREFIX}ᴛᴀɢᴀʟʟ*
*┋* *⬡ ${config.PREFIX}ɢᴇᴛᴘᴘ*
*┋* *⬡ ${config.PREFIX}ɪɴᴠɪᴛᴇ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴠᴏᴋᴇ*
*┋* *⬡ ${config.PREFIX}ᴀᴄᴄᴇᴘᴛʀᴇϙᴜᴇsᴛs*
*┋* *⬡ ${config.PREFIX}ᴅᴇᴄʟɪɴᴇʀᴇϙᴜᴇsᴛs*
*┋* *⬡ ${config.PREFIX}ᴍᴜᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴜɴᴍᴜᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴄʟᴏsᴇ*
*┋* *⬡ ${config.PREFIX}ᴏᴘᴇɴ*
*┋* *⬡ ${config.PREFIX}ʟᴇᴀᴠᴇ*
*┋* *⬡ ${config.PREFIX}ɢɴᴀᴍᴇ*
*┋* *⬡ ${config.PREFIX}ɢᴅᴇsᴄ*
*┋* *⬡ ${config.PREFIX}ᴊᴏɪɴ*
*┋* *⬡ ${config.PREFIX}ɢɪɴғᴏ*
*┋* *⬡ ${config.PREFIX}ᴅɪsᴀᴘᴘᴇᴀʀ ᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴅɪsᴀᴘᴘᴇᴀʀ ᴏғғ*
*┋* *⬡ ${config.PREFIX}ᴅɪsᴀᴘᴘᴇᴀʀ 7ᴅ 24ʜ 90ᴅ*
*┋* *⬡ ${config.PREFIX}ɢᴇᴛʙɪᴏ*
*┋* *⬡ ${config.PREFIX}ᴏᴘᴇɴᴛɪᴍᴇ*
*┋* *⬡ ${config.PREFIX}ᴄʟᴏsᴇᴛɪᴍᴇ*
╰─────────────╶╶···◈*

*📃 \`INFO-CMD\` 📃* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}ᴍᴇɴᴜ*
*┋* *⬡ ${config.PREFIX}ʟɪsᴛᴍᴇɴᴜ*
*┋* *⬡ ${config.PREFIX}ᴀʙᴏᴜᴛ*
*┋* *⬡ ${config.PREFIX}sᴄʀɪᴘᴛ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴘᴏ*
*┋* *⬡ ${config.PREFIX}ᴍʀғʀᴀɴᴋ*
*┋* *⬡ ${config.PREFIX}ᴀʟɪᴠᴇ*
*┋* *⬡ ${config.PREFIX}ʙᴏᴛɪɴꜰᴏ*
*┋* *⬡ ${config.PREFIX}ꜱᴛᴀᴛᴜꜱ*
*┋* *⬡ ${config.PREFIX}ꜱᴜᴘᴘᴏʀᴛ*
*┋* *⬡ ${config.PREFIX}ᴘɪɴɢ*
*┋* *⬡ ${config.PREFIX}ᴘɪɴɢ2*
*┋* *⬡ ${config.PREFIX}sᴜʙᴢᴇʀᴏɪɴᴄ*
*┋* *⬡ ${config.PREFIX}ꜱʏꜱᴛᴇᴍ*
*┋* *⬡ ${config.PREFIX}ᴜᴘᴅᴀᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴠᴇʀsɪᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴘᴀɪʀ*
*┋* *⬡ ${config.PREFIX}ᴘᴀɪʀ2*
*┋* *⬡ ${config.PREFIX}ʀᴇᴘᴏʀᴛ*
*┋* *⬡ ${config.PREFIX}ʜᴇʟᴘ*
╰─────────────╶╶···◈*

*🍭 \`CONVERTER-CMD\` 🍭* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}ᴏʙғᴜsᴄᴀᴛᴇ*
*┋* *⬡  ${config.PREFIX}ᴏʙғᴜsᴀᴛᴇ2*
*┋* *⬡ ${config.PREFIX}ᴛᴏᴍᴘ3*
*┋* *⬡ ${config.PREFIX}ᴛᴏᴘᴘᴛ*
*┋* *⬡ ${config.PREFIX}ᴛᴏᴠɪᴅᴇᴏ*
*┋* *⬡ ${config.PREFIX}ᴄᴜʀʀᴇɴᴄʏ*
*┋* *⬡ ${config.PREFIX}sᴛɪᴄᴋᴇʀ*
*┋* *⬡ ${config.PREFIX}sᴛɪᴄᴋᴇʀ2ɪᴍᴀɢᴇ* / ${config.PREFIX}s2ɪ
*┋* *⬡ ${config.PREFIX}ᴠsᴛɪᴄᴋᴇʀ*
*┋* *⬡ ${config.PREFIX}ᴛʀᴀɴsʟᴀᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴛᴛs*
*┋* *⬡ ${config.PREFIX}ᴀᴛᴛᴘ*
*┋* *⬡ ${config.PREFIX}ʟᴏɢᴏ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴍᴏᴠᴇʙɢ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴍɪɴɪ*
*┋* *⬡ ${config.PREFIX}ғᴀɴᴄʏ*
*┋* *⬡ ${config.PREFIX}ϙʀ*
*┋* *⬡ ${config.PREFIX}ʀᴇᴀᴅϙʀ*
*┋* *⬡ ${config.PREFIX}ᴛɪɴʏ*
*┋* *⬡ ${config.PREFIX}sʜᴏʀᴛ*
*┋* *⬡ ${config.PREFIX}ᴠᴇʀsɪᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴛᴇᴍᴘᴍᴀɪʟ*
*┋* *⬡ ${config.PREFIX}ᴇɴᴄᴏᴅᴇ*
*┋* *⬡ ${config.PREFIX}ᴅᴇᴄᴏᴅᴇ*
*┋* *⬡ ${config.PREFIX}ʀɪɴɢᴛᴏɴᴇs*
*┋* *⬡ ${config.PREFIX}ᴜʀʟ*
*┋* *⬡ ${config.PREFIX}ᴜʀʟ2ɪᴍᴀɢᴇ*
*┋* *⬡ ${config.PREFIX}ᴜʀʟ2*
*┋* *⬡ ${config.PREFIX}ᴜᴘʟᴏᴀᴅ*
*┋* *⬡ ${config.PREFIX}ᴛᴏᴘᴅғ*
╰─────────────╶╶···◈*

*⚙️ \`SUBZERO-SETTINGS\` ⚙️* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}sᴜʙᴢᴇʀᴏsᴇᴛᴛɪɴɢs*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴛɪɴɢs*
*┋* *⬡ ${config.PREFIX}ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ*
*┋* *⬡ ${config.PREFIX}ᴀɴᴛɪᴅᴇʟᴇᴛᴇ  ᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴀɴᴛɪᴅᴇʟᴇᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴀɴᴛɪᴄᴀʟʟ*
*┋* *⬡ ${config.PREFIX}ᴀɴᴛɪʟɪɴᴋ*
*┋* *⬡ ${config.PREFIX}ᴀᴜᴛᴏʀᴇᴄᴏʀᴅɪɴɢ*
*┋* *⬡ ${config.PREFIX}ᴀᴜᴛᴏᴛʏᴘɪɴɢ*
*┋* *⬡ ${config.PREFIX}ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ*
*┋* *⬡ ${config.PREFIX}ᴀᴜᴛᴏʀᴇᴘʟʏ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴘʀᴇғɪx*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴏᴡɴᴇʀɴᴀᴍᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴏᴡɴᴇʀɴᴜᴍʙᴇʀ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴍᴏᴅᴇ*
*┋* *⬡ ${config.PREFIX}ᴜᴘᴅᴀᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴘɪɴɢ*
*┋* *⬡ ${config.PREFIX}ᴍʀғʀᴀɴᴋ*
*┋* *⬡ ${config.PREFIX}ᴏᴡɴᴇʀ*
*┋* *⬡ ${config.PREFIX}sᴜʙᴢᴇʀᴏɪɴᴄ*
*┋* *⬡ ${config.PREFIX}ᴀʙᴏᴜᴛ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴛɪɴɢs*
*┋* *⬡ ${config.PREFIX}ᴠᴇʀsɪᴏɴ*
*┋* *⬡ ${config.PREFIX}sᴜᴘᴘᴏʀᴛ*
*┋* *⬡ ${config.PREFIX}ᴀʟɪᴠᴇ*
*┋* *⬡ ${config.PREFIX}sᴇssɪᴏɴs*
*┋* *⬡ ${config.PREFIX}ʀᴇᴘᴏᴛʀᴇᴇ*
*┋* *⬡ ${config.PREFIX}ɪɴsᴛᴀʟʟᴘʟᴜɢɪɴ*
*┋* *⬡ ${config.PREFIX}ᴅᴇʟᴇᴛᴇᴘʟᴜɢɪɴ*
*┋* *⬡ ${config.PREFIX}ʟɪsᴛᴘʟᴜɢɪɴs*
*┋* *⬡ ${config.PREFIX}ᴘʟᴜɢɪɴᴅʟ*
╰─────────────╶╶···◈*

*🔞 \`NSFW-CMD\` 🔞* 

╭─────────────···◈
*┋* *⬡ ${config.PREFIX}ᴇᴊᴀᴄᴜʟᴀᴛɪᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴘᴇɴɪs*
*┋* *⬡ ${config.PREFIX}ᴇʀᴇᴄ*
*┋* *⬡ ${config.PREFIX}ɴᴜᴅᴇ*
*┋* *⬡ ${config.PREFIX}sᴇx*
*┋* *⬡ ${config.PREFIX}ᴄᴜᴛᴇ*
*┋* *⬡ ${config.PREFIX}ᴏʀɢᴀsᴍ*
*┋* *⬡ ${config.PREFIX}ᴀɴᴀʟ*
*┋* *⬡ ${config.PREFIX}sᴜsᴘᴇɴsɪᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴋɪss*
*┋* *⬡ ${config.PREFIX}xᴠɪᴅᴇᴏ*
*┋* *⬡ ${config.PREFIX}xɴxxᴠɪᴅᴇᴏ*
╰─────────────╶╶···◈*

*⚠️ \`CHANNEL MENU\` ⚠️* 

╭─────────────···◈
*┋* 
*┋* *⬡ ${config.PREFIX}ᴄʜᴀɴɴᴇʟʀᴇᴀᴄᴛ*
*┋* *⬡ ${config.PREFIX}ᴄʜᴀɴɴᴇʟʀᴇᴀᴄᴛ2*
*┋* *⬡ ${config.PREFIX}ғᴏʟʟᴏᴡᴄʜᴀɴɴᴇʟ*
*┋* *⬡ ${config.PREFIX}ᴍᴜᴛᴇᴄʜᴀɴɴᴇʟ*
*┋* *⬡ ${config.PREFIX}ᴜɴᴍᴜᴛᴇᴄʜᴀɴɴᴇʟ*
*┋* *⬡ ${config.PREFIX}ᴅᴇʟᴇᴛᴇᴄʜᴀɴɴᴇʟᴅᴘ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴄʜᴀɴɴᴇʟɴᴀᴍᴇ*
*┋* *⬡ ${config.PREFIX}sᴇᴛᴄʜᴀɴɴᴇʟᴅᴇsᴄ*
*┋* *⬡ ${config.PREFIX}ᴢᴇʀᴏᴇxᴇᴄᴜᴛɪᴏɴ*
*┋* *⬡ ${config.PREFIX}ᴢʜᴇᴀᴅsʜᴏʀᴛ*
*┋* *⬡ ${config.PREFIX}ᴢᴜɪ*
╰─────────────╶╶···◈*

*━━━━━━━━━━━━━━━━━━━━*⁠⁠⁠⁠
> ＭＡＤＥ ＢＹ ＭＲ ＦＲＡＮＫ
*━━━━━━━━━━━━━━━━━━━━━*
`;

        // Send the menu message
        await conn.sendMessage(
            from,
            {
                image: { url: imageUrl },
                caption: dec,
                ai: true,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363304325601080@newsletter',
                        newsletterName: '🍁『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』🍁 ',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );
      
        /*
        // Send audio from provided URL
        await conn.sendMessage(from, {
            audio: { url: 'https://files.catbox.moe/qda847.m4a' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: mek });
        */
      
        // Remove typing indicator after all messages have been sent
      //  await conn.sendPresenceUpdate('paused', from);
        
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

//  SUBZERO SC BY MR FRANK
