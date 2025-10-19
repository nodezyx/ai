/*const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const Config = require('../config');

// Optimized axios instance with faster timeouts
const axiosInstance = axios.create({
  timeout: 8000, // Reduced from 15000
  maxRedirects: 3, // Reduced from 5
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

// Kaiz-API configuration
const KAIZ_API_KEY = 'cf2ca612-296f-45ba-abbc-473f18f991eb';
const KAIZ_API_URL = 'https://kaiz-apis.gleeze.com/api/ytdown-mp3';

cmd(
    {
        pattern: 'song',
        alias: ['play', 'music'],
        desc: 'High quality YouTube audio downloader',
        category: 'media',
        react: '🎵',
        use: '<YouTube URL or search query>',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply('🎵 *Usage:* .song <query/url>\nExample: .song https://youtu.be/ox4tmEV6-QU\n.song Alan Walker Lily');

            // Send initial reaction
            try {
                if (mek?.key?.id) {
                    await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });
                }
            } catch (reactError) {
                console.error('Reaction error:', reactError);
            }

            // Get video information - parallelize where possible
            let videoUrl, videoInfo;
            const isYtUrl = text.match(/(youtube\.com|youtu\.be)/i);
            
            if (isYtUrl) {
                const videoId = text.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
                if (!videoId) return reply('❌ Invalid YouTube URL format');
                
                videoUrl = `https://youtu.be/${videoId}`;
                try {
                    videoInfo = await yts({ videoId });
                    if (!videoInfo) throw new Error('Could not fetch video info');
                } catch (e) {
                    console.error('YT-Search error:', e);
                    return reply('❌ Failed to get video information from URL');
                }
            } else {
                try {
                    const searchResults = await yts(text);
                    if (!searchResults?.videos?.length) {
                        return reply('❌ No results found. Try different keywords.');
                    }

                    // Get first valid video without filtering (for speed)
                    videoInfo = searchResults.videos[0];
                    videoUrl = videoInfo.url;
                } catch (searchError) {
                    console.error('Search error:', searchError);
                    return reply('❌ Search failed. Please try again later.');
                }
            }

            // Start audio download immediately without waiting for thumbnail
            const apiUrl = `${KAIZ_API_URL}?url=${encodeURIComponent(videoUrl)}&apikey=${KAIZ_API_KEY}`;
            let songData;
            
            try {
                const [apiResponse, thumbnailResponse] = await Promise.all([
                    axiosInstance.get(apiUrl),
                    videoInfo?.thumbnail ? axiosInstance.get(videoInfo.thumbnail, { 
                        responseType: 'arraybuffer',
                        timeout: 5000 
                    }).catch(() => null) : Promise.resolve(null)
                ]);

                if (!apiResponse.data?.download_url) throw new Error('Invalid API response');
                songData = apiResponse.data;

                const thumbnailBuffer = thumbnailResponse?.data ? Buffer.from(thumbnailResponse.data, 'binary') : null;

                // Prepare song information message
                const songInfo = `🎧 *${songData.title || videoInfo?.title || 'Unknown Title'}*\n` +
                                `⏱ ${videoInfo?.timestamp || 'N/A'}\n` +
                                `👤 ${videoInfo?.author?.name || 'Unknown Artist'}\n` +
                                `👀 ${(videoInfo?.views || 'N/A').toLocaleString()} views\n\n` +
                                `🔗 ${videoUrl}\n\n` +
                                `\`Reply with:\`\n` +
                                `1 - For Audio Format 🎵\n` +
                                `2 - For Document Format 📁\n\n` +
                                `> ${Config.FOOTER}`;

                // Send song info with thumbnail
                const sentMsg = await conn.sendMessage(mek.chat, {
                    image: thumbnailBuffer,
                    caption: songInfo,
                    contextInfo: {
                        externalAdReply: {
                            title: songData.title || videoInfo?.title || 'YouTube Audio',
                            body: `Duration: ${videoInfo?.timestamp || 'N/A'}`,
                            thumbnail: thumbnailBuffer,
                            mediaType: 1,
                            mediaUrl: videoUrl,
                            sourceUrl: videoUrl
                        }
                    }
                }, { quoted: mek });

                // Set up response listener
                const messageListener = async (messageUpdate) => {
                    try {
                        const mekInfo = messageUpdate?.messages[0];
                        if (!mekInfo?.message) return;

                        const message = mekInfo.message;
                        const messageType = message.conversation || message.extendedTextMessage?.text;
                        const isReplyToSentMsg = message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

                        if (!isReplyToSentMsg || !['1', '2'].includes(messageType?.trim())) return;

                        // Immediately remove listener
                        conn.ev.off('messages.upsert', messageListener);

                        // Delete the options message first (works even if not admin)
                        try {
                            await conn.sendMessage(mek.chat, {
                                delete: sentMsg.key
                            });
                            console.log(`Options message deleted: ${sentMsg.key.id}`);
                        } catch (deleteError) {
                            console.error("Failed to delete options message:", deleteError);
                        }

                        // Start download without waiting for confirmation message
                        const audioPromise = axiosInstance.get(songData.download_url, {
                            responseType: 'arraybuffer',
                            headers: { 
                                Referer: 'https://www.youtube.com/',
                                'Accept-Encoding': 'identity'
                            },
                            timeout: 15000 // Reduced from 30000
                        }).then(response => Buffer.from(response.data, 'binary'));

                        // Send "downloading" message and wait for both
                        const [audioBuffer] = await Promise.all([
                            audioPromise,
                            reply("⏳ Downloading your audio...")
                        ]);

                        const fileName = `${(songData.title || videoInfo?.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '')}.mp3`;

                        // Send audio based on user choice
                        if (messageType.trim() === "1") {
                            await conn.sendMessage(mek.chat, {
                                audio: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                ptt: false
                            }, { quoted: mek });
                        } else {
                            await conn.sendMessage(mek.chat, {
                                document: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName
                            }, { quoted: mek });
                        }

                        // Send success reaction
                        try {
                            if (mekInfo?.key?.id) {
                                await conn.sendMessage(mek.chat, { react: { text: "✅", key: mekInfo.key } });
                            }
                        } catch (reactError) {
                            console.error('Success reaction failed:', reactError);
                        }

                    } catch (error) {
                        console.error('Download error:', error);
                        await reply('❌ Download failed: ' + (error.message || 'Network error'));
                        try {
                            if (mek?.key?.id) {
                                await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
                            }
                        } catch (reactError) {
                            console.error('Error reaction failed:', reactError);
                        }
                    }
                };

                conn.ev.on('messages.upsert', messageListener);

            } catch (apiError) {
                console.error('API error:', apiError);
                return reply('❌ Audio download failed. The service might be unavailable.');
            }

        } catch (error) {
            console.error('Main error:', error);
            reply('❌ An unexpected error occurred: ' + (error.message || 'Please try again later'));
            try {
                if (mek?.key?.id) {
                    await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
                }
            } catch (reactError) {
                console.error('Final reaction failed:', reactError);
            }
        }
    }
);
*/
