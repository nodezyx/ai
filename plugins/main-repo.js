const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'script',
  alias: ['sc', 'subzero', 'repo'],
  react: '❄️',
  desc: 'Show SubZero MD script information',
  category: 'info',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    await reply('🔍 Fetching SubZero repository info from GitHub...');

    // Official GitHub API endpoint
    const apiUrl = 'https://api.github.com/repos/mrfrankofcc/SUBZERO-MD';
    const { data: repo } = await axios.get(apiUrl, { timeout: 10000 });

    const owner = repo.owner;
    const zipUrl = `${repo.html_url}/archive/refs/heads/${repo.default_branch}.zip`;
    const createdAt = new Date(repo.created_at).toLocaleDateString();
    const updatedAt = new Date(repo.updated_at).toLocaleDateString();

    const message = `
❄️ \`SUBZERO-MD SCRIPT\` ❄️

📂 *Repository:* ${repo.name}
👤 *Owner:* ${owner.login}
🙋‍♂️ *Developer:* Darrell Mucheri
🔗 *URL:* ${repo.html_url}

⭐ *Stars:* ${repo.stargazers_count}
🍴 *Forks:* ${repo.forks_count}
👀 *Watchers:* ${repo.subscribers_count}
⚠️ *Open Issues:* ${repo.open_issues_count}
💻 *Language:* ${repo.language || 'Not specified'}

📅 *Created:* ${createdAt}
🔄 *Updated:* ${updatedAt}
🏷️ *License:* ${repo.license?.name || 'None'}
🌍 *Homepage:* ${repo.homepage || 'N/A'}

📥 \`Download:\`
▸ ZIP: [Download Link](${zipUrl})
▸ git clone \`${repo.clone_url}\`

✨ \`Features\`:
• Multi-Device WhatsApp Bot
• Plugin System
• ${repo.size} KB Source Code
• ${repo.has_wiki ? '📘 Wiki Available' : '📕 No Wiki'}
• ${repo.archived ? '⚠️ Archived' : '🚀 Active'}
• ${repo.has_downloads ? '📦 Downloads Enabled' : '📁 Cloning Required'}

*Type* \`.menu\` *for more commands*
    `;

    await conn.sendMessage(m.chat, {
      image: { url: owner.avatar_url },
      caption: message.trim(),
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: m });

  } catch (error) {
    console.error('Script command error:', error);
    await reply(`❌ *Failed to fetch script info from GitHub!*\n\n🔗 GitHub: https://github.com/mrfrankofcc/SUBZERO-MD\n📦 ZIP: https://github.com/mrfrankofcc/SUBZERO-MD/archive/main.zip\n\n_Error:_ ${error.message}`);
  }
});
