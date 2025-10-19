const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: 'technews',
  alias: ['tech'],
  react: '📱',
  desc: 'Get latest technology news',
  category: 'news',
  filename: __filename
}, async (conn, mek, msg, { from, reply }) => {
  try {
    // Send processing message
    await reply('📡 Fetching tech news...');

    // Fetch tech news data
    const { data } = await axios.get('https://bk9.fun/details/technewsworld');

    if (!data.status || !data.BK9) {
      return reply('❌ Failed to fetch tech news');
    }

    const articles = data.BK9.slice(0, 5); // Get first 5 articles

    for (const article of articles) {
      try {
        const { imageUrl, articleUrl, title, description, date, source } = article;

        // Create caption
        const caption = `*📱 Tech News*\n\n` +
                       `*${title}*\n\n` +
                       `${description}\n\n` +
                       `📅 ${date}\n` +
                       `📰 ${source}\n` +
                       `🔗 ${articleUrl}`;

        // Try to send with image
        try {
          const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          await conn.sendMessage(from, {
            image: Buffer.from(imageRes.data),
            caption: caption
          }, { quoted: mek });
        } catch {
          // If image fails, send text only
          await reply(caption);
        }

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.log('Error sending article:', err);
        continue;
      }
    }

    await reply('✅ Tech news delivered!');

  } catch (error) {
    console.error('TechNews error:', error);
    reply('❌ Error fetching tech news');
  }
});
