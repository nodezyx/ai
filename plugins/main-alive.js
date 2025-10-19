const { cmd } = require("../command");
const moment = require("moment-timezone");
const config = require("../config"); // Import config file
const os = require("os");
const { runtime } = require('../lib/functions');
let botStartTime = Date.now();

const ALIVE_IMG = config.BOT_IMAGE || "https://i.postimg.cc/3RgPr15t/IMG-20250305-WA0008.jpg" ;

cmd({
  pattern: "alive",
  alias: ["uptime","runtime"],
  desc: "Check if the bot is active.",
  category: "info",
  react: "🚀",
  filename: __filename
}, async (conn, mek, m, { reply, from }) => {
  try {
    const pushname = m.pushName || "User";
    const harareTime = moment().tz("Africa/Harare").format("HH:mm:ss");
    const harareDate = moment().tz("Africa/Harare").format("dddd, MMMM Do YYYY");
    const runtimeMilliseconds = Date.now() - botStartTime;
    const runtimeSeconds = Math.floor((runtimeMilliseconds / 1000) % 60);
    const runtimeMinutes = Math.floor((runtimeMilliseconds / (1000 * 60)) % 60);
    const runtimeHours = Math.floor(runtimeMilliseconds / (1000 * 60 * 60));
    const formattedInfo = `
 🏮 \`SUBZERO MD STATUS\` 🏮 

  *Hi👋😄 ${pushname}*

 *⏰ Time: ${harareTime}*
 *📆 Date: ${harareDate}*
 *🔋 Uptime: ${runtimeHours} hours, ${runtimeMinutes} minutes, ${runtimeSeconds} seconds*
 *🔮 Ram Usage : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB*


 \`Status\`: *Subzero is online! 🤗🚀*

> 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐌𝐑 𝐅𝐑𝐀𝐍𝐊. 
🔗 ${config.REPO}
`.trim();

    if (!ALIVE_IMG || !ALIVE_IMG.startsWith("http")) {
      throw new Error("Invalid ALIVE_IMG URL. Please set a valid image URL.");
    }

    await conn.sendMessage(from, {
      image: { url: ALIVE_IMG },
      caption: formattedInfo,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363304325601080@newsletter',
          newsletterName: '⁑ ѕυϐzєяο м∂ ⁑ ',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, {
      audio: { url: 'https://files.catbox.moe/qda847.m4a' },
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: mek });
    
  } catch (error) {
    console.error("Error in alive command: ", error);
    const errorMessage = `
 An error occurred while processing the alive command.
 Error Details: ${error.message}
Please report this issue or try again later.
`.trim();
    return reply(errorMessage);
  }
});
