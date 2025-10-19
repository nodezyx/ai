const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: "twitch",
  desc: "Download Twitch video",
  category: "download"
}, async (conn, m, q) => {
  if (!q) return m.reply("❌ Provide a Twitch video link.");

  try {
    const res = await axios.get(`https://kaiz-apis.gleeze.com/api/twitch-dl?url=${encodeURIComponent(q)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`);
    const videoOptions = res.data?.response?.qualityOptions;

    if (!videoOptions || videoOptions.length === 0) {
      return m.reply("⚠️ No downloadable Twitch video found.");
    }

    const best = videoOptions[0]; // or sort to pick highest quality

    await conn.sendMessage(m.chat, {
      video: { url: best?.url },
      caption: `🎮 Twitch Video\n${config.FOOTER}`
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    m.reply("❌ Error fetching Twitch video.");
  }
});
