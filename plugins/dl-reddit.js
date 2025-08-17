const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "reddit",
  alias: ["reddownload", "reel", "reddl", "reeldl"],
  use: "Download video/audio from Reddit or Facebook Reel using Kaiz API",
  category: "download",
  desc: ".reddl <post/reel URL>",
  filename: __filename
},
async (client, message, { args, reply }) => {
  try {
    if (!args[0]) return reply("❗ Please provide a Reddit or Reel URL.");

    const url = encodeURIComponent(args[0]);
    const api = `https://kaiz-apis.gleeze.com/api/reddit-dl?url=${url}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;
    
    const { data } = await axios.get(api);

    if (!data || (!data.mp4 && !data.mp3)) {
      return reply("❌ Failed to fetch media. Make sure the link is correct.");
    }

    // Send video preview
    let caption = `🎬 *${data.title || 'Untitled'}*\n👤 *By:* ${data.author || 'Unknown'}\n\nChoose a format:`;
    await client.sendMessage(message.from, { image: { url: data.thumbnail }, caption }, { quoted: message });

    // Send HD if available, else SD, else MP3
    if (data.mp4 && data.mp4.length > 0) {
      let best = data.mp4.find(v => v.quality === "HD") || data.mp4[0];
      await client.sendMessage(message.from, {
        video: { url: best.url },
        caption: `🎥 Quality: ${best.quality}`
      }, { quoted: message });
    } else if (data.mp3) {
      await client.sendMessage(message.from, {
        audio: { url: data.mp3 },
        mimetype: 'audio/mpeg'
      }, { quoted: message });
    }

  } catch (err) {
    console.error("❌ Error in reddl plugin:", err);
    reply("⚠️ Failed to download. Please try a valid Reddit or Facebook Reel URL.");
  }
});
