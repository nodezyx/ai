const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// API Configuration
const API = {
  baseUrl: 'https://kaiz-apis.gleeze.com/api',
  apikey: 'cf2ca612-296f-45ba-abbc-473f18f991eb'
};

// Axios instance with timeout
const axiosInstance = axios.create({ 
  timeout: 15000,
  headers: { 'User-Agent': 'WhatsAppBot/1.0' }
});

// Helper function for API requests
async function fetchAPI(endpoint, params) {
  const url = `${API.baseUrl}/${endpoint}?${new URLSearchParams(params)}&apikey=${API.apikey}`;
  const response = await axiosInstance.get(url);
  return response.data;
}

// YouTube Audio Downloader (play2)
cmd({
    pattern: 'play2',
    desc: 'Download audio from YouTube (API v1)',
    category: 'media',
    react: '🎵',
    use: '<YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎵 *Usage:* .play2 <YouTube URL>');
        
        const data = await fetchAPI('ytdown-mp3', { url: text });
        
        await conn.sendMessage(m.chat, { 
            audio: { url: data.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${data.title}.mp3`.replace(/[<>:"\/\\|?*]+/g, ''),
            caption: `🎧 *${data.title}*\n👤 ${data.author}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download audio: ' + (error.message || 'Try again later'));
    }
});

// YouTube Audio Downloader (play3)
cmd({
    pattern: 'playy3',
    desc: 'Download audio from YouTube (API v2)',
    category: 'media',
    react: '🎵',
    use: '<YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎵 *Usage:* .play3 <YouTube URL>');
        
        const data = await fetchAPI('ytmp3-v2', { url: text });
        
        await conn.sendMessage(m.chat, { 
            audio: { url: data.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${data.title}.mp3`.replace(/[<>:"\/\\|?*]+/g, ''),
            caption: `🎧 *${data.title}*\n👤 ${data.author}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download audio: ' + (error.message || 'Try again later'));
    }
});

// Twitter/X Video Downloader
cmd({
    pattern: 'twitterdl',
    alias: ['xdownload','twitter'],
    desc: 'Download videos from Twitter/X',
    category: 'media',
    react: '🐦',
    use: '<Twitter/X URL>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🐦 *Usage:* .twitterdl <Twitter/X URL>');
        
        const data = await fetchAPI('twitter-xdl', { url: text });
        
        if (!data.downloadLinks || !data.downloadLinks[0]?.link) {
            return reply('❌ No downloadable links found');
        }

        // Send highest quality available
        const videoLink = data.downloadLinks.find(link => link.quality.includes('HD')) || data.downloadLinks[0];
        
        await conn.sendMessage(m.chat, {
            video: { url: videoLink.link },
            caption: `🐦 *Twitter Video*\n${videoLink.quality}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download video: ' + (error.message || 'Try again later'));
    }
});

// SoundCloud Search
cmd({
    pattern: 'soundcloudsearch',
    alias: ['scsearch','soundcloud'],
    desc: 'Search SoundCloud tracks',
    category: 'media',
    react: '🎶',
    use: '<search query>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎶 *Usage:* .soundcloud <search query>');
        
        const data = await fetchAPI('soundcloud-search', { title: text });
        
        if (!data.results || !data.results.length) {
            return reply('❌ No results found');
        }

        let resultText = '🎶 *SoundCloud Results*\n\n';
        data.results.slice(0, 5).forEach((track, i) => {
            resultText += `${i+1}. *${track.title}* - ${track.artist}\n`;
            resultText += `   ⏱ ${track.duration} | 👂 ${track.plays} | 📅 ${track.uploaded}\n`;
            resultText += `   🔗 ${track.url}\n\n`;
        });
        
        resultText += `\n> ${Config.FOOTER}`;
        
        await reply(resultText);

    } catch (error) {
        console.error(error);
        reply('❌ Failed to search: ' + (error.message || 'Try again later'));
    }
});

// SoundCloud Downloader
cmd({
    pattern: 'soundclouddl',
    desc: 'Download SoundCloud tracks',
    category: 'media',
    react: '🎶',
    use: '<SoundCloud URL>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎶 *Usage:* .scdl <SoundCloud URL>');
        
        const data = await fetchAPI('soundcloud-dl', { url: text });
        
        await conn.sendMessage(m.chat, {
            audio: { url: data.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${data.title}.mp3`.replace(/[<>:"\/\\|?*]+/g, ''),
            caption: `🎶 *${data.title}*\n👤 ${data.username}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download: ' + (error.message || 'Try again later'));
    }
});

// Spotify Search
cmd({
    pattern: 'spotifysearch',
    alias: ['spsearch','spotify'],
    desc: 'Search Spotify tracks',
    category: 'media',
    react: '🎧',
    use: '<search query>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎧 *Usage:* .spotify <search query>');
        
        const data = await fetchAPI('spotify-search', { q: text });
        
        if (!data.length) {
            return reply('❌ No results found');
        }

        let resultText = '🎧 *Spotify Results*\n\n';
        data.slice(0, 5).forEach((track, i) => {
            resultText += `${i+1}. *${track.title}* \n`;
            resultText += `   ⏱ ${track.duration} | 📅 ${track.release_date}\n`;
            resultText += `   🔗 ${track.trackUrl}\n\n`;
        });
        
        resultText += `\n> ${Config.FOOTER}`;
        
        await reply(resultText);

    } catch (error) {
        console.error(error);
        reply('❌ Failed to search: ' + (error.message || 'Try again later'));
    }
});

// Spotify Downloader
cmd({
    pattern: 'spotifydl',
    alias: ['spdl','spotifydownload'],
    desc: 'Download Spotify tracks',
    category: 'media',
    react: '🎧',
    use: '<Spotify URL>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🎧 *Usage:* .spotifydl <Spotify URL>');
        
        const data = await fetchAPI('spotify-down', { url: text });
        
        await conn.sendMessage(m.chat, {
            audio: { url: data.url },
            mimetype: 'audio/mpeg',
            fileName: `${data.title}.mp3`.replace(/[<>:"\/\\|?*]+/g, ''),
            caption: `🎧 *${data.title}*\n👤 ${data.artist}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download: ' + (error.message || 'Try again later'));
    }
});

// Apple Music Downloader
cmd({
    pattern: 'applemusic',
    alias: ['amdl'],
    desc: 'Download from Apple Music',
    category: 'media',
    react: '🍎',
    use: '<search query>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🍎 *Usage:* .applemusic <search query>');
        
        const data = await fetchAPI('apple-music', { search: text });
        
        if (!data.response || !data.response.length) {
            return reply('❌ No results found');
        }

        const track = data.response[0];
        
        await conn.sendMessage(m.chat, {
            audio: { url: track.previewMp3 },
            mimetype: 'audio/mp4',
            fileName: `${track.title}.m4a`.replace(/[<>:"\/\\|?*]+/g, ''),
            caption: `🍎 *${track.title}*\n👤 ${track.artist}\n📅 ${track.releaseDate}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download: ' + (error.message || 'Try again later'));
    }
});

// Snapchat Downloader
cmd({
    pattern: 'snapchat',
    alias: ['snapdl'],
    desc: 'Download Snapchat spotlight videos',
    category: 'media',
    react: '👻',
    use: '<Snapchat URL>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('👻 *Usage:* .snapchat <Snapchat URL>');
        
        const data = await fetchAPI('snapchat-dl', { url: text });
        
        if (!data.url) {
            return reply('❌ No downloadable content found');
        }

        await conn.sendMessage(m.chat, {
            video: { url: data.url },
            caption: `👻 *Snapchat Spotlight*\n${data.title || ''}\n\n> ${Config.FOOTER}`
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('❌ Failed to download: ' + (error.message || 'Try again later'));
    }
});

// Recipe Finder
cmd({
    pattern: 'recipe',
    desc: 'Find recipes by ingredients',
    category: 'utilities',
    react: '🍳',
    use: '<ingredients>',
    filename: __filename
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) return reply('🍳 *Usage:* .recipe <ingredients>');
        
        const data = await fetchAPI('recipe', { ingredients: text });
        
        if (!data.recipe) {
            return reply('❌ No recipes found');
        }

        // Split long recipe into multiple messages if needed
        const maxLength = 1500;
        if (data.recipe.length > maxLength) {
            for (let i = 0; i < data.recipe.length; i += maxLength) {
                await reply(data.recipe.substring(i, i + maxLength));
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else {
            await reply(data.recipe);
        }

    } catch (error) {
        console.error(error);
        reply('❌ Failed to find recipes: ' + (error.message || 'Try again later'));
    }
});
