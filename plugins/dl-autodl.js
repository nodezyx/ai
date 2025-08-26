const axios = require('axios');
const { cmd } = require('../command');

const activeGroups = new Set();

const APIs = {
    primary: "https://dev-priyanshi.onrender.com/api/alldl?url=",
    backup: "http://46.247.108.38:6116/allLink?link="
};

function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

async function downloadWithPrimaryApi(url) {
    try {
        const response = await axios.get(`${APIs.primary}${encodeURIComponent(url)}`, { timeout: 30000 });
        return response.data;
    } catch (error) {
        console.error('Primary API error:', error);
        throw error;
    }
}

async function downloadWithBackupApi(url) {
    try {
        const response = await axios.get(`${APIs.backup}${encodeURIComponent(url)}`, { timeout: 30000 });
        return response.data;
    } catch (error) {
        console.error('Backup API error:', error);
        throw error;
    }
}

async function processDownload(conn, m, url, reply) {
    try {
        let data;
        try {
            data = await downloadWithPrimaryApi(url);
        } catch (error) {
            console.log('Primary API failed, trying backup API...');
            data = await downloadWithBackupApi(url);
        }

        if (!data || !data.success) {
            console.log('Download API failed for URL:', url);
            return false;
        }

        const downloadUrl = data.download_url || data.downloadUrl || data.url;
        
        if (!downloadUrl) {
            console.log('No download URL found in API response');
            return false;
        }

        const mediaResponse = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer',
            timeout: 60000 
        });
        
        // Determine media type and send appropriate message
        if (data.type === 'video' || downloadUrl.includes('.mp4') || downloadUrl.includes('.mov')) {
            await conn.sendMessage(m.from, {
                video: Buffer.from(mediaResponse.data),
                caption: `📹 *Title:* ${data.video_title || data.title || 'Video'}\n📱 *Platform:* ${data.platform || 'Unknown'}\n\n⬇️ Auto-Downloaded`
            });
        } else if (data.type === 'audio' || downloadUrl.includes('.mp3') || downloadUrl.includes('.m4a')) {
            await conn.sendMessage(m.from, {
                audio: Buffer.from(mediaResponse.data),
                mimetype: 'audio/mpeg',
                caption: `🎵 *Title:* ${data.video_title || data.title || 'Audio'}\n📱 *Platform:* ${data.platform || 'Unknown'}\n\n⬇️ Auto-Downloaded`
            });
        } else {
            // Default to video
            await conn.sendMessage(m.from, {
                video: Buffer.from(mediaResponse.data),
                caption: `📹 *Title:* ${data.video_title || data.title || 'Media'}\n📱 *Platform:* ${data.platform || 'Unknown'}\n\n⬇️ Auto-Downloaded`
            });
        }

        return true;
        
    } catch (error) {
        console.error('Download error:', error);
        return false;
    }
}

// Auto-download handler for messages containing URLs
cmd({
    on: "text"
}, async (conn, mek, m, {
    from,
    body,
    sender,
    isGroup,
    isBotAdmins,
    isAdmins,
    reply
}) => {
    try {
        // Prevent bot from responding to its own messages or commands
        if (!body || mek.key.fromMe || body.startsWith('.')) return;

        const urls = extractUrls(body);
        
        if (urls.length > 0) {
            // Only process the first URL to avoid spam
            const url = urls[0];
            
            // Show that we're processing
            await conn.sendPresenceUpdate('composing', from);
            
            // Send processing message
            const processingMsg = await reply('🔗 Link detected! ⏳ Downloading...');
            
            const success = await processDownload(conn, m, url, reply);
            
            if (success) {
                // Delete processing message after successful download
                await conn.sendMessage(from, { delete: processingMsg.key });
            } else {
                // Update processing message if failed
                await conn.sendMessage(from, { 
                    text: '❌ Failed to download from this link. It might be unsupported.',
                }, { edit: processingMsg.key });
            }
        }
    } catch (error) {
        console.error('Auto-download error:', error);
    }
});

// Media message handler (for direct media links)
cmd({
    on: "media"
}, async (conn, mek, m, {
    from,
    body,
    sender,
    isGroup,
    isBotAdmins,
    isAdmins,
    reply
}) => {
    try {
        // Check if media message has a caption with URL
        const caption = mek.message?.imageMessage?.caption || 
                       mek.message?.videoMessage?.caption ||
                       mek.message?.documentMessage?.caption ||
                       '';

        const urls = extractUrls(caption);
        
        if (urls.length > 0) {
            // Only process the first URL to avoid spam
            const url = urls[0];
            
            // Show that we're processing
            await conn.sendPresenceUpdate('composing', from);
            
            // Send processing message
            const processingMsg = await reply('🔗 Link detected in media caption! ⏳ Downloading...');
            
            const success = await processDownload(conn, m, url, reply);
            
            if (success) {
                // Delete processing message after successful download
                await conn.sendMessage(from, { delete: processingMsg.key });
            } else {
                // Update processing message if failed
                await conn.sendMessage(from, { 
                    text: '❌ Failed to download from this link.',
                }, { edit: processingMsg.key });
            }
        }
    } catch (error) {
        console.error('Media auto-download error:', error);
    }
});

// Simple status command to check if auto-download is working
cmd({
    pattern: "dlstatus",
    alias: ["downloadstatus"],
    desc: "Check if auto-download is active",
    category: "download",
    filename: __filename,
    react: "📊"
}, async (conn, mek, m, { from, reply }) => {
    await reply(
        `📥 *Auto-Download Status*\n\n` +
        `✅ Auto-download is ACTIVE\n` +
        `I will automatically detect and download media from links in messages.\n\n` +
        `*Supported Platforms:*\n` +
        `YouTube, Facebook, Instagram, Twitter, TikTok, etc.`
    );
});

module.exports = {
    extractUrls,
    processDownload
};
