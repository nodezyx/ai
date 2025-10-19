const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: "recentplugins",
    alias: ["recentplugs", "newplugins", "whatsnew"],
    react: "🆕",
    desc: "List plugins updated in the last 2 hours",
    category: "info",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Validate config.REPO
        if (!config.REPO) throw new Error('Repository URL not configured in config.REPO');
        
        // Extract repo path from config.REPO
        const repoPath = config.REPO.replace('https://github.com/', '').replace(/\/$/, '');
        const [owner, repo] = repoPath.split('/');
        
        if (!owner || !repo) throw new Error('Invalid repository URL format in config.REPO');

        const pluginsFolder = 'plugins';
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${pluginsFolder}`;

        // Fetch plugins
        const { data: plugins } = await axios.get(apiUrl);
        const pluginFiles = plugins.filter(item => item.type === 'file' && item.name.endsWith('.js'));

        if (pluginFiles.length === 0) {
            return reply("❌ No plugin files found in the repository");
        }

        // Check recent updates
        const recentUpdates = [];
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        for (const plugin of pluginFiles) {
            try {
                const { data: [latestCommit] } = await axios.get(
                    `https://api.github.com/repos/${owner}/${repo}/commits`,
                    { params: { path: plugin.path, per_page: 1 } }
                );
                
                if (latestCommit && new Date(latestCommit.commit.author.date) > twoHoursAgo) {
                    recentUpdates.push({
                        name: plugin.name.replace('.js', ''),
                        updated: moment(latestCommit.commit.author.date).fromNow(),
                        author: latestCommit.author?.login || 'Unknown'
                    });
                }
            } catch (e) {
                console.error(`Error checking ${plugin.name}:`, e.message);
            }
        }

        // Format response
        if (recentUpdates.length === 0) {
            return reply("🕒 No plugins updated in the last 2 hours");
        }

        let message = `🆕 *Recently Updated Plugins* 🆕\n`;
        message += `⏳ *Last 2 Hours*\n\n`;
        message += `📂 *Repository:* ${config.REPO}\n\n`;
        
        recentUpdates.forEach((plugin, index) => {
            message += `${index + 1}. *${plugin.name}*\n`;
            message += `   👤 Updated by: ${plugin.author}\n`;
            message += `   ⏰ ${plugin.updated}\n\n`;
        });

        message += `\n💡 *Tip:* Use .getplugin <name> to download updates`;
        
        await conn.sendMessage(from, {
            text: message,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363304325601080@newsletter',
                    newsletterName: config.BOT_NAME ? `${config.BOT_NAME} Updates` : 'Plugin Updates',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Recent plugins error:", error);
        reply(`❌ Error: ${error.message}\n\nPlease ensure:\n1. config.REPO is properly set\n2. The repository is public\n3. GitHub API is available`);
    }
});
