const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
    timeout: 15000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

// Kaiz-API configuration
const KAIZ_API_KEY = 'cf2ca612-296f-45ba-abbc-473f18f991eb'; // Replace if needed
const KAIZ_API_URL = 'https://kaiz-apis.gleeze.com/api/ytdown-mp3';

// Utility function to fetch YouTube video info
async function fetchVideoInfo(text) {
    const isYtUrl = text.match(/(youtube\.com|youtu\.be)/i);
    if (isYtUrl) {
        const videoId = text.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
        if (!videoId) throw new Error('Invalid YouTube URL format');
        const videoInfo = await yts({ videoId });
        if (!videoInfo) throw new Error('Could not fetch video info');
        return { url: `https://youtu.be/${videoId}`, info: videoInfo };
    } else {
        const searchResults = await yts(text);
        if (!searchResults?.videos?.length) throw new Error('No results found');
        const validVideos = searchResults.videos.filter(v => !v.live && v.seconds < 7200 && v.views > 10000);
        if (!validVideos.length) throw new Error('Only found live streams/unpopular videos');
        return { url: validVideos[0].url, info: validVideos[0] };
    }
}

// Utility function to fetch audio from Kaiz-API
async function fetchAudioData(videoUrl) {
    const apiUrl = `${KAIZ_API_URL}?url=${encodeURIComponent(videoUrl)}&apikey=${KAIZ_API_KEY}`;
    const response = await axiosInstance.get(apiUrl);
    if (!response.data?.download_url) throw new Error('Invalid API response');
    return response.data;
}

// Utility function to fetch thumbnail
async function fetchThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    try {
        const response = await axiosInstance.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 8000 });
        return Buffer.from(response.data, 'binary');
    } catch (e) {
        console.error('Thumbnail error:', e);
        return null;
    }
}

// Utility function to send audio
async function sendAudio(conn, chat, audioBuffer, fileName, type, caption, quoted) {
    if (type === 'audio') {
        await conn.sendMessage(chat, { 
            audio: audioBuffer, 
            mimetype: 'audio/mpeg', 
            fileName, 
            ptt: false 
        }, { quoted });
    } else if (type === 'document') {
        await conn.sendMessage(chat, { 
            document: audioBuffer, 
            mimetype: 'audio/mpeg', 
            fileName 
        }, { quoted });
    } else if (type === 'whatsapp') {
        await conn.sendMessage(chat, { 
            audio: audioBuffer, 
            mimetype: 'audio/mp4', 
            ptt: true 
        }, { quoted });
    }
}

cmd(
    {
        pattern: 'song',
        alias: ['ytaudio', 'play'],
        desc: 'High quality YouTube audio downloader',
        category: 'media',
        react: '🎵',
        use: '<YouTube URL or search query>',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) {
                await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
                return reply('🎵 *Usage:* .song <query/url>\nExample: .song https://youtu.be/ox4tmEV6-QU\n.song Alan Walker faded');
            }

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

            // Fetch video info
            const { url: videoUrl, info: videoInfo } = await fetchVideoInfo(text);

            // Fetch audio data
            const songData = await fetchAudioData(videoUrl);

            // Check if button interface should be used
            const useButtons = Config.BUTTON === true || Config.BUTTON === "true";

            if (useButtons) {
                // Use button-based interface
                
                // Fetch thumbnail
                const thumbnailBuffer = await fetchThumbnail(videoInfo.thumbnail);

                // Prepare message
                const caption = `  🎀 Ξ *SONG DOWNLOADER* Ξ 

├─ 📌 Title: ${songData.title || videoInfo?.title || 'Unknown'}
├─ 😎 Author: ${videoInfo?.author?.name || 'Unknown'}
├─ ⏱️ Duration: ${videoInfo?.timestamp || 'Unknown'}
├─ 👁️ Views: ${videoInfo?.views?.toLocaleString() || 'Unknown'}
├─ 🕒 Published: ${videoInfo?.ago || 'Unknown'}
╰─ 🔗 URL: ${videoUrl || 'Unknown'}

> Powered By Mr Frank `;

                // Generate unique session ID
                const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                // Create buttons message
                const buttonsMessage = {
                    image: thumbnailBuffer,
                    caption,
                    footer: Config.FOOTER || '> Powered by Kaiz API',
                    buttons: [
                        {
                            buttonId: `song-audio-${sessionId}-${encodeURIComponent(videoUrl)}`,
                            buttonText: { displayText: '🎵 Audio (Play)' },
                            type: 1
                        },
                        {
                            buttonId: `song-document-${sessionId}-${encodeURIComponent(videoUrl)}`,
                            buttonText: { displayText: '📁 Document (Save)' },
                            type: 1
                        },
                        {
                            buttonId: `song-whatsapp-${sessionId}-${encodeURIComponent(videoUrl)}`,
                            buttonText: { displayText: '📲 WhatsApp Audio' },
                            type: 1
                        }
                    ],
                    headerType: 1,
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
                            let type = 'audio';
                            if (buttonId.startsWith(`song-audio-${sessionId}`)) type = 'audio';
                            if (buttonId.startsWith(`song-document-${sessionId}`)) type = 'document';
                            if (buttonId.startsWith(`song-whatsapp-${sessionId}`)) type = 'whatsapp';
                            
                            // Extract video URL from button ID
                            const urlMatch = buttonId.match(/song-(audio|document|whatsapp)-[^-]+-(.+)/);
                            const targetVideoUrl = urlMatch ? decodeURIComponent(urlMatch[2]) : videoUrl;
                            
                            const freshSongData = await fetchAudioData(targetVideoUrl); // Fresh API call

                            // Download audio
                            const audioResponse = await axiosInstance.get(freshSongData.download_url, {
                                responseType: 'arraybuffer',
                                headers: { Referer: 'https://www.youtube.com/', 'Accept-Encoding': 'identity' },
                                timeout: 30000
                            });

                            const audioBuffer = Buffer.from(audioResponse.data, 'binary');
                            const fileName = `${(freshSongData.title || videoInfo?.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '')}.mp3`;

                            await sendAudio(conn, mek.chat, audioBuffer, fileName, type, caption, receivedMsg);
                            await conn.sendMessage(mek.chat, { react: { text: '✅', key: receivedMsg.key } });
                        } catch (error) {
                            console.error('Song Download Error:', error);
                            await conn.sendMessage(mek.chat, { react: { text: '❌', key: receivedMsg.key } });
                            reply(`❎ Error: ${error.message || 'Download failed'}`);
                        }
                    }
                };

                // Add listener
                conn.ev.on('messages.upsert', buttonHandler);

                // Remove listener after 1 minute
                setTimeout(() => {
                    conn.ev.off('messages.upsert', buttonHandler);
                }, 60000);

            } else {
                // Use text-based interface with both reactions and text replies
                
                // Fetch thumbnail in parallel with audio download
                const [thumbnailResponse] = await Promise.all([
                    videoInfo?.thumbnail ? 
                        axiosInstance.get(videoInfo.thumbnail, { 
                            responseType: 'arraybuffer',
                            timeout: 5000 
                        }).catch(() => null) : 
                        Promise.resolve(null)
                ]);

                const thumbnailBuffer = thumbnailResponse?.data ? Buffer.from(thumbnailResponse.data, 'binary') : null;

                // Prepare song information message
                const songInfo = `🎧 *${songData.title || videoInfo?.title || 'Unknown Title'}*\n` +
                                `⏱ ${videoInfo?.timestamp || 'N/A'}\n` +
                                `👤 ${videoInfo?.author?.name || 'Unknown Artist'}\n` +
                                `👀 ${(videoInfo?.views || 'N/A').toLocaleString()} views\n\n` +
                                `🔗 ${videoUrl}\n\n` +
                                `*Choose format:*\n` +
                                `1️⃣ - For Audio Format 🎵\n` +
                                `2️⃣ - For Document Format 📁\n` +
                                `3️⃣ - For WhatsApp Audio 📲\n\n` +
                                `*React with 1️⃣/2️⃣/3️⃣ OR reply with 1/2/3*`;

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

                // Store message ID for reply detection
                const optionsMessageId = sentMsg.key.id;

                // Set up response listener for both reactions and text replies
                const messageListener = async (messageUpdate) => {
                    try {
                        const mekInfo = messageUpdate?.messages[0];
                        if (!mekInfo?.message) return;

                        const isFromSameChat = mekInfo.key.remoteJid === mek.chat;
                        if (!isFromSameChat) return;

                        let selection = null;
                        
                        // Check for reactions
                        if (mekInfo.message.reactionMessage) {
                            const reaction = mekInfo.message.reactionMessage.text;
                            // Get the ID of the message that was reacted to
                            const reactedMessageId = mekInfo.message.reactionMessage.key?.id;
                            
                            // Check if the reaction is for our message
                            if (reactedMessageId === optionsMessageId) {
                                if (reaction === '1️⃣') selection = '1';
                                if (reaction === '2️⃣') selection = '2';
                                if (reaction === '3️⃣') selection = '3';
                            }
                        }
                        
                        // Check for text replies if no valid reaction found
                        if (!selection) {
                            const message = mekInfo.message;
                            const messageText = message.conversation || message.extendedTextMessage?.text || '';
                            
                            // Check if it's a reply to our options message
                            const isReply = message.extendedTextMessage?.contextInfo?.stanzaId === optionsMessageId;
                            
                            // Check if it's a direct message with just 1 or 2 or 3 (not a reply)
                            const isDirectNumber = ['1', '2', '3'].includes(messageText.trim()) && !message.extendedTextMessage?.contextInfo;
                            
                            if ((isReply || isDirectNumber) && ['1', '2', '3'].includes(messageText.trim())) {
                                selection = messageText.trim();
                            }
                        }

                        // If no valid selection found, skip processing
                        if (!selection) return;

                        // Immediately remove listener
                        conn.ev.off('messages.upsert', messageListener);

                        // Start download without waiting for confirmation message
                        const audioPromise = axiosInstance.get(songData.download_url, {
                            responseType: 'arraybuffer',
                            headers: { 
                                Referer: 'https://www.youtube.com/',
                                'Accept-Encoding': 'identity'
                            },
                            timeout: 15000
                        }).then(response => Buffer.from(response.data, 'binary'));

                        // Send "downloading" message and wait for both
                        const [audioBuffer] = await Promise.all([
                            audioPromise,
                            reply("⏳ Downloading your audio...")
                        ]);

                        const fileName = `${(songData.title || videoInfo?.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '')}.mp3`;

                        // Send audio based on user choice
                        if (selection === "1") {
                            await conn.sendMessage(mek.chat, {
                                audio: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                ptt: false,
                                caption: `🎵 *${songData.title || videoInfo?.title || 'Audio'}*\n⏱ ${videoInfo?.timestamp || 'N/A'}\n👤 ${videoInfo?.author?.name || 'Unknown Artist'}`
                            }, { quoted: mek });
                        } else if (selection === "2") {
                            await conn.sendMessage(mek.chat, {
                                document: audioBuffer,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                caption: `📁 *${songData.title || videoInfo?.title || 'Audio'}*\n⏱ ${videoInfo?.timestamp || 'N/A'}\n👤 ${videoInfo?.author?.name || 'Unknown Artist'}`
                            }, { quoted: mek });
                        } else if (selection === "3") {
                            await conn.sendMessage(mek.chat, {
                                audio: audioBuffer,
                                mimetype: 'audio/mp4',
                                ptt: true,
                                caption: `📲 *${songData.title || videoInfo?.title || 'WhatsApp Audio'}*\n⏱ ${videoInfo?.timestamp || 'N/A'}\n👤 ${videoInfo?.author?.name || 'Unknown Artist'}`
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

                // Remove listener after 2 minutes
                setTimeout(() => {
                    conn.ev.off('messages.upsert', messageListener);
                }, 120000);
            }

        } catch (error) {
            console.error('Song Command Error:', error);
            await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
            reply(`❎ Error: ${error.message || 'An unexpected error occurred'}`);
        }
    }
);
