const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "pinterestdl",
  alias: ["pinndl", "pindl"],
  desc: "Download video and thumbnail from Pinterest URL",
  category: "download",
  use: "<pinterest-url>",
  filename: __filename
}, async (conn, m, { q, prefix, command }) => {
  if (!q || !q.includes("pin.it") && !q.includes("pinterest.com")) {
    return await conn.sendMessage(m.chat, {
      text: `❌ Please provide a valid Pinterest URL.\n\nExample:\n${prefix + command} https://pin.it/1cR6JJNpv`
    }, { quoted: m });
  }

  try {
    const apiUrl = `https://api.giftedtech.web.id/api/download/pinterestdl?apikey=gifted&url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.success || !data.result || !data.result.media) {
      return await conn.sendMessage(m.chat, {
        text: "❌ Unable to retrieve media from the provided Pinterest URL."
      }, { quoted: m });
    }

    const { title, media } = data.result;

    // Find video and thumbnail URLs
    const videoMedia = media.find(item => item.format.toLowerCase() === "mp4");
    const thumbnailMedia = media.find(item => item.format.toLowerCase() === "jpg");

    // Send video if available
    if (videoMedia) {
      await conn.sendMessage(m.chat, {
        video: { url: videoMedia.download_url },
        caption: `📥 *${title}* - Video (${videoMedia.type})`,
      }, { quoted: m });
    }

    // Send thumbnail if available
    if (thumbnailMedia) {
      await conn.sendMessage(m.chat, {
        image: { url: thumbnailMedia.download_url },
        caption: `🖼️ *${title}* - Thumbnail`,
      }, { quoted: m });
    }

    if (!videoMedia && !thumbnailMedia) {
      await conn.sendMessage(m.chat, {
        text: "❌ No downloadable video or thumbnail found.",
      }, { quoted: m });
    }

  } catch (error) {
    console.error("PinterestDL Error:", error);
    await conn.sendMessage(m.chat, {
      text: "❌ Failed to download from Pinterest. Please try again later."
    }, { quoted: m });
  }
});
