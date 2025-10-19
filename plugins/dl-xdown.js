const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'xnxx',
  alias: ['xnxxdl', 'xnx', 'xn'],
  use: '🔞 Download 18+ videos from XNXX using GiftedTech API',
  category: 'download',
  desc: '.xnxx <xnxx url>',
  react: '🔞',
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  try {
    const url = args[0];
    if (!url || !url.includes('xnxx')) {
      return reply('❌ Please provide a valid XNXX video URL.\n\nExample: `.xnxx https://www.xnxx.health/video...`');
    }

    // React: loading
    await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

    const api = `https://api.giftedtech.web.id/api/download/xnxxdl?apikey=gifted&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);

    if (!data || !data.success || !data.result?.files?.high) {
      await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
      return reply('❌ Failed to fetch video. Please check the URL.');
    }

    const {
      title,
      image,
      URL,
      info,
      files: { high: videoUrl }
    } = data.result;

    // Download video buffer
    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuf = Buffer.from(videoRes.data);

    // Try downloading thumbnail
    let thumbBuf = null;
    try {
      const t = await axios.get(image, { responseType: 'arraybuffer' });
      thumbBuf = Buffer.from(t.data);
    } catch {}

    // Caption
    const caption = `🔞 *${title}*\n\n🕒 *Duration Info*: ${info}\n🔗 *Source*: ${URL}`;

    // Send preview image
    await conn.sendMessage(mek.chat, {
      image: thumbBuf,
      caption,
      contextInfo: {
        externalAdReply: {
          title,
          body: 'SUBZERO MD 🔞 Video Service',
          thumbnail: thumbBuf,
          mediaType: 1,
          sourceUrl: URL,
          mediaUrl: URL
        }
      }
    }, { quoted: mek });

    // Send video file
    await conn.sendMessage(mek.chat, {
      video: videoBuf,
      mimetype: 'video/mp4',
      fileName: `${title.replace(/[\\/:"*?<>|]/g, '').slice(0, 50)}.mp4`,
      caption: `🎥 *${title}*\nProvided by SUBZERO MD`
    });

    await conn.sendMessage(mek.chat, { react: { text: '✅', key: mek.key } });

  } catch (err) {
    console.error('XNXXDL Error:', err.message);
    await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
    await reply('❌ An error occurred while processing your request.');
  }
});
