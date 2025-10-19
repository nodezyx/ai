const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const config = require("../config");

cmd({
  pattern: "yt",
  alias: ["ytdl", "ytvideo", "ytd"],
  desc: ".yt <YouTube URL or search>",
  category: "download",
  use: ".yt <url or video name>",
  react: "📽️",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const input = args.join(" ");
    if (!input) return reply("❌ Provide a YouTube link or search query.\n\nExample: `.yt Alan Walker Lily`");

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    let ytUrl = input;

    // If input is not a YouTube link, search YouTube
    if (!input.includes("youtube.com") && !input.includes("youtu.be")) {
      const search = await yts(input);
      if (!search.videos.length) return reply("❌ No results found.");
      ytUrl = search.videos[0].url;
    }

    const apiUrl = `https://kaiz-apis.gleeze.com/api/ytdown-mp3?url=${encodeURIComponent(ytUrl)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;
    const res = await axios.get(apiUrl);

    if (!res.data || !res.data.download_url) {
      return reply("❌ Unable to fetch video. Try another link or query.");
    }

    const { title, author, download_url } = res.data;

    reply(`📥 Downloading *${title}* by *${author}*...`);

    const videoRes = await axios.get(download_url, { responseType: "arraybuffer" });
    const videoBuffer = Buffer.from(videoRes.data, "binary");

    await conn.sendMessage(from, {
      video: videoBuffer,
      caption: `🎬 *Title*: ${title}\n👤 *Author*: ${author}\n\n${config.FOOTER || ""}`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363304325601080@newsletter',
          newsletterName: '『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』',
          serverMessageId: 146
        }
      }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error("YT Video Download Error:", err.message);
    reply("❌ Error fetching or sending the video.");
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
