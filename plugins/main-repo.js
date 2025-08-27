const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');
const { shouldUseButtons } = require('./settings'); // Import from your settings plugin

cmd({
  pattern: 'script',
  alias: ['sc', 'subzero', 'repo', 'support'],
  react: '❄️',
  desc: 'Show SubZero MD script information with contact options',
  category: 'info',
  filename: __filename
}, async (conn, mek, m, { reply, from }) => {
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
🙋‍♂️ *Developer:* Mr Frank (Darrell Mucheri)
📞 *Contact:* +263719647303
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

📢 \`Support Channel:\`
https://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D

*Type* \`.menu\` *for more commands*
    `;

    const useButtons = shouldUseButtons();

    if (useButtons) {
      // Button-based interface
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const buttonsMessage = {
        image: { url: owner.avatar_url },
        caption: message.trim(),
        footer: 'Select an option below',
        buttons: [
          {
            buttonId: `script-contact-${sessionId}`,
            buttonText: { displayText: '📞 Contact Developer' },
            type: 1
          },
          {
            buttonId: `script-repo-${sessionId}`,
            buttonText: { displayText: '🐱 GitHub Repo' },
            type: 1
          },
          {
            buttonId: `script-channel-${sessionId}`,
            buttonText: { displayText: '📢 Support Channel' },
            type: 1
          },
          {
            buttonId: `script-fork-${sessionId}`,
            buttonText: { displayText: '🍴 Fork Repo' },
            type: 1
          }
        ],
        headerType: 4,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: 'SUBZERO-MD Script',
            body: `Version: ${repo.default_branch} | Stars: ${repo.stargazers_count}`,
            thumbnail: { url: owner.avatar_url },
            mediaType: 1,
            mediaUrl: repo.html_url,
            sourceUrl: repo.html_url
          }
        }
      };

      // Send message with buttons
      const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
      const messageId = finalMsg.key.id;

      // Button handler
      const buttonHandler = async (msgData) => {
        const receivedMsg = msgData.messages[0];
        if (!receivedMsg.message?.buttonsResponseMessage) return;

        const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
        const senderId = receivedMsg.key.remoteJid;
        const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

        if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
          conn.ev.off('messages.upsert', buttonHandler);

          await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

          try {
            if (buttonId.startsWith(`script-contact-${sessionId}`)) {
              await conn.sendMessage(from, {
                contacts: {
                  contacts: [{
                    displayName: 'Mr Frank (Developer)',
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Mr Frank (Developer)\nTEL;type=CELL;type=VOICE;waid=263719647303:+263 71 964 7303\nORG:SUBZERO-MD Development\nNOTE:WhatsApp Bot Developer\nEND:VCARD`
                  }]
                }
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`script-repo-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `🐱 *GitHub Repository*\n\n${repo.html_url}\n\n📋 *Description:* ${repo.description || 'No description'}\n\n🔗 Click the link above to visit the repository`
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`script-channel-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `📢 *Support Channel*\n\nJoin our official WhatsApp channel for updates, support, and news:\n\nhttps://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D\n\nStay updated with the latest features and fixes!`
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`script-fork-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `🍴 *Fork the Repository*\n\nTo fork the repository:\n1. Visit: ${repo.html_url}\n2. Click the "Fork" button (top right)\n3. Create your own copy\n4. Start customizing!\n\n📚 *Forking helps you:*\n• Create your own version\n• Contribute back via Pull Requests\n• Keep your bot updated`
              }, { quoted: receivedMsg });
            }

            await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
          } catch (error) {
            console.error('Button action error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
            reply(`❌ Error: ${error.message || 'Action failed'}`);
          }
        }
      };

      // Add listener
      conn.ev.on('messages.upsert', buttonHandler);

      // Remove listener after 2 minutes
      setTimeout(() => {
        conn.ev.off('messages.upsert', buttonHandler);
      }, 120000);

    } else {
      // Text-based interface
      await conn.sendMessage(from, {
        image: { url: owner.avatar_url },
        caption: message.trim(),
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      }, { quoted: mek });

      // Send additional contact information
      await conn.sendMessage(from, {
        text: `📞 *Contact Developer:* +263719647303\n📢 *Support Channel:* https://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D\n🍴 *Fork Repo:* ${repo.html_url}\n\nUse *.buttons on* to enable interactive buttons for easier access!`
      });
    }

  } catch (error) {
    console.error('Script command error:', error);
    
    const fallbackMessage = `❄️ \`SUBZERO-MD SCRIPT\` ❄️

📂 *Repository:* SUBZERO-MD
👤 *Developer:* Mr Frank (Darrell Mucheri)
📞 *Contact:* +263719647303
🔗 *GitHub:* https://github.com/mrfrankofcc/SUBZERO-MD

📥 *Download:* https://github.com/mrfrankofcc/SUBZERO-MD/archive/main.zip
📢 *Support Channel:* https://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D

*Features:*
• Multi-Device WhatsApp Bot
• Plugin System
• Easy to customize
• Active development

*Type* \`.menu\` *for more commands*`;

    await conn.sendMessage(from, {
      text: fallbackMessage,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: mek });
  }
});
