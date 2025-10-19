const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');
const moment = require('moment-timezone');

cmd({
    pattern: 'version',
    react: '📦',
    desc: 'Check bot version and compare with repository',
    category: 'info',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const time = moment().tz('Africa/Harare').format('HH:mm:ss');
        const date = moment().tz('Africa/Harare').format('DD/MM/YYYY');
        
        // Get local version
        const localPackage = require('../package.json');
        const currentVersion = localPackage.version;
        
        // Extract repo info from config.REPO
        const repoUrl = config.REPO || 'https://github.com/mrfrank-ofc/SUBZERO-MD';
        const repoPath = repoUrl.replace('https://github.com/', '');
        const rawUrl = `https://raw.githubusercontent.com/${repoPath}/master/package.json`;

        // Fetch remote version
        const { data: remotePackage } = await axios.get(rawUrl);
        const latestVersion = remotePackage.version;

        // Version comparison
        const versionStatus = currentVersion === latestVersion 
            ? '🟢 UP-TO-DATE' 
            : '🔴 UPDATE AVAILABLE';
        
        const versionDiff = currentVersion === latestVersion
            ? `✅ You're running the latest version (v${currentVersion})`
            : `📥 Current: v${currentVersion}\n🆕 Latest: v${latestVersion}`;

        // Build message
        const message = `
📦 *VERSION COMPARISON* 📦

${versionStatus}

${versionDiff}

⏰ Checked at: ${time} (${date})

💻 *Developer:* ${config.OWNER_NAME || "Mr Frank"}
🤖 *Bot Name:* ${config.BOT_NAME || "SUBZERO-MD"}

🔗 *Repository:*
${repoUrl}
⭐ *Please star the repo to support development!*
`.trim();

        // Send response
        await conn.sendMessage(from, { 
            image: { 
                url: config.ALIVE_IMG || 'https://i.postimg.cc/zv76KffW/IMG-20250115-WA0020.jpg' 
            },
            caption: message,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363304325601080@newsletter',
                    newsletterName: config.BOT_NAME ? `${config.BOT_NAME} Bot` : 'SUBZERO MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Version check error:", e);
        
        // Fallback with local version only
        const localPackage = require('../package.json');
        const fallback = `
⚠️ *Version Check (Partial)*
        
📦 Local Version: v${localPackage.version}
🔗 Repository: ${config.REPO || "Not configured"}

❌ Couldn't fetch remote version:
${e.message}
`.trim();
        
        reply(fallback);
    }
});
