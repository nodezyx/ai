const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'playstore',
  desc: 'Search apps on Play Store',
  category: 'search',
  use: '.playstore <app name>',
  react: '📱'
}, async (m, conn, match) => {
  const query = match[1];
  if (!query) return m.reply('📍 Please provide an app name.\n\nExample:\n.playstore WhatsApp');

  try {
    const url = `https://api.giftedtech.web.id/api/search/playstore?apikey=gifted&query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);

    if (!data.success || !data.results || data.results.length === 0) {
      return m.reply('❌ No results found.');
    }

    let msg = `🔍 *Play Store Search Results for:* _${query}_\n\n`;

    for (let app of data.results.slice(0, 5)) {
      msg += `📦 *${app.name}*\n`;
      msg += `👨‍💻 Dev: ${app.developer}\n`;
      msg += `⭐ Rating: ${app.rating_Num}\n`;
      msg += `🔗 [Play Store](${app.link})\n\n`;
    }

    await conn.sendMessage(m.chat, {
      text: msg,
      jpegThumbnail: Buffer.from([]),
    }, { quoted: m });
  } catch (err) {
    console.error(err);
    m.reply('⚠️ Error fetching Play Store data.');
  }
});
