const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

cmd(
    {
        pattern: 'channelstalk',
        alias: ['whatsappchannel', 'wastalk'],
        desc: 'Get WhatsApp channel information',
        category: 'utility',
        react: '🔍',
        use: '<channel-url>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) return reply('🔗 *Please provide a WhatsApp channel URL*\nExample: .channelstalk https://whatsapp.com/channel/0029VaGvk6XId7nHNGfiRs0m');

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            // Extract channel ID from URL
            let channelUrl = q.trim();
            if (!channelUrl.includes('whatsapp.com/channel/')) {
                return reply('❌ *Invalid URL* - Must be a WhatsApp channel link');
            }

            // Call Nexoracle API
            const apiUrl = `https://api.nexoracle.com/stalking/whatsapp-channel?apikey=e276311658d835109c&url=${encodeURIComponent(channelUrl)}`;
            const response = await axios.get(apiUrl);
            
            if (response.data.status !== 200) {
                return reply('❌ *Error fetching channel info* - API returned non-200 status');
            }

            const channelData = response.data.result;

            // Format the response
            const message = `
📢 *Channel Stalker* 📢

🏷️ *Title:* ${channelData.title}
👤 *Owner:* ${response.data.owner}
👥 *Followers:* ${channelData.followers}

📝 *Description:*
${channelData.description}

🔗 *Link:* ${channelData.link}
            `;

            // Send message with channel image
            await conn.sendMessage(mek.chat, { 
                image: { url: channelData.image },
                caption: message,
                contextInfo: {
                    externalAdReply: {
                        title: channelData.title,
                        body: `Powered By Subzero`,
                        thumbnail: await getImageBuffer(channelData.image),
                        mediaType: 1,
                        mediaUrl: channelData.link,
                        sourceUrl: channelData.link
                    }
                }
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Channel stalk error:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('⚠️ *Error stalking channel* - Please check the URL and try again');
        }
    }
);

// Helper function to get image buffer
async function getImageBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch {
        return null;
    }
}
