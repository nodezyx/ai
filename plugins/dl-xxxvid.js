const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'xvideo',
  alias: ['xxx', 'xvideo2'],
  desc: '🔞 Download 18+ videos from Xvideos using GiftedTech API',
  category: 'download',
  use: '.xvideo <xvideos url>',
  react: '🔞',
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  try {
    const url = args[0];
    if (!url || !url.includes('xvideos.com')) {
      return reply('❌ Please provide a valid Xvideos video URL.\n\nExample: `.xvd https://www.xvideos.com/video...`');
    }

    // React: loading
    await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

    // API call
    const api = `https://api.giftedtech.web.id/api/download/xvideosdl?apikey=gifted&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);

    if (!data || !data.success || !data.result?.download_url) {
      await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
      return reply('❌ No video found or API failed.');
    }

    const { title, thumbnail, download_url, views, likes, dislikes, size } = data.result;

    // Download video buffer
    const vidRes = await axios.get(download_url, { responseType: 'arraybuffer' });
    const vidBuffer = Buffer.from(vidRes.data);

    // Try loading thumbnail
    let thumbBuf = null;
    try {
      const t = await axios.get(thumbnail, { responseType: 'arraybuffer' });
      thumbBuf = Buffer.from(t.data);
    } catch {}

    // Custom caption
    const caption = `🔞 *${title}*\n\n👀 *Views*: ${views}\n👍 *Likes*: ${likes}\n👎 *Dislikes*: ${dislikes}\n💾 *Size*: ${size}\n🔗 *Source*: ${url}`;

    // Send thumbnail with SUBZERO MD branding
    await conn.sendMessage(mek.chat, {
      image: thumbBuf,
      caption,
      contextInfo: {
        externalAdReply: {
          title,
          body: 'SUBZERO MD 🔞 Video Service',
          thumbnail: thumbBuf,
          mediaType: 1,
          sourceUrl: url,
          mediaUrl: url
        }
      }
    }, { quoted: mek });

    // Send the actual video
    await conn.sendMessage(mek.chat, {
      video: vidBuffer,
      mimetype: 'video/mp4',
      fileName: `${title.replace(/[\\/:"*?<>|]/g, '').slice(0, 50)}.mp4`,
      caption: `📹 *${title}*\nProvided by SUBZERO MD`
    });

    await conn.sendMessage(mek.chat, { react: { text: '✅', key: mek.key } });

  } catch (err) {
    console.error('SUBZERO XVD Error:', err.message);
    await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
    await reply('❌ Error fetching video. Please try again later.');
  }
});
