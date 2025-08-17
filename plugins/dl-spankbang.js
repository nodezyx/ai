const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

cmd({
  pattern: "spankbang",
  category: "download",
  use: "<spankbang-url>",
  desc: "Download SpankBang videos using API",
}, async (conn, m, { q, prefix, command }) => {
  if (!q || !q.includes("spankbang.com")) {
    return await conn.sendMessage(m.chat, {
      text: `❌ Please provide a valid SpankBang video URL.\n\nExample:\n${prefix + command} https://spankbang.com/abcd1234/video_title`
    }, { quoted: m });
  }

  try {
    const api = `https://kaiz-apis.gleeze.com/api/spankbang-dl?url=${encodeURIComponent(q)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;
    const res = await axios.get(api);
    const data = res.data;

    if (data.error || !data.response?.video) {
      return await conn.sendMessage(m.chat, {
        text: `❌ Error: ${data.error || "No video found."}`
      }, { quoted: m });
    }

    await conn.sendMessage(m.chat, {
      video: { url: data.response.video },
      mimetype: "video/mp4",
      caption: `✅ SpankBang video download successful!\n\n${config.FOOTER}`
    }, { quoted: m });
    
  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, {
      text: "❌ Failed to download video."
    }, { quoted: m });
  }
});
