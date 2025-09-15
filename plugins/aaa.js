const { cmd } = require('../command'); const axios = require('axios'); const yts = require('yt-search'); const Config = require('../config');

// Optimized axios instance const axiosInstance = axios.create({ timeout: 20000, maxRedirects: 5, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 'Accept': '/', 'Accept-Encoding': 'identity' } });

// Hector Manuel API configuration const YTMAX_API_URL = 'https://yt-dl.officialhectormanuel.workers.dev/';

// Fetch YouTube video info async function fetchVideoInfo(text) { const isYtUrl = text.match(/(youtube.com|youtu.be)/i); if (isYtUrl) { const videoId = text.match(/(?:youtube.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu.be/)([^"&?/\s]{11})/i)?.[1]; if (!videoId) throw new Error('Invalid YouTube URL format'); const videoInfo = await yts({ videoId }); if (!videoInfo) throw new Error('Could not fetch video info'); return { url: https://youtu.be/${videoId}, info: videoInfo, isUrl: true }; } else { const searchResults = await yts(text); if (!searchResults?.videos?.length) throw new Error('No results found'); const validVideos = searchResults.videos.filter(v => !v.live && v.seconds < 7200 && v.views > 10000); if (!validVideos.length) throw new Error('Only found live streams/unpopular videos'); return { url: validVideos[0].url, info: validVideos[0], isUrl: false, searchQuery: text }; } }

// Fetch YTMAX API data async function fetchYtMaxData(videoUrl) { const apiUrl = ${YTMAX_API_URL}?url=${encodeURIComponent(videoUrl)}; const response = await axiosInstance.get(apiUrl); if (!response.data?.status) throw new Error('Invalid API response'); return response.data; }

// Fetch thumbnail async function fetchThumbnail(url) { if (!url) return null; try { const res = await axiosInstance.get(url, { responseType: 'arraybuffer', timeout: 10000 }); return Buffer.from(res.data, 'binary'); } catch { return null; } }

// Send audio async function sendAudio(conn, chat, audioBuffer, fileName, type, caption, quoted) { const fileSize = Buffer.byteLength(audioBuffer); if (fileSize > 60 * 1024 * 1024) { // ~60MB safety return conn.sendMessage(chat, { text: ❌ File too large (${(fileSize/1024/1024).toFixed(2)} MB). Cannot send. }, { quoted }); }

if (type === 'audio') {
    await conn.sendMessage(chat, { audio: audioBuffer, mimetype: 'audio/mpeg', fileName, ptt: false }, { quoted });
} else if (type === 'document') {
    await conn.sendMessage(chat, { document: audioBuffer, mimetype: 'audio/mpeg', fileName, caption }, { quoted });
} else if (type === 'voice') {
    await conn.sendMessage(chat, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: true }, { quoted });
}

}

cmd( { pattern: 'song', alias: ['ytaudio', 'play'], desc: 'High quality YouTube audio downloader', category: 'media', react: '🎵', use: '<YouTube URL or search query>', filename: __filename, }, async (conn, mek, m, { text, reply }) => { try { if (!text) return reply('🎵 Usage: .song <query/url>');

await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        const videoData = await fetchVideoInfo(text);
        const ytData = await fetchYtMaxData(videoData.url);
        const thumbnailBuffer = await fetchThumbnail(ytData.thumbnail || videoData.info?.thumbnail);

        const caption = `🎶 *SONG DOWNLOADER* 🎶\n\n` +
            `📌 Title: ${ytData.title || videoData.info?.title || 'Unknown'}\n` +
            `😎 Author: ${videoData.info?.author?.name || 'Unknown'}\n` +
            `⏱ Duration: ${videoData.info?.timestamp || 'Unknown'}\n` +
            `👁 Views: ${videoData.info?.views ? videoData.info.views.toLocaleString() : 'Unknown'}\n` +
            `🕒 Published: ${videoData.info?.ago || 'Unknown'}\n` +
            `🔗 URL: ${videoData.url}`;

        const sentMsg = await conn.sendMessage(mek.chat, {
            image: thumbnailBuffer,
            caption,
            footer: '*Choose format:*\n1️⃣ - Audio\n2️⃣ - Document\n3️⃣ - Voice',
        }, { quoted: mek });

        const optionsMessageId = sentMsg.key.id;

        const listener = async (messageUpdate) => {
            try {
                const msg = messageUpdate.messages[0];
                if (!msg?.message) return;
                if (msg.key.remoteJid !== mek.chat) return;

                let selection = null;

                // ✅ Fix: Properly detect reaction to the original message
                if (msg.message.reactionMessage) {
                    const reaction = msg.message.reactionMessage.text;
                    const reactedMsgId = msg.message.reactionMessage.key?.id;
                    if (reactedMsgId === optionsMessageId) {
                        if (reaction === '1️⃣') selection = '1';
                        if (reaction === '2️⃣') selection = '2';
                        if (reaction === '3️⃣') selection = '3';
                    }
                }

                // Detect numeric replies
                if (!selection) {
                    const txt = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                    if (['1', '2', '3'].includes(txt.trim())) selection = txt.trim();
                }

                if (!selection) return;

                // ✅ Clean up listeners once a choice is made
                conn.ev.off('messages.upsert', listener);

                await reply('⏳ Downloading...');

                const audioRes = await axiosInstance.get(ytData.audio, {
                    responseType: 'arraybuffer',
                    headers: {
                        Referer: 'https://www.youtube.com/',
                        Origin: 'https://www.youtube.com',
                        'Accept-Encoding': 'identity'
                    },
                    timeout: 30000
                });

                const audioBuffer = Buffer.from(audioRes.data, 'binary');
                const fileName = `${(ytData.title || videoData.info?.title || 'audio').replace(/[<>:"/\\|?*]+/g, '')}.mp3`;

                let type;
                if (selection === '1') type = 'audio';
                if (selection === '2') type = 'document';
                if (selection === '3') type = 'voice';

                const finalCaption = `🎵 *${ytData.title || 'Audio'}*\n` +
                    `⏱ ${videoData.info?.timestamp || 'N/A'}\n` +
                    `👤 ${videoData.info?.author?.name || 'Unknown'}\n` +
                    `👀 ${videoData.info?.views ? videoData.info.views.toLocaleString() : 'N/A'} views\n` +
                    `🔗 ${videoData.url}\n\n${Config.FOOTER || '> Powered by YTMAX API'}`;

                await sendAudio(conn, mek.chat, audioBuffer, fileName, type, finalCaption, msg);
                await conn.sendMessage(mek.chat, { react: { text: '✅', key: msg.key } });

            } catch (err) {
                console.error('Listener error:', err);
                reply('❌ Error: ' + (err.message || 'Download failed'));
            }
        };

        conn.ev.on('messages.upsert', listener);

        setTimeout(() => conn.ev.off('messages.upsert', listener), 120000);

    } catch (e) {
        console.error('Song Command Error:', e);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        reply(`❎ Error: ${e.message || 'Unexpected error'}`);
    }
}

);

