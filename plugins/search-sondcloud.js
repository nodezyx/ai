const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'soundcloudsearch',
  desc: '🔊 Search SoundCloud tracks | Usage: .soundcloud Lily',
  category: 'search'
}, async (conn, m, { q }) => {
  try {
    if (!q) return m.reply('❌ Please provide a search term.\nExample: `.soundcloud Lily`');

    const apiKey = 'cf2ca612-296f-45ba-abbc-473f18f991eb';
    const url = `https://kaiz-apis.gleeze.com/api/soundcloud-search?title=${encodeURIComponent(q)}&apikey=${apiKey}`;

    const res = await axios.get(url);
    const results = res.data.results;

    if (!results || results.length === 0) return m.reply('❌ No SoundCloud results found.');

    // Prepare top 5 results (or less)
    const topResults = results.slice(0, 5);

    let message = `🔊 *SoundCloud Search Results for:* ${q}\n\n`;

    topResults.forEach((item, i) => {
      message += `*${i + 1}.* ${item.title}\n` +
                 `👤 Artist: ${item.artist}\n` +
                 `▶️ Plays: ${item.plays}\n` +
                 `⏰ Duration: ${item.duration}\n` +
                 `📅 Uploaded: ${item.uploaded}\n` +
                 `🔗 [Listen here](${item.url})\n\n`;
    });

    await conn.sendMessage(m.chat, { text: message, mentions: [m.sender] }, { quoted: m });

    // React with headphones emoji
    await conn.sendMessage(m.chat, { react: { text: "🎧", key: m.key } });

  } catch (e) {
    console.error(e);
    m.reply('❌ Error occurred while searching SoundCloud.');
  }
});
