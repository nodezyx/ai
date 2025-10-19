
const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios
const axiosInstance = axios.create({
  timeout: 10000, // reduced timeout
  maxRedirects: 5
});

cmd(
    {
        pattern: 'song3',
        alias: ['play3', 'music3'],
        desc: 'YouTube audio downloader',
        category: 'media',
        react: '⌛',
        use: '<YouTube URL or search query> [quality]',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply('🎵 *Usage:* .song <query/url> [quality]\nExample: .song https://youtu.be/ox4tmEV6-QU\n.song Alan Walker Lily 128');

            let [input, quality = '92'] = text.split(' ');
            quality = ['92', '128', '256', '320'].includes(quality) ? quality : '92';

            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            const videoUrl = await getVideoUrl(input);
            if (!videoUrl) return reply('🎵 No results found for your search');

            const apiUrl = `https://mrfrank-api.vercel.app/api/ytmp3dl?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
            const apiResponse = await axiosInstance.get(apiUrl);
            if (!apiResponse.data?.status || !apiResponse.data.download?.url) {
                return reply('🎵 Failed to fetch audio - API error');
            }

            const songData = apiResponse.data;

            // Fast parallel fetch for thumbnail and audio
            const [thumbnailBuffer, audioResponse] = await Promise.all([
                fetchThumbnail(songData.metadata.thumbnail),
                axiosInstance.get(songData.download.url, {
                    responseType: 'arraybuffer',
                    headers: { Referer: 'https://www.youtube.com/' }
                })
            ]);

            const audioBuffer = Buffer.from(audioResponse.data, 'binary');

            const songInfo = `🎧 *${songData.metadata.title}*\n` +
                            `⏱ ${songData.metadata.timestamp} | ${songData.download.quality}\n` +
                            `👤 ${songData.metadata.author?.name || 'Unknown'}\n` +
                            `👀 ${songData.metadata.views || 'N/A'} views\n` +
                            `📅 ${songData.metadata.ago || 'Unknown upload date'}\n\n` +
                            `🔗 ${songData.url}\n\n`+
                            `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`;

            await conn.sendMessage(mek.chat, {
                image: thumbnailBuffer,
                caption: songInfo,
                contextInfo: {
                    externalAdReply: {
                        title: songData.metadata.title,
                        body: `Quality: ${songData.download.quality} | ${songData.metadata.views || 'N/A'} views`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: songData.url,
                        sourceUrl: songData.url
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(mek.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: songData.download.filename,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: songData.metadata.title,
                        body: `🏮 Downloaded By ${Config.BOT_NAME} 🏮`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: songData.url,
                        sourceUrl: songData.url
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(mek.chat, {
                document: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${songData.metadata.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: `${songData.metadata.title} (YTMP3)`,
                        body: `🏮 Downloaded By ${Config.BOT_NAME}🏮`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: songData.url,
                        sourceUrl: songData.url
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Error:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('🎵 Error: ' + (error.message || 'Please try again later'));
        }
    }
);

// Get video URL from query or direct link
async function getVideoUrl(input) {
    if (input.match(/youtu\.?be/)) return input;
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(input)}`;
        const response = await axiosInstance.get(searchUrl);
        const videoId = response.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/)?.[1];
        return videoId ? `https://youtube.com/watch?v=${videoId}` : null;
    } catch (e) {
        console.error('Search error:', e);
        return null;
    }
}

// Fetch thumbnail or return null
async function fetchThumbnail(url) {
    try {
        const res = await axiosInstance.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(res.data, 'binary');
    } catch {
        return null;
    }
}

/*
const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Configure axios with better settings
const axiosInstance = axios.create({
  timeout: 15000, // 15 second timeout
  maxRedirects: 5
});

cmd(
    {
        pattern: 'son',
        alias: ['play', 'music'],
        desc: 'YouTube audio downloader',
        category: 'media',
        react: '⌛',
        use: '<YouTube URL or search query> [quality]',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply('🎵 *Usage:* .song <query/url> [quality]\nExample: .song https://youtu.be/ox4tmEV6-QU\n.song Alan Walker Lily 128');

            // Parse input
            let [input, quality = '92'] = text.split(' ');
            quality = ['92', '128', '256', '320'].includes(quality) ? quality : '92';

            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            // Get video URL
            const videoUrl = await getVideoUrl(input);
            if (!videoUrl) return reply('🎵 No results found for your search');

            // Fetch song data
            const apiUrl = `https://mrfrank-api.vercel.app/api/ytmp3dl?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
            const apiResponse = await axiosInstance.get(apiUrl);
            
            if (!apiResponse.data?.status || !apiResponse.data.download?.url) {
                return reply('🎵 Failed to fetch audio - API error');
            }

            const songData = apiResponse.data;

            // Get thumbnail
            let thumbnailBuffer;
            try {
                const thumbnailResponse = await axiosInstance.get(songData.metadata.thumbnail, {
                    responseType: 'arraybuffer'
                });
                thumbnailBuffer = Buffer.from(thumbnailResponse.data, 'binary');
            } catch {
                thumbnailBuffer = null;
            }

            // Format song information
            const songInfo = `🎧 *${songData.metadata.title}*\n` +
                            `⏱ ${songData.metadata.timestamp} | ${songData.download.quality}\n` +
                            `👤 ${songData.metadata.author?.name || 'Unknown'}\n` +
                            `👀 ${songData.metadata.views || 'N/A'} views\n` +
                            `📅 ${songData.metadata.ago || 'Unknown upload date'}\n\n` +
                            `🔗 ${songData.url}\n\n`+
                            `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`;

            // Send song info
            await conn.sendMessage(mek.chat, {
                image: thumbnailBuffer,
                caption: songInfo,
                contextInfo: {
                    externalAdReply: {
                        title: songData.metadata.title,
                        body: `Quality: ${songData.download.quality} | ${songData.metadata.views || 'N/A'} views`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: songData.url,
                        sourceUrl: songData.url
                    }
                }
            }, { quoted: mek });

            // Download audio
            const audioResponse = await axiosInstance.get(songData.download.url, {
                responseType: 'arraybuffer',
                headers: { 'Referer': 'https://www.youtube.com/' }
            });
            const audioBuffer = Buffer.from(audioResponse.data, 'binary');

            // Send audio as voice/audio type
            await conn.sendMessage(mek.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: songData.download.filename,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: songData.metadata.title,
                        body: `🎵 ${Config.BOT_NAME}`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: songData.url,
                        sourceUrl: songData.url
                    }
                }
            }, { quoted: mek });

            // Send audio as document
            await conn.sendMessage(mek.chat, {
                document: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${songData.metadata.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: `${songData.metadata.title} (YTMP3)`,
                        body: `🎵 Sent as document by ${Config.BOT_NAME}`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: songData.url,
                        sourceUrl: songData.url
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('Error:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('🎵 Error: ' + (error.message || 'Please try again later'));
        }
    }
);

// Helper to get video URL
async function getVideoUrl(input) {
    if (input.match(/youtu\.?be/)) return input;
    
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(input)}`;
        const response = await axiosInstance.get(searchUrl);
        const videoId = response.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/)?.[1];
        return videoId ? `https://youtube.com/watch?v=${videoId}` : null;
    } catch (e) {
        console.error('Search error:', e);
        return null;
    }
}
*/
