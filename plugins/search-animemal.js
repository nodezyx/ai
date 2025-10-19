const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

cmd(
    {
        pattern: 'mal',
        alias: ['animeinfo', 'anidetails'],
        desc: 'Get anime information from MyAnimeList',
        category: 'weeb',
        react: '🌸',
        use: '<anime title>',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply(`🌸 *Usage:* ${Config.PREFIX}mal <anime title>\nExample: ${Config.PREFIX}mal Summertime Render`);

            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            // Fetch MAL data
            const apiUrl = `https://lance-frank-asta.onrender.com/api/mal?title=${encodeURIComponent(text)}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.title) {
                return reply('🌸 *Anime not found!* Try a different title');
            }

            // Format the information
            const malInfo = `🎌 *${data.title}* (${data.japanese || 'N/A'})\n\n` +
                           `📺 *Type:* ${data.type || 'N/A'}\n` +
                           `📊 *Status:* ${data.status || 'N/A'}\n` +
                           `🗓 *Aired:* ${data.aired || 'N/A'}\n` +
                           `🎞 *Episodes:* ${data.episodes || 'N/A'} (${data.duration || 'N/A'})\n\n` +
                           `⭐ *Score:* ${data.score || 'N/A'} (${data.scoreStats || 'N/A'})\n` +
                           `🏆 *Ranked:* ${data.ranked || 'N/A'}\n` +
                           `👥 *Members:* ${data.members || 'N/A'}\n\n` +
                           `🎭 *Genres:* ${data.genres || 'N/A'}\n` +
                           `🏢 *Studios:* ${data.studios || 'N/A'}\n\n` +
                           `📜 *Description:* ${data.description?.substring(0, 200) || 'No description'}${data.description?.length > 200 ? '...' : ''}\n\n` +
                           `🔗 *MAL URL:* ${data.url || 'Not available'}\n\n` +
                           `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ғʀᴀɴᴋ`;

            // Send the anime info with poster
            await conn.sendMessage(mek.chat, {
                image: { url: data.picture || 'https://i.imgur.com/3QNxQ4a.png' },
                caption: malInfo,
                contextInfo: {
                    externalAdReply: {
                        title: data.title,
                        body: `⭐ ${data.score} | ${data.type}`,
                        thumbnailUrl: data.picture || 'https://i.imgur.com/3QNxQ4a.png',
                        mediaType: 1,
                        mediaUrl: data.url,
                        sourceUrl: data.url
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('MAL Error:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('🌸 *Error:* ' + (error.message || 'Failed to fetch MAL data'));
        }
    }
);
