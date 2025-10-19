const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

cmd({
  pattern: "twitter2",
  alias: ["twitterdl2", "twtdl", "tweetdl"],
  desc: "Download Twitter videos and send them",
  category: "download",
  use: "<tweet-url>",
  filename: __filename
}, async (conn, m, { q, prefix, command }) => {
  if (!q || !q.includes("twitter.com") && !q.includes("x.com")) {
    return await conn.sendMessage(m.chat, {
      text: `❌ Please provide a valid Twitter/X tweet URL.\n\nExample:\n${prefix + command} https://twitter.com/elonmusk/status/1234567890`
    }, { quoted: m });
  }

  try {
    const apiUrl = `https://api.giftedtech.web.id/api/download/twitter?apikey=gifted&url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.success || !data.result || !data.result.videoUrls?.length) {
      return await conn.sendMessage(m.chat, {
        text: `❌ Could not fetch video for the provided URL.`
      }, { quoted: m });
    }

    // Select highest quality video (assumed first in the array)
    const bestVideo = data.result.videoUrls[0];
    if (!bestVideo.url) {
      return await conn.sendMessage(m.chat, {
        text: `❌ No downloadable video URL found.`
      }, { quoted: m });
    }

    // Send video
    await conn.sendMessage(m.chat, {
      video: { url: bestVideo.url },
      caption: `🎥 *Twitter Video*\n\n📝 Title: ${data.result.title || "N/A"}\n👤 Author: ${data.result.author || "N/A"}\n\n${config.FOOTER || ""}`,
      mimetype: "video/mp4"
    }, { quoted: m });

  } catch (error) {
    console.error("TwitterDL Error:", error);
    await conn.sendMessage(m.chat, {
      text: "❌ Failed to download Twitter video. Please try again later."
    }, { quoted: m });
  }
});

cmd({
  pattern: "twitter",
  desc: "Download Twitter video",
  category: "download"
}, async (conn, m, q) => {
  if (!q) return m.reply("❌ Provide a Twitter video link.");

  try {
    const res = await axios.get(`https://kaiz-apis.gleeze.com/api/twitter?url=${encodeURIComponent(q)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`);
    const links = res.data.downloadLinks;
    const video = links?.find(l => l?.link);

    if (!video || !video.link) {
      return m.reply("❌ No video link found.");
    }

    await conn.sendMessage(m.chat, {
      video: { url: video.link },
      caption: `Downloaded by SubZero\n${config.FOOTER}`
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply("⚠️ Failed to fetch video.");
  }
});
