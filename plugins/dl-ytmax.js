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
    alias: ['ytpro', 'ytdl', 'downloadmax'],
    desc: 'High quality YouTube downloader with multiple options',
    category: 'download',
    react: '🎬',
    use: '<YouTube URL or search query>',
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('🎬 `YouTube Pro Downloader`\n\n' +
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

        // Debug: Log available qualities
        console.log('Available video qualities:', ytData.videos ? Object.keys(ytData.videos) : 'None');

        // Fetch thumbnail
        const thumbnailBuffer = await fetchThumbnail(ytData.thumbnail || videoInfo?.thumbnail);

        // Check if button interface should be used
        const useButtons = Config.BUTTON === true || Config.BUTTON === "true";

        if (useButtons) {
            // Button-based interface
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Prepare caption
            let caption = `🎬 \`YouTube Pro Downloader\`🎬\n\n` +
                         `📌 *Title:* ${ytData.title || videoInfo?.title || 'Unknown'}\n` +
                         `👤 *Channel:* ${videoInfo?.author?.name || 'Unknown'}\n` +
                         `⏱️ *Duration:* ${videoInfo?.timestamp || 'Unknown'}\n` +
                         `👀 *Views:* ${videoInfo?.views?.toLocaleString() || 'Unknown'}\n`;
            
            if (!isUrl) {
                caption += `🔍 *Searched:* "${searchQuery}"\n`;
            }
            
            caption += `\n📊 *Available Qualities:*\n` +
                      `🎵 Audio • 🎥 144p-1080p\n\n` +
                      `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;

            // Create buttons for all available options
            let buttons = [
                {
                    buttonId: `ytmax-audio-${sessionId}`,
                    buttonText: { displayText: '🎵 Audio MP3' },
                    type: 1
                }
            ];

            // Add video quality buttons
            const qualityOrder = ['1080', '720', '480', '360', '240', '144']; // Highest quality first
            
            qualityOrder.forEach(quality => {
                // Check if the quality exists in the videos object
                if (ytData.videos && ytData.videos[quality] && ytData.videos[quality] !== '') {
                    buttons.push({
                        buttonId: `ytmax-video-${quality}-${sessionId}`,
                        buttonText: { displayText: `🎥 ${quality}p` },
                        type: 1
                    });
                }
            });

            // Ensure we don't exceed button limits but prioritize higher qualities
            const maxButtons = 6;
            let finalButtons = buttons;
            
            if (buttons.length > maxButtons) {
                // Keep audio button and highest quality video buttons
                finalButtons = [
                    buttons[0], // Audio button
                    ...buttons.slice(1, maxButtons) // Highest quality video buttons
                ];
            }

            // Create buttons message
            const buttonsMessage = {
                image: thumbnailBuffer,
                caption: caption,
                footer: Config.FOOTER || 'Select download option • Mr Frank',
                buttons: finalButtons,
                headerType: 1,
                contextInfo: {
                    externalAdReply: {
                        title: ytData.title || 'Subzero YT Downloader',
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

            // Store API data for later use
            const apiData = {
                ytData,
                videoInfo,
                videoUrl,
                isUrl,
                searchQuery
            };

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
                                mediaUrl = apiData.ytData.audio;
                                fileName = `${(apiData.ytData.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '')}.mp3`;
                                mediaType = 'audio';
                                qualityText = 'Audio MP3';
                            } else if (buttonId.startsWith(`ytmax-video-`)) {
                                // Video download - extract quality
                                const qualityMatch = buttonId.match(/ytmax-video-(\d+)-/);
                                if (qualityMatch && qualityMatch[1]) {
                                    const quality = qualityMatch[1];
                                    mediaUrl = apiData.ytData.videos[quality];
                                    fileName = `${(apiData.ytData.title || 'video').replace(/[<>:"\/\\|?*]+/g, '')}_${quality}p.mp4`;
                                    mediaType = 'video';
                                    qualityText = `${quality}p Video`;
                                }
                            }

                            if (!mediaUrl) {
                                throw new Error('Selected option not available');
                            }

                            // Download media
                            await reply(`🔄 _Downloading ${qualityText}_ `);
                            
                            const mediaBuffer = await downloadMedia(mediaUrl);

                            // Prepare final caption
                            let finalCaption = `🎬 *${apiData.ytData.title || 'Media'}*\n\n` +
                                             `📊 *Quality:* ${qualityText}\n` +
                                             `⏱️ *Duration:* ${apiData.videoInfo?.timestamp || 'N/A'}\n` +
                                             `👀 *Views:* ${apiData.videoInfo?.views?.toLocaleString() || 'N/A'}\n`;
                            
                            if (!apiData.isUrl) {
                                finalCaption += `🔍 *Searched:* "${apiData.searchQuery}"\n\n`;
                            }
                            
                            finalCaption += `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;

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

        } else {
            // Text-based interface
            // Prepare quality options message
            let qualityOptions = `🎬 \`YouTube Pro Downloader\` 🎬\n\n` +
                               `📌 *Title:* ${ytData.title || videoInfo?.title || 'Unknown'}\n` +
                               `👤 *Channel:* ${videoInfo?.author?.name || 'Unknown'}\n` +
                               `⏱️ *Duration:* ${videoInfo?.timestamp || 'Unknown'}\n` +
                               `👀 *Views:* ${videoInfo?.views?.toLocaleString() || 'Unknown'}\n`;
            
            if (!isUrl) {
                qualityOptions += `🔍 *Searched:* "${searchQuery}"\n`;
            }
            
            qualityOptions += `\n📊 *Available Download Options:*\n\n` +
                            `🎵 *Audio Options:*\n` +
                            `1 - MP3 Audio\n\n` +
                            `🎥 *Video Options:*\n`;

            // Add video quality options
            const qualityOrder = ['1080', '720', '480', '360', '240', '144'];
            let qualityNumber = 2; // Start from 2 since 1 is for audio
            
            qualityOrder.forEach(quality => {
                if (ytData.videos && ytData.videos[quality] && ytData.videos[quality] !== '') {
                    qualityOptions += `${qualityNumber} - ${quality}p Video\n`;
                    qualityNumber++;
                }
            });

            qualityOptions += `\n💡 *Reply with the number of your choice*\n\n` +
                            `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;

            // Send quality options message
            const sentMsg = await conn.sendMessage(mek.chat, {
                image: thumbnailBuffer,
                caption: qualityOptions,
                contextInfo: {
                    externalAdReply: {
                        title: ytData.title || 'Subzero YT Downloader',
                        body: `Duration: ${videoInfo?.timestamp || 'N/A'} • Views: ${videoInfo?.views?.toLocaleString() || 'N/A'}`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 1,
                        mediaUrl: videoUrl,
                        sourceUrl: videoUrl
                    }
                }
            }, { quoted: mek });

            // Create quality mapping
            const qualityMap = {};
            let currentNumber = 1;
            
            // Audio option
            qualityMap[currentNumber] = { type: 'audio', quality: 'mp3' };
            currentNumber++;
            
            // Video options
            qualityOrder.forEach(q => {
                if (ytData.videos && ytData.videos[q] && ytData.videos[q] !== '') {
                    qualityMap[currentNumber] = { type: 'video', quality: q };
                    currentNumber++;
                }
            });

            // Response listener for text interface
            const messageListener = async (messageUpdate) => {
                try {
                    const mekInfo = messageUpdate?.messages[0];
                    if (!mekInfo?.message) return;

                    const message = mekInfo.message;
                    const messageText = message.conversation || message.extendedTextMessage?.text;
                    const isReplyToSentMsg = message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
                    const isValidNumber = messageText && !isNaN(messageText) && qualityMap[parseInt(messageText)];

                    if (!isReplyToSentMsg || !isValidNumber) return;

                    // Remove listener
                    conn.ev.off('messages.upsert', messageListener);

                    const selectedOption = qualityMap[parseInt(messageText)];
                    let mediaUrl, fileName, mediaType, qualityText;

                    if (selectedOption.type === 'audio') {
                        mediaUrl = ytData.audio;
                        fileName = `${(ytData.title || 'audio').replace(/[<>:"\/\\|?*]+/g, '')}.mp3`;
                        mediaType = 'audio';
                        qualityText = 'Audio MP3';
                    } else {
                        mediaUrl = ytData.videos[selectedOption.quality];
                        fileName = `${(ytData.title || 'video').replace(/[<>:"\/\\|?*]+/g, '')}_${selectedOption.quality}p.mp4`;
                        mediaType = 'video';
                        qualityText = `${selectedOption.quality}p Video`;
                    }

                    // Download media
                    await reply(`🔄 _Downloading ${qualityText}_ `);
                    
                    const mediaBuffer = await downloadMedia(mediaUrl);

                    // Prepare final caption
                    let finalCaption = `🎬 *${ytData.title || 'Media'}*\n\n` +
                                     `📊 *Quality:* ${qualityText}\n` +
                                     `⏱️ *Duration:* ${videoInfo?.timestamp || 'N/A'}\n` +
                                     `👀 *Views:* ${videoInfo?.views?.toLocaleString() || 'N/A'}\n`;
                    
                    if (!isUrl) {
                        finalCaption += `🔍 *Searched:* "${searchQuery}"\n\n`;
                    }
                    
                    finalCaption += `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;

                    // Send media
                    if (mediaType === 'audio') {
                        await conn.sendMessage(mek.chat, {
                            audio: mediaBuffer,
                            mimetype: 'audio/mpeg',
                            fileName: fileName,
                            ptt: false
                        }, { quoted: mek });
                    } else {
                        await conn.sendMessage(mek.chat, {
                            video: mediaBuffer,
                            caption: finalCaption,
                            fileName: fileName
                        }, { quoted: mek });
                    }

                    await conn.sendMessage(mek.chat, { react: { text: '✅', key: mekInfo.key } });

                } catch (error) {
                    console.error('Download Error:', error);
                    await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
                    reply(`❌ Error: ${error.message || 'Download failed'}`);
                }
            };

            // Add listener
            conn.ev.on('messages.upsert', messageListener);

            // Remove listener after 3 minutes
            setTimeout(() => {
                conn.ev.off('messages.upsert', messageListener);
            }, 180000);
        }

    } catch (error) {
        console.error('YTMAX Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error: ${error.message || 'Failed to process request'}`);
    }
});
