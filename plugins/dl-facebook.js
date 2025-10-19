const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
    timeout: 15000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

// API configuration
const FACEBOOK_API_URL = 'https://dev-priyanshi.onrender.com/api/alldl';

// Utility function to check if text is a URL
function isUrl(text) {
    try {
        new URL(text);
        return true;
    } catch (e) {
        return false;
    }
}

// Utility function to validate Facebook URL
function isValidFacebookUrl(url) {
    return url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch');
}

// Utility function to fetch Facebook video info
async function fetchFacebookVideoInfo(url) {
    try {
        const apiUrl = `${FACEBOOK_API_URL}?url=${encodeURIComponent(url)}`;
        const response = await axiosInstance.get(apiUrl);
        
        if (!response.data?.status || !response.data.data) {
            throw new Error('Invalid API response');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('Facebook Video API error:', error);
        throw new Error('Failed to fetch Facebook video information');
    }
}

// Utility function to download video
async function downloadVideo(videoUrl) {
    try {
        const response = await axiosInstance.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            onDownloadProgress: (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Download progress: ${percent}%`);
            }
        });
        
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Video download error:', error);
        throw new Error('Failed to download video');
    }
}

// Utility function to fetch thumbnail
async function fetchThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    try {
        const response = await axiosInstance.get(thumbnailUrl, { 
            responseType: 'arraybuffer', 
            timeout: 8000 
        });
        return Buffer.from(response.data, 'binary');
    } catch (e) {
        console.error('Thumbnail error:', e);
        return null;
    }
}

cmd({
    pattern: "fb",
    alias: ["fbvideo", "facebook", "fbdownload"],
    desc: "Download videos from Facebook",
    category: "download",
    react: "📥",
    use: "<Facebook video URL>",
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('📥 *Facebook Video Downloader*\n\n' +
                        '*Usage:* .fb <Facebook video URL>\n\n' +
                        'Examples:\n' +
                        `• ${Config.PREFIX}fb https://facebook.com/share/v/16rHWGkeet/\n` +
                        `• ${Config.PREFIX}fb https://fb.watch/abc123def/\n` +
                        `• ${Config.PREFIX}fb https://www.facebook.com/video.php?v=123456789`);
        }

        // Validate Facebook URL
        if (!isValidFacebookUrl(text)) {
            await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
            return reply('❌ *Invalid Facebook URL*\n\n' +
                        'Please provide a valid Facebook video URL.\n' +
                        'Examples:\n' +
                        '• https://facebook.com/share/v/16rHWGkeet/\n' +
                        '• https://fb.watch/abc123def/\n' +
                        '• https://www.facebook.com/video.php?v=123456789');
        }

        // Send processing reaction
        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        // Fetch video info
        const videoData = await fetchFacebookVideoInfo(text);
        
        // Check if button interface should be used
        const useButtons = Config.BUTTON === true || Config.BUTTON === "true";

        if (useButtons) {
            // Button-based interface
            try {
                // Fetch thumbnail
                const thumbnailBuffer = await fetchThumbnail(videoData.thumbnail);

                // Generate unique session ID
                const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                // Prepare caption
                const caption = `📥 *Facebook Video Downloader*\n\n` +
                              `📌 *Title*: ${videoData.title || 'Facebook Video'}\n` +
                              `🔄 *Quality Options Available*\n\n` +
                              `> Powered by Mr Frank`;

                // Create buttons message
                const buttonsMessage = {
                    image: thumbnailBuffer,
                    caption: caption,
                    footer: Config.FOOTER || 'Select download quality',
                    buttons: [
                        {
                            buttonId: `fb-high-${sessionId}-${encodeURIComponent(text)}`,
                            buttonText: { displayText: '🎥 High Quality' },
                            type: 1
                        },
                        {
                            buttonId: `fb-low-${sessionId}-${encodeURIComponent(text)}`,
                            buttonText: { displayText: '📱 Low Quality' },
                            type: 1
                        }
                    ],
                    headerType: 1,
                    contextInfo: {
                        externalAdReply: {
                            title: videoData.title || "Facebook Video",
                            body: `Available in multiple qualities`,
                            thumbnail: thumbnailBuffer,
                            mediaType: 1,
                            mediaUrl: text,
                            sourceUrl: text
                        }
                    }
                };

                // Send message with buttons
                const finalMsg = await conn.sendMessage(mek.chat, buttonsMessage, { quoted: mek });
                const messageId = finalMsg.key.id;

                // Button handler
                const buttonHandler = async (msgData) => {
                    const receivedMsg = msgData.messages[0];
                    if (!receivedMsg.message?.buttonsResponseMessage) return;

                    const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
                    const senderId = receivedMsg.key.remoteJid;
                    const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

                    if (isReplyToBot && senderId === mek.chat && buttonId.includes(sessionId)) {
                        conn.ev.off('messages.upsert', buttonHandler); // Remove listener

                        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: receivedMsg.key } });

                        try {
                            const isHighQuality = buttonId.startsWith(`fb-high-${sessionId}`);
                            const videoUrl = isHighQuality ? videoData.high : videoData.low;
                            
                            // Download the video
                            await reply('```Downloading Facebook video... Please wait.📥```');
                            const videoBuffer = await downloadVideo(videoUrl);
                            
                            const fileName = `${(videoData.title || 'facebook_video').replace(/[<>:"\/\\|?*]+/g, '')}.mp4`;

                            // Send video
                            await conn.sendMessage(mek.chat, {
                                video: videoBuffer,
                                caption: `📥 *${videoData.title || 'Facebook Video'}*\n` +
                                        `📏 *Quality*: ${isHighQuality ? 'High' : 'Low'}\n` +
                                        `🌐 *Source*: Facebook\n\n` +
                                        `> Downloaded via ${Config.BOTNAME || 'Bot'}`,
                                fileName: fileName
                            }, { quoted: receivedMsg });

                            await conn.sendMessage(mek.chat, { react: { text: '✅', key: receivedMsg.key } });
                        } catch (error) {
                            console.error('Facebook Video Download Error:', error);
                            await conn.sendMessage(mek.chat, { react: { text: '❌', key: receivedMsg.key } });
                            reply(`❌ Error: ${error.message || 'Download failed'}`);
                        }
                    }
                };

                // Add listener
                conn.ev.on('messages.upsert', buttonHandler);

                // Remove listener after 2 minutes
                setTimeout(() => {
                    conn.ev.off('messages.upsert', buttonHandler);
                }, 120000);

            } catch (error) {
                console.error('Button interface error:', error);
                // Fall back to text interface if button interface fails
                await sendVideoDirectly();
            }
        } else {
            // Text-based interface
            await sendVideoDirectly();
        }

        async function sendVideoDirectly() {
            // Ask for quality preference
            await reply(`📥 *${videoData.title || 'Facebook Video'}*\n\n` +
                        `Please choose quality:\n` +
                        `1 - High Quality 🎥\n` +
                        `2 - Low Quality 📱\n\n` +
                        `*Reply with 1 or 2*`);

            // Set up response listener
            const messageListener = async (messageUpdate) => {
                try {
                    const mekInfo = messageUpdate?.messages[0];
                    if (!mekInfo?.message) return;

                    const message = mekInfo.message;
                    const messageType = message.conversation || message.extendedTextMessage?.text;
                    const isReplyToOriginal = mekInfo.key.remoteJid === mek.chat;

                    if (!isReplyToOriginal || !['1', '2'].includes(messageType?.trim())) return;

                    // Immediately remove listener
                    conn.ev.off('messages.upsert', messageListener);

                    const isHighQuality = messageType.trim() === "1";
                    const videoUrl = isHighQuality ? videoData.high : videoData.low;

                    // Download the video
                    await reply('```Downloading Facebook video... Please wait.📥```');
                    const videoBuffer = await downloadVideo(videoUrl);
                    
                    const fileName = `${(videoData.title || 'facebook_video').replace(/[<>:"\/\\|?*]+/g, '')}.mp4`;

                    // Send video
                    await conn.sendMessage(mek.chat, {
                        video: videoBuffer,
                        caption: `📥 *${videoData.title || 'Facebook Video'}*\n` +
                                `📏 *Quality*: ${isHighQuality ? 'High' : 'Low'}\n` +
                                `🌐 *Source*: Facebook\n\n` +
                                `> Downloaded via ${Config.BOTNAME || 'Bot'}`,
                        fileName: fileName
                    }, { quoted: mek });

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
                    reply('❌ Download failed: ' + (error.message || 'Network error'));
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

            // Remove listener after 2 minutes
            setTimeout(() => {
                conn.ev.off('messages.upsert', messageListener);
            }, 120000);
        }

    } catch (error) {
        console.error('Facebook Video Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        
        if (error.message.includes('Invalid Facebook URL')) {
            reply('❌ *Invalid Facebook URL*\n\nPlease provide a valid Facebook video URL.\n' +
                 'Examples:\n• https://facebook.com/share/v/16rHWGkeet/\n' +
                 '• https://fb.watch/abc123def/');
        } else {
            reply(`❌ Error: ${error.message || 'Failed to process Facebook video'}`);
        }
    }
});
