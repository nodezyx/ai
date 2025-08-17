const config = require('../config');
const { cmd } = require('../command');

function statusOf(option) {
  return option && option.toString().toLowerCase() === "true" ? "✅ on" : "❌ off";
}

cmd({
  pattern: "settings",
  alias: ["variables", "botsettings"],
  desc: "Shows current SUBZERO-MD configuration",
  category: "menu",
  react: "⚙️",
  filename: __filename
},
async (conn, mek, m, { from, reply }) => {
  try {
    const cmdList = `
\`\`\`----------------------------------------
        SUBZERO BOT SETTINGS
----------------------------------------\`\`\`

🔧 1. \`Mode\`
Current Status: ${config.MODE || "public"}
Usage: ${config.PREFIX}mode private/public

🎯 2. \`Auto Typing\`
Current Status: ${statusOf(config.AUTOTYPING)}
Usage: ${config.PREFIX}autotyping on/off

🌐 3. \`Always Online\`
Current Status: ${statusOf(config.ALWAYSONLINE)}
Usage: ${config.PREFIX}alwaysonline on/off

🎙️ 4. \`Auto Recording\`
Current Status: ${statusOf(config.AUTORECORDING)}
Usage: ${config.PREFIX}autorecording on/off

📖 5. \`Auto React Status\`
Current Status: ${statusOf(config.AUTOSTATUSREACT)}
Usage: ${config.PREFIX}autostatusreact on/off

👀 6. \`Auto View Status\`
Current Status: ${statusOf(config.AUTOSTATUSSEEN)}
Usage: ${config.PREFIX}autoviewstatus on/off

🚫 7. \`Anti Bad Word\`
Current Status: ${statusOf(config.ANTIBADWORD)}
Usage: ${config.PREFIX}antibad on/off

🗑️ 8. \`Anti Delete\`
Current Status: Groups: ${statusOf(config.ANTIDELETE)}, DMs: ${statusOf(config.ANTIDELETE)}
Usage: ${config.PREFIX}antidelete on/off [gc/dm/status]

🖼️ 9. \`Auto Sticker\`
Current Status: ${statusOf(config.AUTOSTICKER)}
Usage: ${config.PREFIX}autosticker on/off

💬 10. \`Auto Reply\`
Current Status: ${statusOf(config.AUTOREPLY)}
Usage: ${config.PREFIX}autoreply on/off

❤️ 11. \`Auto React\`
Current Status: ${statusOf(config.AUTOREACT)}
Usage: ${config.PREFIX}autoreact on/off

📢 12. \`Status Reply\`
Current Status: ${statusOf(config.AUTOSTATUSREPLY)}
Usage: ${config.PREFIX}autostatusreply on/off

🔗 13. \`Anti Link\`
Current Status: ${statusOf(config.ANTILINK)}
Usage: ${config.PREFIX}antilink on/off

🤖 14. \`Anti Bot\`
Current Status: ${config.ANTIBOT || "off"}
Usage: ${config.PREFIX}antibot off/warn/delete/kick

📞 15. \`Anti Call\`
Current Status: ${statusOf(config.ANTICALL)}
Usage: ${config.PREFIX}anticall on/off

💖 16. \`Heart React\`
Current Status: ${statusOf(config.HEARTREACT)}
Usage: ${config.PREFIX}heartreact on/off

🔧 17. \`Set Prefix\`
Current Prefix: ${config.PREFIX || "."}
Usage: ${config.PREFIX}setprefix <new_prefix>

🤖 18. \`Set Bot Name\`
Current Bot Name: ${config.BOTNAME || "SUBZERO MD"}
Usage: ${config.PREFIX}setbotname <new_name>

🤴 19. \`Set Owner Name\`
Current Owner Name: ${config.OWNERNAME || "Mr Frank"}
Usage: ${config.PREFIX}setownername <owner_name>

🖼️ 20. \`Set Bot Image\`
Current Bot Image: ${config.BOTIMAGE || "DEFAULT IMAGE"}
Usage: ${config.PREFIX}setbotimage <image_url> / reply to photo

🔄 21. \`Auto Bio\`
Current Status: ${statusOf(config.AUTOBIO)}
Usage: ${config.PREFIX}autobio on/off [custom text]

🫂 22. \`Welcome & Goodbye\`
Current Status: ${statusOf(config.WELCOME_GOODBYE)}
Usage: ${config.PREFIX}welcome on/off

🧠 23. \`AI Chatbot\`
Current Status: ${statusOf(config.AICHATBOT)}
Usage: ${config.PREFIX}chatbot on/off

📌 *Note*: Replace "on/off" with the desired state to toggle the feature.
`;

    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/703kuc.jpg' },
      caption: cmdList,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363304325601080@newsletter',
          newsletterName: "❄️『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』❄️",
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    // Optional audio
    await conn.sendMessage(from, {
      audio: { url: 'https://files.catbox.moe/qda847.m4a' },
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply(`⚠️ An error occurred: ${e.message}`);
  }
});
