const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: 'bbcnews',
  alias: ['bbc','news'],
  react: '📰',
  desc: 'Get latest BBC News headlines with images',
  category: 'news',
  filename: __filename
}, async (conn, mek, msg, { from, reply }) => {
  try {
    const { data } = await axios.get('https://api.nexoracle.com/news/bbc?apikey=e276311658d835109c');
    
    if (!data.result || data.status !== 200) {
      return reply('❌ Failed to fetch BBC News');
    }

    const articles = data.result;
    
    // Send processing notification
    await reply('📡 Fetching latest BBC News headlines...');

    for (const [index, article] of articles.entries()) {
      try {
        const { title, description, url, urlToImage, publishedAt } = article;
        
        // Download news image
        const imageRes = await axios.get(urlToImage, { 
          responseType: 'arraybuffer',
          timeout: 10000 // 10-second timeout
        });
        
        const imageBuffer = Buffer.from(imageRes.data);
        
        // Format publication date
        const newsDate = new Date(publishedAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        const caption = `*📰 BBC News Update* (${index + 1}/${articles.length})\n\n` +
                       `*${title}*\n\n` +
                       `${description}\n\n` +
                       `🗓️ Published: ${newsDate}\n` +
                       `🔗 Read more: ${url}\n\n` +
                       `_Powered by Subzero_`;

        await conn.sendMessage(from, {
          image: imageBuffer,
          caption: caption
        }, { quoted: mek });

        // Add delay between messages to prevent flooding
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (articleError) {
        console.error(`Error processing article ${index + 1}:`, articleError);
        // Continue to next article if one fails
        continue;
      }
    }

    await reply('✅ All BBC News updates delivered!');

  } catch (error) {
    console.error('BBC News Error:', error);
    reply('❌ Failed to fetch BBC News. Please try again later.');
  }
});
