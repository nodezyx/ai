const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "soundclouddl",
  category: "download",
  desc: "Download SoundCloud music by link",
  use: ".soundclouddl <url>",
  filename: __filename
}, async (conn, m, { q }) => {
  if (!q) return m.reply("❌ Send a valid SoundCloud link.");

  try {
    const api = `https://kaiz-apis.gleeze.com/api/soundcloud-dl?url=${encodeURIComponent(q)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;
    const { data } = await axios.get(api);

    if (!data.downloadUrl) return m.reply("❌ Failed to get download link.");

    await conn.sendMessage(m.chat, {
      image: { url: data.thumbnail },
      caption: `🎵 *Title:* ${data.title}
👤 *User:* ${data.username}
📅 *Uploaded:* ${new Date(data.createdAt).toDateString()}
🔊 *Requested by:* ${m.pushName}
🧊 *Powered by SUBZERO*`
    }, { quoted: m });

    await conn.sendMessage(m.chat, {
      audio: { url: data.downloadUrl },
      mimetype: "audio/mp4",
      fileName: `${data.title}.mp3`
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply("⚠️ Error downloading from SoundCloud.");
  }
});
