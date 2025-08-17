const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

cmd(
    {
        pattern: 'movie',
        alias: ['film', 'cinema'],
        desc: 'Download movies in various qualities',
        category: 'download',
        react: '🎬',
        use: '<movie name>',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply('🎬 *Usage:* .movie <movie name>\nExample: .movie Deadpool');

            // Send initial reaction
            try {
                if (mek?.key?.id) {
                    await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });
                }
            } catch (reactError) {
                console.error('Reaction error:', reactError);
            }

            // Search for movies
            const apiUrl = `https://infinity-apis.vercel.app/api/moviedl?movieName=${encodeURIComponent(text)}`;
            
            const response = await axiosInstance.get(apiUrl);
            const data = response.data;

            if (!data?.length) {
                return reply('❌ No movies found for your search');
            }

            // Format the results
            const movie = data[0]; // Get first movie result
            let resultMessage = `🎬 *${movie.title}*\n\n`;
            
            // Movie info
            resultMessage += `📌 *Genre:* ${movie.info.genre}\n`;
            resultMessage += `⏱ *Duration:* ${movie.info.duration}\n`;
            resultMessage += `📅 *Release Date:* ${movie.info.releaseDate}\n`;
            resultMessage += `🌐 *Language:* ${movie.info.language}\n`;
            resultMessage += `🌟 *Cast:* ${movie.info.starcast}\n\n`;
            resultMessage += `📝 *Description:* ${movie.info.description}\n\n`;
            resultMessage += `💾 *Available Qualities:*\n`;

            // Download options
            movie.downloadOptions.forEach((option, index) => {
                resultMessage += `\n${index + 1}. ${option.quality}`;
            });

            resultMessage += `\n\n*Reply with the quality number* (1-${movie.downloadOptions.length}) to download\n`;
            resultMessage += `> ${Config.FOOTER}`;

            // Get thumbnail if available
            let thumbnailBuffer;
            try {
                if (movie.image) {
                    const thumbnailResponse = await axiosInstance.get(movie.image, {
                        responseType: 'arraybuffer',
                        timeout: 5000
                    });
                    thumbnailBuffer = Buffer.from(thumbnailResponse.data, 'binary');
                }
            } catch (thumbError) {
                console.error('Thumbnail error:', thumbError);
            }

            // Send the results
            const sentMsg = await conn.sendMessage(mek.chat, {
                image: thumbnailBuffer,
                caption: resultMessage
            }, { quoted: mek });

            // Set up response listener
            const messageListener = async (messageUpdate) => {
                try {
                    const mekInfo = messageUpdate?.messages[0];
                    if (!mekInfo?.message) return;

                    const message = mekInfo.message;
                    const messageType = message.conversation || message.extendedTextMessage?.text;
                    const isReplyToSentMsg = message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

                    if (!isReplyToSentMsg) return;

                    const selectedIndex = parseInt(messageType?.trim());
                    if (isNaN(selectedIndex)) return;
                    if (selectedIndex < 1 || selectedIndex > movie.downloadOptions.length) return;

                    // Immediately remove listener
                    conn.ev.off('messages.upsert', messageListener);

                    // Delete the options message first
                    try {
                        await conn.sendMessage(mek.chat, {
                            delete: sentMsg.key
                        });
                    } catch (deleteError) {
                        console.error("Failed to delete options message:", deleteError);
                    }

                    const selectedQuality = movie.downloadOptions[selectedIndex - 1];
                    
                    // Send downloading message
                    await reply(`⏳ Downloading *${movie.title}* (${selectedQuality.quality})...`);

                    // Get the download links
                    let downloadLinks = `🔗 *Download Links for ${movie.title} (${selectedQuality.quality})*\n\n`;
                    selectedQuality.finalDownload.forEach((link, i) => {
                        downloadLinks += `${i + 1}. *${link.label}*\n${link.url}\n\n`;
                    });

                    await reply(downloadLinks);

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
                    await reply('❌ Error processing your request: ' + (error.message || 'Network error'));
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

        } catch (error) {
            console.error('Main error:', error);
            reply('❌ An error occurred: ' + (error.message || 'Please try again later'));
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
