const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
    timeout: 20000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity'
    }
});

// Hector Manuel API configuration
const YTMAX_API_URL = 'https://yt-dl.officialhectormanuel.workers.dev/';

// Utility function to fetch video info
async function fetchVideoInfo(text) {
    const isYtUrl = text.match(/(youtube\.com|youtu\.be)/i);
    
    if (isYtUrl) {
        const videoId = text.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
        if (!videoId) throw new Error('Invalid YouTube URL format');
        
        const videoInfo = await yts({ videoId });
        if (!videoInfo) throw new Error('Could not fetch video info');
        
        return { 
            url: `https://youtu.be/${videoId}`, 
            info: videoInfo,
            isUrl: true
        };
    } else {
        const searchResults = await yts(text);
        if (!searchResults?.videos?.length) throw new Error('No results found');
        
        const validVideos = searchResults.videos.filter(v => 
            !v.live && v.seconds < 10800 && v.views > 10000
        );
        
        if (!validVideos.length) throw new Error('Only found live streams/unpopular videos');
        
        return { 
            url: validVideos[0].url, 
            info: validVideos[0],
            isUrl: false,
            searchQuery: text
        };
    }
}

// Utility function to fetch data from YTMAX API
async function fetchYtMaxData(videoUrl) {
    try {
        const apiUrl = `${YTMAX_API_URL}?url=${encodeURIComponent(videoUrl)}`;
        const response = await axiosInstance.get(apiUrl);
        
        if (!response.data?.status) {
            throw new Error('Invalid API response');
        }
        
        return response.data;
    } catch (error) {
        console.error('YTMAX API Error:', error);
        throw new Error('Failed to fetch media data from API');
    }
}

// Utility function to download media
async function downloadMedia(url) {
    try {
        const response = await axiosInstance.get(url, {
            responseType: 'arraybuffer',
            timeout: 45000,
            onDownloadProgress: (progress) => {
                if (progress.total) {
                    const percent = Math.round((progress.loaded * 100) / progress.total);
                    console.log(`Download: ${percent}%`);
                }
            }
        });
        
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Download Error:', error);
        throw new Error('Failed to download media');
    }
}

// Utility function to fetch thumbnail
async function fetchThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    try {
        const response = await axiosInstance.get(thumbnailUrl, { 
            responseType: 'arraybuffer', 
            timeout: 10000 
        });
        return Buffer.from(response.data, 'binary');
    } catch (e) {
        console.error('Thumbnail error:', e);
        return null;
    }
}

// Main YTMAX command
cmd({
    pattern: 'ytmax',
    alias: ['max', 'ytdl', 'downloadmax'],
    desc: 'High quality YouTube downloader with multiple options',
    category: 'download',
    react: '🎬',
    use: '<YouTube URL or search query>',
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('🎬 *YTMAX Downloader*\n\n' +
                        '📥 Download YouTube videos/audio in multiple qualities\n\n' +
                        '*Usage:* .ytmax <query/url>\n' +
                        'Examples:\n' +
                        `• ${Config.PREFIX}ytmax https://youtu.be/ox4tmEV6-QU\n` +
                        `• ${Config.PREFIX}ytmax Alan Walker faded\n` +
                        `• ${Config.PREFIX}ytmax trending music`);
        }

        // Send processing reaction
        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        // Fetch video info
        const videoData = await fetchVideoInfo(text);
        const videoUrl = videoData.url;
        const videoInfo = videoData.info;
        const isUrl = videoData.isUrl;
        const searchQuery = videoData.searchQuery;

        // Fetch data from YTMAX API
        const ytData = await fetchYtMaxData(videoUrl);

        // Fetch thumbnail
        const thumbnailBuffer = await fetchThumbnail(ytData.thumbnail || videoInfo?.thumbnail);

        // Generate unique session ID
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Prepare caption - FIXED: Changed "Hector Manuel" to "Mr Frank"
        let caption = `🎬 *YTMAX DOWNLOADER* 🎬\n\n` +
                     `📌 *Title:* ${ytData.title || videoInfo?.title || 'Unknown'}\n` +
                     `👤 *Channel:* ${videoInfo?.author?.name || 'Unknown'}\n` +
                     `⏱️ *Duration:* ${videoInfo?.timestamp || 'Unknown'}\n` +
                     `👀 *Views:* ${videoInfo?.views?.toLocaleString() || 'Unknown'}\n`;
        
        if (!isUrl) {
            caption += `🔍 *Searched:* "${searchQuery}"\n`;
        }
        
        caption += `\n📊 *Available Qualities:*\n` +
                  `🎵 Audio • 🎥 144p-1080p\n\n` +
                  `> Powered by Mr Frank`;

        // Create buttons for all available options
        let buttons = [
            {
                buttonId: `ytmax-audio-${sessionId}`,
                buttonText: { displayText: '🎵 Audio MP3' },
                type: 1
            }
        ];

        // Add video quality buttons - FIXED: Added all qualities up to 1080p
        const qualities = ['144', '240', '360', '480', '720', '1080'];
        
        qualities.forEach(quality => {
            if (ytData.videos && ytData.videos[quality]) {
                buttons.push({
                    buttonId: `ytmax-video-${quality}-${sessionId}`,
                    buttonText: { displayText: `🎥 ${quality}p` },
                    type: 1
                });
            }
        });

        // Ensure we don't exceed button limits
        const maxButtons = 5; // WhatsApp limit
        const finalButtons = buttons.slice(0, maxButtons);

        // Create buttons message
        const buttonsMessage = {
            image: thumbnailBuffer,
            caption: caption,
            footer: Config.FOOTER || 'Select download option • Mr Frank',
            buttons: finalButtons,
            headerType: 1,
            contextInfo: {
                externalAdReply: {
                    title: ytData.title || 'YTMAX Downloader',
                    body: `Duration: ${videoInfo?.timestamp || 'N/A'} • Views: ${videoInfo?.views?.toLocaleString() || 'N/A'}`,
                    thumbnail: thumbnailBuffer,
                    mediaType: 1,
                    mediaUrl: videoUrl,
                    sourceUrl: videoUrl
                }
            }
        };

        // Send message with buttons
        const finalMsg = await conn.sendMessage(mek.chat, buttonsMessage, { quoted: mek });
        const messageId = finalMsg.key.id;

        // Button handler
        const buttonHandler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg.message?.buttonsResponseMessage) return;

                const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
                const senderId = receivedMsg.key.remoteJid;
                const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

                if (isReplyToBot && senderId === mek.chat && buttonId.includes(sessionId)) {
                    // Remove listener to prevent multiple triggers
                    conn.ev.off('messages.upsert', buttonHandler);

                    await conn.sendMessage(mek.chat, { react: { text: '⏳', key: receivedMsg.key } });

                    try {
                        let mediaUrl, fileName, mediaType, qualityText;

                        if (buttonId.startsWith(`ytmax-audio-${sessionId}`)) {
                            // Audio download
                            mediaUrl = ytData.audio;
                            fileName = `${(ytData.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '')}.mp3`;
                            mediaType = 'audio';
                            qualityText = 'Audio MP3';
                        } else if (buttonId.startsWith(`ytmax-video-`)) {
                            // Video download - extract quality
                            const qualityMatch = buttonId.match(/ytmax-video-(\d+)-/);
                            if (qualityMatch && qualityMatch[1]) {
                                const quality = qualityMatch[1];
                                mediaUrl = ytData.videos[quality];
                                fileName = `${(ytData.title || 'video').replace(/[<>:"\/\\|?*]+/g, '')}_${quality}p.mp4`;
                                mediaType = 'video';
                                qualityText = `${quality}p Video`;
                            }
                        }

                        if (!mediaUrl) {
                            throw new Error('Selected option not available');
                        }

                        // Download media
                        await reply(`⬇️ *Downloading ${qualityText}...*\nPlease wait, this may take a while...`);
                        
                        const mediaBuffer = await downloadMedia(mediaUrl);

                        // Prepare final caption
                        let finalCaption = `🎬 *${ytData.title || 'Media'}*\n\n` +
                                         `📊 *Quality:* ${qualityText}\n` +
                                         `⏱️ *Duration:* ${videoInfo?.timestamp || 'N/A'}\n` +
                                         `👀 *Views:* ${videoInfo?.views?.toLocaleString() || 'N/A'}\n`;
                        
                        if (!isUrl) {
                            finalCaption += `🔍 *Searched:* "${searchQuery}"\n\n`;
                        }
                        
                        finalCaption += `> Downloaded via YTMAX • ${Config.BOTNAME || 'Bot'}`;

                        // Send media
                        if (mediaType === 'audio') {
                            await conn.sendMessage(mek.chat, {
                                audio: mediaBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                ptt: false
                            }, { quoted: receivedMsg });
                        } else {
                            await conn.sendMessage(mek.chat, {
                                video: mediaBuffer,
                                caption: finalCaption,
                                fileName: fileName
                            }, { quoted: receivedMsg });
                        }

                        await conn.sendMessage(mek.chat, { react: { text: '✅', key: receivedMsg.key } });

                    } catch (error) {
                        console.error('Download Error:', error);
                        await conn.sendMessage(mek.chat, { react: { text: '❌', key: receivedMsg.key } });
                        reply(`❌ Error: ${error.message || 'Download failed'}`);
                    }
                }
            } catch (error) {
                console.error('Button handler error:', error);
            }
        };

        // Add listener
        conn.ev.on('messages.upsert', buttonHandler);

        // Remove listener after 3 minutes
        setTimeout(() => {
            conn.ev.off('messages.upsert', buttonHandler);
        }, 180000);

    } catch (error) {
        console.error('YTMAX Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error: ${error.message || 'Failed to process request'}`);
    }
});
