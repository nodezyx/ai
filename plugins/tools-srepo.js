const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Simple button check function
function shouldUseButtons() {
    const buttonStatus = config.BUTTON || "false";
    return buttonStatus === "true" || buttonStatus === true;
}

cmd({
  pattern: 'gitrepo',
  alias: ['github', 'reposearch', 'gh', 'repository'],
  react: '🐱',
  desc: 'Search GitHub repository information',
  category: 'search',
  filename: __filename
}, async (conn, mek, m, { reply, q, text }) => {
  try {
    const from = m.chat;
    
    if (!q) {
      return reply(`❌ Please provide a repository search query\n\nExample:\n• .gitrepo subzero-md\n• .gitrepo mrfrankofcc/SUBZERO-MD\n• .gitrepo facebook/react`);
    }

    await reply('🔍 Searching GitHub repositories...');

    // Check if it's in owner/repo format
    if (q.includes('/') && q.split('/').length === 2) {
      // Specific repository search
      const [owner, repoName] = q.split('/');
      await getSpecificRepo(conn, from, mek, owner, repoName);
    } else {
      // General search
      await searchRepositories(conn, from, mek, q);
    }

  } catch (error) {
    console.error('GitRepo command error:', error);
    await reply('❌ Error fetching repository information. Please try again later.');
  }
});

async function getSpecificRepo(conn, from, mek, owner, repoName) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SubZero-MD-Bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const repo = response.data;
    
    const message = `
🌟 *${repo.name}* by *${repo.owner.login}*

📝 *Description:* ${repo.description || 'No description'}
⭐ *Stars:* ${repo.stargazers_count.toLocaleString()}
🔀 *Forks:* ${repo.forks_count.toLocaleString()}
👀 *Watchers:* ${repo.watchers_count.toLocaleString()}
🐛 *Issues:* ${repo.open_issues_count.toLocaleString()}
📄 *License:* ${repo.license?.name || 'None'}
🌐 *Language:* ${repo.language || 'Not specified'}

📅 *Created:* ${new Date(repo.created_at).toLocaleDateString()}
🔄 *Updated:* ${new Date(repo.updated_at).toLocaleDateString()}
🚀 *Pushed:* ${new Date(repo.pushed_at).toLocaleDateString()}

🔗 *URL:* ${repo.html_url}
📖 *Clone URL:* ${repo.clone_url}
🌍 *Homepage:* ${repo.homepage || 'Not available'}

${repo.archived ? '🔒 *This repository is archived*' : ''}
${repo.disabled ? '🚫 *This repository is disabled*' : ''}
${repo.fork ? '🍴 *This is a fork*' : ''}
`;

    const useButtons = shouldUseButtons();

    if (useButtons) {
      // Button-based interface
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const buttonsMessage = {
        image: { url: repo.owner.avatar_url },
        caption: message.trim(),
        footer: 'Select an option below',
        buttons: [
          {
            buttonId: `repo-visit-${sessionId}`,
            buttonText: { displayText: '🌐 Visit Repo' },
            type: 1
          },
          {
            buttonId: `repo-readme-${sessionId}`,
            buttonText: { displayText: '📖 Readme' },
            type: 1
          },
          {
            buttonId: `repo-stars-${sessionId}`,
            buttonText: { displayText: '⭐ Stars' },
            type: 1
          },
          {
            buttonId: `repo-fork-${sessionId}`,
            buttonText: { displayText: '🔀 Fork' },
            type: 1
          }
        ],
        headerType: 4,
        contextInfo: {
          mentionedJid: [mek.sender],
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: `${repo.name} - GitHub`,
            body: `⭐ ${repo.stargazers_count} stars | 🔀 ${repo.forks_count} forks`,
            thumbnail: { url: repo.owner.avatar_url },
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
        try {
          const receivedMsg = msgData.messages[0];
          if (!receivedMsg?.message?.buttonsResponseMessage) return;

          const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
          const senderId = receivedMsg.key.remoteJid;
          const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

          if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
            conn.ev.off('messages.upsert', buttonHandler);

            await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

            if (buttonId.startsWith(`repo-visit-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `🌐 *Visit Repository*\n\n${repo.html_url}\n\nOpen this link in your browser to view the repository.`
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`repo-readme-${sessionId}`)) {
              try {
                const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/readme`, {
                  headers: {
                    'User-Agent': 'SubZero-MD-Bot',
                    'Accept': 'application/vnd.github.v3.raw'
                  }
                });
                
                const readmeText = readmeResponse.data.toString().substring(0, 500);
                if (readmeText.length > 0) {
                  await conn.sendMessage(from, {
                    text: `📖 *README Preview:*\n${readmeText}${readmeText.length === 500 ? '...' : ''}\n\n🔗 *Full README:* ${repo.html_url}#readme`
                  }, { quoted: receivedMsg });
                }
              } catch (readmeError) {
                await conn.sendMessage(from, {
                  text: '❌ No README found for this repository or error fetching README.'
                }, { quoted: receivedMsg });
              }
            }
            else if (buttonId.startsWith(`repo-stars-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `⭐ *Repository Stats*\n\nStars: ${repo.stargazers_count.toLocaleString()}\nForks: ${repo.forks_count.toLocaleString()}\nWatchers: ${repo.watchers_count.toLocaleString()}\nOpen Issues: ${repo.open_issues_count.toLocaleString()}\n\nLanguage: ${repo.language || 'Not specified'}\nLicense: ${repo.license?.name || 'None'}`
              }, { quoted: receivedMsg });
            }
            else if (buttonId.startsWith(`repo-fork-${sessionId}`)) {
              await conn.sendMessage(from, {
                text: `🔀 *Fork Repository*\n\nTo fork this repository:\n1. Visit: ${repo.html_url}\n2. Click the "Fork" button\n3. Create your own copy\n4. Start customizing!\n\nClone URL: \`${repo.clone_url}\``
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
        image: { url: repo.owner.avatar_url },
        caption: message.trim(),
        contextInfo: {
          mentionedJid: [mek.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      }, { quoted: mek });

      // Also send the readme if available
      try {
        const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/readme`, {
          headers: {
            'User-Agent': 'SubZero-MD-Bot',
            'Accept': 'application/vnd.github.v3.raw'
          }
        });
        
        const readmeText = readmeResponse.data.toString().substring(0, 500);
        if (readmeText.length > 0) {
          await conn.sendMessage(from, {
            text: `📖 *README Preview:*\n${readmeText}${readmeText.length === 500 ? '...' : ''}`
          }, { quoted: mek });
        }
      } catch (readmeError) {
        console.log('No README found or error fetching README');
      }
    }

  } catch (error) {
    if (error.response?.status === 404) {
      await conn.sendMessage(from, { 
        text: '❌ Repository not found. Please check the owner and repository name.\n\nFormat: .gitrepo owner/repository\nExample: .gitrepo mrfrankofcc/SUBZERO-MD' 
      }, { quoted: mek });
    } else {
      console.error('Specific repo error:', error);
      await conn.sendMessage(from, { 
        text: '❌ Error fetching repository details. Please try again later.' 
      }, { quoted: mek });
    }
  }
}

async function searchRepositories(conn, from, mek, query) {
  try {
    const response = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc`, {
      headers: {
        'User-Agent': 'SubZero-MD-Bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const results = response.data.items.slice(0, 5); // Top 5 results
    
    if (results.length === 0) {
      return conn.sendMessage(from, { 
        text: '❌ No repositories found for your search query.' 
      }, { quoted: mek });
    }

    let message = `🔍 *GitHub Search Results for "${query}"*\n\n`;
    
    results.forEach((repo, index) => {
      message += `${index + 1}. *${repo.full_name}*\n`;
      message += `   📝 ${repo.description || 'No description'}\n`;
      message += `   ⭐ ${repo.stargazers_count.toLocaleString()} | 🔀 ${repo.forks_count.toLocaleString()} | 🌐 ${repo.language || 'N/A'}\n`;
      message += `   🔗 ${repo.html_url}\n\n`;
    });

    message += `💡 Use *.gitrepo owner/repo* for detailed information about a specific repository.`;

    const useButtons = shouldUseButtons();

    if (useButtons) {
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const buttonsMessage = {
        text: message.trim(),
        footer: 'Select a repository for details',
        buttons: results.map((repo, index) => ({
          buttonId: `search-result-${index}-${sessionId}`,
          buttonText: { displayText: `${index + 1}. ${repo.name}` },
          type: 1
        })),
        headerType: 1,
        contextInfo: {
          mentionedJid: [mek.sender]
        }
      };

      const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
      const messageId = finalMsg.key.id;

      const buttonHandler = async (msgData) => {
        try {
          const receivedMsg = msgData.messages[0];
          if (!receivedMsg?.message?.buttonsResponseMessage) return;

          const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
          const senderId = receivedMsg.key.remoteJid;
          const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

          if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
            conn.ev.off('messages.upsert', buttonHandler);
            
            const index = parseInt(buttonId.split('-')[2]);
            if (index >= 0 && index < results.length) {
              const selectedRepo = results[index];
              await getSpecificRepo(conn, from, receivedMsg, selectedRepo.owner.login, selectedRepo.name);
            }
          }
        } catch (error) {
          console.error('Search button handler error:', error);
        }
      };

      conn.ev.on('messages.upsert', buttonHandler);
      setTimeout(() => conn.ev.off('messages.upsert', buttonHandler), 120000);

    } else {
      await conn.sendMessage(from, { 
        text: message.trim() 
      }, { quoted: mek });
    }

  } catch (error) {
    console.error('Search repo error:', error);
    await conn.sendMessage(from, { 
      text: '❌ Error searching repositories. Please try again later.' 
    }, { quoted: mek });
  }
}

// Additional trending command
cmd({
  pattern: "trending",
  alias: ['trend', 'githubtrend', 'ghtrend'],
  react: '🔥',
  desc: "Get trending GitHub repositories",
  category: "search",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, text }) => {
  try {
    const language = q ? `&language=${encodeURIComponent(q)}` : '';
    const response = await axios.get(`https://api.github.com/search/repositories?q=stars:>1000${language}&sort=stars&order=desc&per_page=8`, {
      headers: {
        'User-Agent': 'SubZero-MD-Bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const trendingRepos = response.data.items;
    
    let message = `🔥 *Trending GitHub Repositories* ${q ? `in ${q}` : ''}\n\n`;
    
    trendingRepos.forEach((repo, index) => {
      message += `${index + 1}. *${repo.full_name}*\n`;
      message += `   ⭐ ${repo.stargazers_count.toLocaleString()} stars\n`;
      message += `   📝 ${(repo.description || 'No description').substring(0, 60)}${repo.description && repo.description.length > 60 ? '...' : ''}\n`;
      message += `   🔗 ${repo.html_url}\n\n`;
    });

    message += `💡 Use *.gitrepo owner/repo* for detailed information.`;

    await reply(message);

  } catch (error) {
    console.error('Trending error:', error);
    reply('❌ Error fetching trending repositories.');
  }
});
