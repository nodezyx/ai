const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// API Configuration
const API = {
  baseUrl: 'https://kaiz-apis.gleeze.com/api',
  apikey: 'cf2ca612-296f-45ba-abbc-473f18f991eb'
};

// Axios instance
const axiosInstance = axios.create({ 
  timeout: 15000,
  headers: { 'User-Agent': 'WhatsAppBot/1.0' }
});

cmd({
    pattern: 'fast',
    alias: ['bolt', 'spdl3'],
    desc: 'Download Spotify tracks (supports URL or search)',
    category: 'media',
    react: '⌛',
    use: '<URL or search query>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎧 *Usage:* .spotify2 <query/url>\nExample: .spotify2 https://open.spotify.com/track/0lks2Kt9veMOFEAPN0fsqN\n.spotify2 Lily Alan Walker');

        // Safely send reaction
        try {
            if (mek?.key?.id) {
                await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });
            }
        } catch (reactError) {
            console.error('Failed to send reaction:', reactError);
        }

        let trackData, trackUrl;
        
        // Check if input is a Spotify URL
        if (text.match(/open\.spotify\.com\/track\/|spotify:track:/)) {
            trackUrl = text;
            const searchData = await fetchAPI('spotify-search', { q: text });
            trackData = searchData.find(track => track.trackUrl.includes(text.split('/').pop()));
        } else {
            // Search functionality
            const searchData = await fetchAPI('spotify-search', { q: text });
            if (!searchData || !searchData.length) return reply('🎧 No results found for your search');
            trackData = searchData[0];
            trackUrl = trackData.trackUrl;
        }

        // Get download URL
        const dlData = await fetchAPI('spotify-down', { url: trackUrl });
        if (!dlData.url) return reply('🎧 Failed to fetch download link');

        // Get thumbnail
        let thumbnailBuffer;
        try {
            if (trackData.thumbnail) {
                const response = await axiosInstance.get(trackData.thumbnail, { responseType: 'arraybuffer' });
                thumbnailBuffer = Buffer.from(response.data, 'binary');
            }
        } catch (e) {
            console.error('Failed to fetch thumbnail:', e);
        }

        const trackInfo = `🎧 *${trackData.title || 'Unknown Title'}*\n` +
                        `👤 Mr Frank OFC\n` +
                        `⏱ ${trackData.duration || 'N/A'} | 📅 ${trackData.release_date || 'Unknown'}\n\n` +
                        `🔗 ${trackUrl}\n\n` +
                        `\`Reply with:\`\n` +
                        `1 - For Audio Format 🎵\n` +
                        `2 - For Document Format 📁\n\n` +
                        `> ${Config.FOOTER}`;

        const sentMsg = await conn.sendMessage(mek.chat, {
            image: thumbnailBuffer,
            caption: trackInfo,
            contextInfo: {
                externalAdReply: {
                    title: trackData.title || 'Spotify Track',
                    body: `Artist: Mr Frank OFC`,
                    thumbnail: thumbnailBuffer,
                    mediaType: 1,
                    mediaUrl: trackUrl,
                    sourceUrl: trackUrl
                }
            }
        }, { quoted: mek });

        // Timeout after 60 seconds
        const timeout = setTimeout(() => {
            conn.ev.off('messages.upsert', messageListener);
            reply("⌛ Session timed out. Please use the command again if needed.");
        }, 60000);

        const messageListener = async (messageUpdate) => {
            try {
                const mekInfo = messageUpdate?.messages[0];
                if (!mekInfo?.message) return;

                const message = mekInfo.message;
                const messageType = message.conversation || message.extendedTextMessage?.text;
                const isReplyToSentMsg = message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

                if (!isReplyToSentMsg || !['1', '2'].includes(messageType?.trim())) return;

                // Remove listener and timeout
                conn.ev.off('messages.upsert', messageListener);
                clearTimeout(timeout);

                const processingMsg = await reply("⏳ Processing your request...");
                
                const audioResponse = await axiosInstance.get(dlData.url, {
                    responseType: 'arraybuffer'
                });
                const audioBuffer = Buffer.from(audioResponse.data, 'binary');

                const fileName = `${trackData.title || 'spotify_track'}.mp3`.replace(/[<>:"\/\\|?*]+/g, '');

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

                try {
                    if (mekInfo?.key?.id) {
                        await conn.sendMessage(mek.chat, { react: { text: "✅", key: mekInfo.key } });
                    }
                } catch (reactError) {
                    console.error('Failed to send success reaction:', reactError);
                }

            } catch (error) {
                console.error('Error in listener:', error);
                await reply('🎧 Error processing your request: ' + (error.message || 'Please try again'));
                
                try {
                    if (mek?.key?.id) {
                        await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
                    }
                } catch (reactError) {
                    console.error('Failed to send error reaction:', reactError);
                }
            }
        };

        conn.ev.on('messages.upsert', messageListener);

    } catch (error) {
        console.error('Error:', error);
        try {
            if (mek?.key?.id) {
                await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            }
        } catch (reactError) {
            console.error('Failed to send error reaction:', reactError);
        }
        reply('🎧 Error: ' + (error.message || 'Please try again later'));
    }
});

// Helper function for API requests
async function fetchAPI(endpoint, params) {
  const url = `${API.baseUrl}/${endpoint}?${new URLSearchParams(params)}&apikey=${API.apikey}`;
  const response = await axiosInstance.get(url);
  return response.data;
}
