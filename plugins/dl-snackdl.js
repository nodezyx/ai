const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

cmd({
  pattern: "snackdl",
  alias: ["snackvideo", "snackvid"],
  desc: "Download Snack Video and send it",
  category: "download",
  use: "<snackvideo-url>",
  filename: __filename
}, async (conn, m, { q, prefix, command }) => {
  if (!q || !q.includes("snackvideo.com")) {
    return await conn.sendMessage(m.chat, {
      text: `❌ Please provide a valid Snack Video URL.\n\nExample:\n${prefix + command} https://www.snackvideo.com/@dançandoaté2030/video/5196178178032793794`
    }, { quoted: m });
  }

  try {
    const apiUrl = `https://api.giftedtech.web.id/api/download/snackdl?apikey=gifted&url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.success || !data.result || !data.result.media) {
      return await conn.sendMessage(m.chat, {
        text: `❌ Could not fetch video for the provided URL.`
      }, { quoted: m });
    }

    // Send video with caption
    await conn.sendMessage(m.chat, {
      video: { url: data.result.media },
      caption:
        `🎥 *Snack Video Download*\n` +
        `📝 Title: ${data.result.title || "N/A"}\n` +
        `👤 Author: ${data.result.author || "N/A"}\n` +
        `❤️ Likes: ${data.result.like || "N/A"}\n` +
        `💬 Comments: ${data.result.comment || "N/A"}\n` +
        `🔗 Shares: ${data.result.share || "N/A"}\n\n` +
        (config.FOOTER || "")
    }, { quoted: m });

  } catch (error) {
    console.error("SnackDL Error:", error);
    await conn.sendMessage(m.chat, {
      text: "❌ Failed to download Snack Video. Please try again later."
    }, { quoted: m });
  }
});
