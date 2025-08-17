const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "snapchat",
  desc: "Download Snapchat video",
  category: "download",
  filename: __filename,
}, async (conn, m, text) => {
  if (!text) return m.reply("🎯 *Send a valid Snapchat link.*");

  try {
    const res = await axios.get(`https://kaiz-apis.gleeze.com/api/snapchat-dl?url=${encodeURIComponent(text)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`);
    const data = res.data;

    if (!data || !data.url) return m.reply("⚠️ Failed to fetch Snapchat video.");

    await conn.sendMessage(m.chat, {
      video: { url: data.url },
      caption: `🎥 *${data.title}*\n👤 By: ${data.author}\n\n${config.FOOTER}`,
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    m.reply("❌ Error downloading Snapchat video.");
  }
});
