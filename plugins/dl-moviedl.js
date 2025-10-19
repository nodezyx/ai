const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios instance for movie API
const movieAPI = axios.create({
    baseURL: 'https://api.kingdrax.my.id/api',
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to get content length from URL without downloading
async function getContentLength(url) {
    try {
        const response = await axios.head(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        return parseInt(response.headers['content-length']) || 0;
    } catch (error) {
        console.error('Error getting content length:', error.message);
        return 0;
    }
}

cmd(
    {
        pattern: 'movie',
        alias: ['film', 'cinema'],
        desc: 'Search and stream movies directly',
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
            const searchUrl = `/Movie?query=${encodeURIComponent(text)}`;
            
            const response = await movieAPI.get(searchUrl);
            const data = response.data;

            if (!data || data.STATUS !== 200 || !data.download_link) {
                return reply('❌ No movies found or download link unavailable');
            }

            // Extract movie information
            const movieTitle = data.title || 'Unknown Movie';
            const movieDescription = data.description || 'No description available';
            const downloadUrl = data.download_link;
            const creator = data.CREATOR || 'Unknown';

            // Get file size information
            const fileSize = await getContentLength(downloadUrl);
            const formattedSize = formatFileSize(fileSize);

            // Create information message
            let infoMessage = `🎬 *${movieTitle}*\n\n`;
            infoMessage += `📝 *Description:* ${movieDescription}\n\n`;
            infoMessage += `💾 *Size:* ${formattedSize}\n`;
            infoMessage += `👨‍💻 *Source:* ${creator}\n\n`;
            
            // Check if file is too large for WhatsApp
            const MAX_WHATSAPP_SIZE = 100 * 1024 * 1024; // 100MB limit for documents
            if (fileSize > MAX_WHATSAPP_SIZE) {
                infoMessage += `⚠️ *Note:* This file is too large for WhatsApp (${formattedSize})\n`;
                infoMessage += `🔗 *Direct Download:* ${downloadUrl}\n\n`;
            } else {
                infoMessage += `⏳ *Preparing to stream...*\n\n`;
            }
            
            infoMessage += `> ${Config.FOOTER}`;

            // Send movie information
            await reply(infoMessage);

            // If file is too large, don't attempt to stream
            if (fileSize > MAX_WHATSAPP_SIZE) {
                return;
            }

            // Send streaming message
            const streamingMsg = await reply('🎥 *Streaming movie...*\n\nThis may take a few moments depending on file size and connection speed.');

            try {
                // Create a stream from the download URL
                const videoStream = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'stream',
                    timeout: 0, // No timeout for streaming
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Range': 'bytes=0-', // Ensure we can stream partial content
                    }
                });

                // Extract filename from URL or use movie title
                let fileName = 'movie.mp4';
                try {
                    const urlPath = new URL(downloadUrl).pathname;
                    fileName = urlPath.split('/').pop() || 'movie.mp4';
                    // Clean up filename
                    fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                    if (!fileName.includes('.')) fileName += '.mp4';
                } catch (e) {
                    fileName = `${movieTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
                }

                // Stream directly to WhatsApp
                await conn.sendMessage(mek.chat, {
                    document: videoStream.data,
                    fileName: fileName.substring(0, 60), // Limit filename length
                    mimetype: 'video/mp4',
                    caption: `✅ *${movieTitle}*\n\nStreamed successfully! 🎬\n\n> ${Config.FOOTER}`
                }, { quoted: mek });

                // Delete the streaming message
                try {
                    await conn.sendMessage(mek.chat, {
                        delete: streamingMsg.key
                    });
                } catch (deleteError) {
                    console.error("Failed to delete streaming message:", deleteError);
                }

                // Send success reaction
                try {
                    if (mek?.key?.id) {
                        await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });
                    }
                } catch (reactError) {
                    console.error('Success reaction failed:', reactError);
                }

            } catch (streamError) {
                console.error('Streaming error:', streamError);
                
                // Fallback: provide download link if streaming fails
                await reply(`❌ *Streaming Failed*\n\nError: ${streamError.message}\n\n🔗 *Direct Download Link:*\n${downloadUrl}\n\nYou can download it directly from the link above.`);
                
                try {
                    if (mek?.key?.id) {
                        await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
                    }
                } catch (reactError) {
                    console.error('Error reaction failed:', reactError);
                }
            }

        } catch (error) {
            console.error('Movie command error:', error);
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

// Additional command to check movie API status
cmd(
    {
        pattern: 'moviestatus',
        desc: 'Check movie API status',
        category: 'download',
        react: '📊',
        filename: __filename,
    },
    async (conn, mek, m, { reply }) => {
        try {
            const testResponse = await movieAPI.get('/Movie?query=test');
            reply(`🎬 Movie API Status: ${testResponse.data.STATUS || 'Unknown'}\n\nAPI is working correctly!`);
        } catch (error) {
            reply(`❌ Movie API Error: ${error.message}`);
        }
    }
);
