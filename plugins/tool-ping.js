/*const config = require('../config');
const { cmd } = require('../command');
const moment = require('moment-timezone');

// Quoted message style
const subzero = {
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
*/
// Subzero quoted style:
const config = require('../config');
const { cmd } = require('../command');
const moment = require('moment-timezone');

// Quoted message style
const subzero = {
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

const ai = {
  key: {
    remoteJid: "status@broadcast",   // Where the message appears
    fromMe: false,                   // Sent by you? false
    participant: "13135550002@s.whatsapp.net" // Fake participant ID
  },
  message: {
    contactMessage: {
      displayName: "Mr Frank",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:Meta AI
TEL;type=CELL;type=VOICE;waid=13135550002:+1 3135550002
END:VCARD`
    }
  }
};

cmd({
  pattern: "ping",
  alias: ["speed", "pong"],
  desc: "Check bot's response time",
  category: "core",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  try {
    const start = Date.now();

    // Send initial message with Subzero quoted style
    await conn.sendMessage(from, {
      text: "```Testing latency...⌛️```",
      contextInfo: {
        quotedMessage: ai.message,
        mentionedJid: [mek.sender]
      }
    });

    const speed = Date.now() - start;

    // Send result with Subzero quoted style
    await conn.sendMessage(from, {
      text: `\`\`\`Pong ${speed}ms\`\`\``,
      contextInfo: {
        quotedMessage: ai.message,
        mentionedJid: [mek.sender]
      }
    });

  } catch (e) {
    console.error("Ping command error:", e);
    await conn.sendMessage(from, {
      text: `❌ Error: ${e.message}`,
      contextInfo: {
        quotedMessage: ai.message,
        mentionedJid: [mek.sender]
      }
    });
  }
});

cmd({
  pattern: "pingx",
  alias: ["speed", "pong"],
  desc: "Check bot's response time",
  category: "core",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  try {
    const start = Date.now();

    // Send initial message
    await conn.sendMessage(from, { text: "```Testing latency...⌛️```" });

    const speed = Date.now() - start;

    // Send result
    await conn.sendMessage(from, { text: `\`\`\`Pong ${speed}ms\`\`\`` });

  } catch (e) {
    console.error("Ping command error:", e);
    await conn.sendMessage(from, { text: `❌ Error: ${e.message}` });
  }
});


// Command: ping
cmd({
  pattern: "ping2",
  alias: ["speed", "pong"],
  desc: "Check bot's response time and status",
  category: "core",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const start = Date.now();

    const emojiSets = {
      reactions: ['⚡', '🚀', '💨', '🎯', '🌟', '💎', '🔥', '✨', '🌀', '🔹'],
      decorations: ['▰▰▰▰▰▰▰▰▰▰', '▰▱▱▱▱▱▱▱▱▱', '▰▰▱▱▱▱▱▱▱▱', '▰▰▰▱▱▱▱▱▱▱', '▰▰▰▰▱▱▱▱▱▱'],
      status: ['🟢 ONLINE', '🔵 ACTIVE', '🟣 RUNNING', '🟡 RESPONDING']
    };

    const reactionEmoji = emojiSets.reactions[Math.floor(Math.random() * emojiSets.reactions.length)];
    const statusEmoji = emojiSets.status[Math.floor(Math.random() * emojiSets.status.length)];
    const loadingBar = emojiSets.decorations[Math.floor(Math.random() * emojiSets.decorations.length)];

    await conn.sendMessage(from, {
      react: { text: reactionEmoji, key: mek.key }
    });

    const responseTime = (Date.now() - start) / 1000;
    const time = moment().tz('Africa/Harare').format('HH:mm:ss');
    const date = moment().tz('Africa/Harare').format('DD/MM/YYYY');

    const pingMessage = `
${loadingBar}
*${statusEmoji}*

⚡ \`Response Time:\` ${responseTime.toFixed(2)}ms  
⏰ \`Time:\` ${time}  
📅 \`Date:\` ${date}  

💻 \`DEVELOPER:\` ${config.OWNER_NAME || "Mr Frank"}  
🤖 \`Bot Name:\` ${config.BOT_NAME || "SUBZERO-MD"}  

🌟 *Don't forget to star & fork the repo!*  
🔗 ${config.REPO || "https://github.com/mrfrank-ofc/SUBZERO-MD"}  

${loadingBar}
    `.trim();

    await conn.sendMessage(from, {
      text: pingMessage,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363304325601080@newsletter',
          newsletterName: "🚀 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 🚀",
          serverMessageId: 143
        }
      }
    }, { quoted: subzero });

  } catch (e) {
    console.error("Ping command error:", e);
    reply(`❌ Error: ${e.message}`);
  }
});

// Command: ping2
cmd({
  pattern: "ping2",
  desc: "Advanced ping with system info",
  category: "core",
  react: "🧠",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const startTime = Date.now();
    const loadingMsg = await conn.sendMessage(from, {
      text: '🚀 *Measuring SUBZERO performance...*',
      quoted: subzero
    });

    const endTime = Date.now();
    const ping = endTime - startTime;

    const systemEmojis = {
      cpu: '⚙️',
      ram: '🧠',
      speed: '⚡',
      clock: '⏱️',
      repo: '📦'
    };

    const pingMessage = `
${systemEmojis.cpu} *SYSTEM PERFORMANCE*

${systemEmojis.clock} *Response Time:* ${ping}ms  
${systemEmojis.speed} *Speed:* ${ping < 500 ? '⚡ Blazing Fast' : ping < 1000 ? '🚀 Fast' : '🐢 Slow'}

${systemEmojis.repo} *Repository:*  
${config.REPO || "https://github.com/mrfrank-ofc/SUBZERO-MD"}

💫 *Don't forget to star the repo!*
    `.trim();

    await conn.sendMessage(from, {
      text: pingMessage,
      edit: loadingMsg.key,
      quoted: subzero
    });

  } catch (e) {
    console.error("Ping2 error:", e);
    reply(`⚠️ Command failed: ${e.message}`);
  }
});

// Command: ping3
cmd({
  pattern: "ping3",
  desc: "Ping with typing simulation",
  category: "tool",
  react: "⏱️",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    await conn.sendPresenceUpdate('composing', from);

    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500));
    const latency = Date.now() - start;

    await conn.sendPresenceUpdate('paused', from);

    const resultMessage = `
⏱️ *Real-time Performance Metrics*

🏓 *Pong!*  
📶 *Latency:* ${latency}ms  
📊 *Status:* ${latency < 300 ? 'Excellent' : latency < 600 ? 'Good' : 'Fair'}

✨ *Keep SUBZERO alive by starring the repo!*  
🔗 ${config.REPO || "https://github.com/mrfrank-ofc/SUBZERO-MD"}
    `.trim();

    await conn.sendMessage(from, {
      text: resultMessage,
      quoted: subzero
    });

  } catch (error) {
    console.error('Ping3 error:', error);
    reply('❌ Failed to measure performance');
  }
});
