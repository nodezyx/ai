
const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Simple button check function
function shouldUseButtons() {
    const buttonStatus = config.BUTTON || "false";
    return buttonStatus === "true" || buttonStatus === true;
}

cmd({
  pattern: 'script',
  alias: ['sc', 'subzero', 'repo', 'support'],
  react: '❄️',
  desc: 'Show SubZero MD script information with contact options',
  category: 'info',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const from = m.chat;
    
    await reply('🔍 Fetching SubZero repository info from GitHub...');

    // Official GitHub API endpoint with proper error handling
    const apiUrl = 'https://api.github.com/repos/mrfrankofcc/SUBZERO-MD';
    let repoData = null;
    
    try {
      const response = await axios.get(apiUrl, { timeout: 10000 });
      repoData = response.data;
    } catch (apiError) {
      console.log('GitHub API failed, using fallback data:', apiError.message);
      // Continue with fallback data
    }

    // Use API data or fallback
    const repoName = repoData?.name || 'SUBZERO-MD';
    const ownerName = repoData?.owner?.login || 'mrfrankofcc';
    const ownerAvatar = repoData?.owner?.avatar_url || 'https://avatars.githubusercontent.com/u/123456789?v=4';
    const stars = repoData?.stargazers_count || '100+';
    const forks = repoData?.forks_count || '50+';
    const description = repoData?.description || 'Multi-device WhatsApp Bot';
    const htmlUrl = repoData?.html_url || 'https://github.com/mrfrankofcc/SUBZERO-MD';
    const zipUrl = repoData ? `${repoData.html_url}/archive/refs/heads/${repoData.default_branch}.zip` : 'https://github.com/mrfrankofcc/SUBZERO-MD/archive/main.zip';

    const message = `
❄️ \`SUBZERO-MD SCRIPT\` ❄️

📂 *Repository:* ${repoName}
👤 *Owner:* ${ownerName}
🙋‍♂️ *Developer:* Mr Frank (Darrell Mucheri)
📞 *Contact:* +263719647303
🔗 *URL:* ${htmlUrl}

⭐ *Stars:* ${stars}
🍴 *Forks:* ${forks}
💻 *Language:* ${repoData?.language || 'JavaScript'}

📝 *Description:* ${description}

📥 *Download:*
▸ ZIP: ${zipUrl}
▸ git clone \`${htmlUrl}.git\`

📢 *Support Channel:*
https://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D

*Type* \`.menu\` *for more commands*
    `;

    const useButtons = shouldUseButtons();

    if (useButtons) {
      // Button-based interface
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const buttonsMessage = {
        image: { url: ownerAvatar },
        caption: message.trim(),
        footer: 'Select an option below',
        buttons: [
          {
            buttonId: `script-contact-${sessionId}`,
            buttonText: { displayText: '📞 Contact' },
            type: 1
          },
          {
            buttonId: `script-repo-${sessionId}`,
            buttonText: { displayText: '🐱 GitHub' },
            type: 1
          },
          {
            buttonId: `script-channel-${sessionId}`,
            buttonText: { displayText: '📢 Channel' },
            type: 1
          },
          {
            buttonId: `script-fork-${sessionId}`,
            buttonText: { displayText: '🍴 Fork' },
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
            body: `Stars: ${stars} | Forks: ${forks}`,
            thumbnail: { url: ownerAvatar },
            mediaType: 1,
            mediaUrl: htmlUrl,
            sourceUrl: htmlUrl
          }
        }
      };

      // Send message with buttons
      const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
      const messageId = finalMsg.key.id;

      // Button handler
      const buttonHandler = async (msgData) => {
        try {
          const receivedMsg = msgData.messages[0];
          if (!receivedMsg?.message?.buttonsResponseMessage) return;

          const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
          const senderId = receivedMsg.key.remoteJid;
          const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

          if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
            conn.ev.off('messages.upsert', buttonHandler);

            await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

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
                text: `🐱 *GitHub Repository*\n\n${htmlUrl}\n\n📋 *Description:* ${description}\n\n⭐ *Stars:* ${stars}\n🍴 *Forks:* ${forks}\n\n🔗 Click the link above to visit the repository`
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`script-channel-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `📢 *Support Channel*\n\nJoin our official WhatsApp channel for updates and support:\n\nhttps://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D\n\nStay updated with the latest features!`
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`script-fork-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `🍴 *Fork Repository*\n\nTo fork and customize:\n1. Visit: ${htmlUrl}\n2. Click "Fork" button\n3. Create your copy\n4. Start customizing!\n\nThis allows you to create your own version while staying updated with main repository.`
              }, { quoted: receivedMsg });
            }

            await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
          }
        } catch (error) {
          console.error('Button handler error:', error);
        }
      };

      // Add listener
      conn.ev.on('messages.upsert', buttonHandler);

      // Remove listener after timeout
      setTimeout(() => {
        conn.ev.off('messages.upsert', buttonHandler);
      }, 120000);

    } else {
      // Text-based interface
      await conn.sendMessage(from, {
        image: { url: ownerAvatar },
        caption: message.trim(),
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      }, { quoted: mek });
    }

  } catch (error) {
    console.error('Script command error:', error);
    
    // Simple fallback message
    await reply(`❄️ *SUBZERO-MD SCRIPT*\n\n📞 Developer: Mr Frank (+263719647303)\n🔗 GitHub: https://github.com/mrfrankofcc/SUBZERO-MD\n📢 Channel: https://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D\n\nError: ${error.message}`);
  }
});
