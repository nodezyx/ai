const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "song4",
    alias: ["music4", "play4"],
    react: "🎵",
    desc: "Download high quality YouTube audio",
    category: "download",
    use: "<song name or YouTube link>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube link");

        // Get YouTube URL from query if needed
        let videoUrl = q;
        if (!q.match(/(youtube\.com|youtu\.be)/)) {
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ No videos found");
            videoUrl = search.videos[0].url;
        }

        await reply("⬇️ Downloading audio...");

        // API request
        const apiUrl = `https://api.giftedtech.web.id/api/download/yta?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.result?.download_url) {
            return reply("❌ Failed to get download URL");
        }

        // Send as document for better quality
        await conn.sendMessage(from, {
            document: { url: data.result.download_url },
            fileName: `${data.result.title.replace(/[^\w\s.-]/g, '')}.mp3`,
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: data.result.title,
                    body: `Quality: ${data.result.quality} | Duration: ${data.result.duration}`,
                    thumbnail: await axios.get(data.result.thumbnail, { 
                        responseType: 'arraybuffer' 
                    }).then(res => res.data).catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Song download error:", error);
        reply(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
});




cmd({
    pattern: "song5",
    alias: ["music5", "play5", "ytmp3-5"],
    react: "🎵",
    desc: "Download YouTube audio (multiple quality options)",
    category: "download",
    use: "<song name/URL> [quality: high/medium/low]",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name or YouTube URL\nExample: !song lily by alan walker high");

        // Extract quality preference if provided
        const [query, qualityPref] = q.split(/\s+(high|medium|low)$/i);
        const searchQuery = query || q;
        const quality = qualityPref ? qualityPref.toLowerCase() : 'high';

        // Get YouTube URL
        let videoUrl = searchQuery;
        if (!searchQuery.match(/(youtube\.com|youtu\.be)/)) {
            const search = await yts(searchQuery);
            if (!search.videos.length) return reply("❌ No videos found");
            videoUrl = search.videos[0].url;
        }

        await reply(`⬇️ Downloading ${quality} quality audio...`);

        // Try both API endpoints with fallback
        let apiResponse;
        try {
            // First try the YTA endpoint (higher quality)
            const apiUrl = `https://api.giftedtech.web.id/api/download/${
                quality === 'high' ? 'yta' : 'ytmp3'
            }?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
            
            const { data } = await axios.get(apiUrl, { timeout: 15000 });
            apiResponse = data;
        } catch (e) {
            // Fallback to YTMP3 if YTA fails
            const fallbackUrl = `https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
            const { data } = await axios.get(fallbackUrl, { timeout: 15000 });
            apiResponse = data;
        }

        if (!apiResponse?.result?.download_url) {
            return reply("❌ Failed to get download link from API");
        }

        // Get file extension from URL or default to mp3
        const fileExt = apiResponse.result.download_url.split('.').pop().split(/[?#]/)[0] || 'mp3';
        
        // Send audio file
        await conn.sendMessage(from, {
            document: { 
                url: apiResponse.result.download_url 
            },
            fileName: `${apiResponse.result.title.replace(/[^\w\s.-]/g, '')}.${fileExt}`,
            mimetype: fileExt === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: apiResponse.result.title,
                    body: `Quality: ${apiResponse.result.quality} | Via Subzero API`,
                    thumbnail: await axios.get(apiResponse.result.thumbnail, { 
                        responseType: 'arraybuffer' 
                    }).then(res => res.data).catch(() => null),
                    mediaType: 2,
                    mediaUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Download error:", error);
        reply(`❌ Error: ${error.message}\nPlease try again later`);
    }
});
