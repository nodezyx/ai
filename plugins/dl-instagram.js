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
const INSTAGRAM_API_URL = 'https://dev-priyanshi.onrender.com/api/alldl';

// Utility function to check if text is a URL
function isUrl(text) {
    try {
        new URL(text);
        return true;
    } catch (e) {
        return false;
    }
}

// Utility function to validate Instagram URL
function isValidInstagramUrl(url) {
    return url.includes('instagram.com') || url.includes('instagr.am') || 
           url.includes('/reel/') || url.includes('/p/') || url.includes('/stories/');
}

// Utility function to fetch Instagram video info
async function fetchInstagramVideoInfo(url) {
    try {
        const apiUrl = `${INSTAGRAM_API_URL}?url=${encodeURIComponent(url)}`;
        const response = await axiosInstance.get(apiUrl);
        
        if (!response.data?.status || !response.data.data) {
            throw new Error('Invalid API response from Instagram');
        }
        
        // Handle undefined title
        const videoData = response.data.data;
        if (videoData.title === 'undefined' || videoData.title === 'undefined💔') {
            videoData.title = 'Instagram Video';
        }
        
        return videoData;
    } catch (error) {
        console.error('Instagram Video API error:', error);
        throw new Error('Failed to fetch Instagram video information');
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
    pattern: "ig",
    alias: ["instagram", "igvideo", "igdownload", "reel"],
    desc: "Download videos from Instagram",
    category: "download",
    react: "📸",
    use: "<Instagram video URL>",
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('📸 *Instagram Video Downloader*\n\n' +
                        '*Usage:* .ig <Instagram video URL>\n\n' +
                        'Examples:\n' +
                        `• ${Config.PREFIX}ig https://instagram.com/reel/DN0oBN7WG3W/\n` +
                        `• ${Config.PREFIX}ig https://www.instagram.com/p/Cabc123def/\n` +
                        `• ${Config.PREFIX}ig https://instagr.am/reel/DN0oBN7WG3W/`);
        }

        // Validate Instagram URL
        if (!isValidInstagramUrl(text)) {
            await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
            return reply('❌ *Invalid Instagram URL*\n\n' +
                        'Please provide a valid Instagram video URL.\n' +
                        'Supported formats:\n' +
                        '• https://instagram.com/reel/DN0oBN7WG3W/\n' +
                        '• https://www.instagram.com/p/Cabc123def/\n' +
                        '• https://instagr.am/reel/DN0oBN7WG3W/\n' +
                        '• https://instagram.com/stories/username/123456789/');
        }

        // Send processing reaction
        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        // Fetch video info
        const videoData = await fetchInstagramVideoInfo(text);
        
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
                const caption = `📸 *Instagram Video Downloader*\n\n` +
                              `📌 *Title*: ${videoData.title}\n` +
                              `🔄 *Quality Options Available*\n\n` +
                              `> Powered by Mr Frank`;

                // Create buttons message
                const buttonsMessage = {
                    image: thumbnailBuffer,
                    caption: caption,
                    footer: Config.FOOTER || 'Select download quality',
                    buttons: [
                        {
                            buttonId: `ig-high-${sessionId}-${encodeURIComponent(text)}`,
                            buttonText: { displayText: '🎥 High Quality' },
                            type: 1
                        },
                        {
                            buttonId: `ig-low-${sessionId}-${encodeURIComponent(text)}`,
                            buttonText: { displayText: '📱 Low Quality' },
                            type: 1
                        }
                    ],
                    headerType: 1,
                    contextInfo: {
                        externalAdReply: {
                            title: videoData.title,
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
                            const isHighQuality = buttonId.startsWith(`ig-high-${sessionId}`);
                            const videoUrl = isHighQuality ? videoData.high : videoData.low;
                            
                            // Download the video
                            await reply('```Downloading Instagram video... Please wait.📥```');
                            const videoBuffer = await downloadVideo(videoUrl);
                            
                            const fileName = `${videoData.title.replace(/[<>:"\/\\|?*]+/g, '')}.mp4`;

                            // Send video
                            await conn.sendMessage(mek.chat, {
                                video: videoBuffer,
                                caption: `📸 *${videoData.title}*\n` +
                                        `📏 *Quality*: ${isHighQuality ? 'High' : 'Low'}\n` +
                                        `🌐 *Source*: Instagram\n\n` +
                                        `> Downloaded via ${Config.BOTNAME || 'Bot'}`,
                                fileName: fileName
                            }, { quoted: receivedMsg });

                            await conn.sendMessage(mek.chat, { react: { text: '✅', key: receivedMsg.key } });
                        } catch (error) {
                            console.error('Instagram Video Download Error:', error);
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
            await reply(`📸 *${videoData.title}*\n\n` +
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
                    await reply('```Downloading Instagram video... Please wait.📥```');
                    const videoBuffer = await downloadVideo(videoUrl);
                    
                    const fileName = `${videoData.title.replace(/[<>:"\/\\|?*]+/g, '')}.mp4`;

                    // Send video
                    await conn.sendMessage(mek.chat, {
                        video: videoBuffer,
                        caption: `📸 *${videoData.title}*\n` +
                                `📏 *Quality*: ${isHighQuality ? 'High' : 'Low'}\n` +
                                `🌐 *Source*: Instagram\n\n` +
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
        console.error('Instagram Video Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        
        if (error.message.includes('Invalid Instagram URL')) {
            reply('❌ *Invalid Instagram URL*\n\nPlease provide a valid Instagram video URL.\n' +
                 'Supported formats:\n• https://instagram.com/reel/DN0oBN7WG3W/\n' +
                 '• https://www.instagram.com/p/Cabc123def/');
        } else {
            reply(`❌ Error: ${error.message || 'Failed to process Instagram video'}`);
        }
    }
});
