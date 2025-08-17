const { cmd } = require('../command');

cmd({
    on: "message"
}, async (conn, mek, m, { from, isGroup }) => {
    try {
        // Check if message is viewOnce
        if (m.message?.viewOnceMessage) {
            const viewOnceContent = m.message.viewOnceMessage.message;
            const messageType = Object.keys(viewOnceContent)[0];
            
            // Download the media
            const buffer = await conn.downloadMediaMessage(m);
            
            // Prepare message based on type
            let forwardContent = {};
            switch (messageType) {
                case 'imageMessage':
                    forwardContent = { image: buffer };
                    break;
                case 'videoMessage':
                    forwardContent = { video: buffer };
                    break;
                default:
                    return; // Only handle images and videos
            }
            
            // Add caption if exists
            if (viewOnceContent[messageType].caption) {
                forwardContent.caption = viewOnceContent[messageType].caption;
            }
            
            // Forward to same chat
            await conn.sendMessage(from, forwardContent, { quoted: m });
            
            // Optional: Log in console
            console.log(`Forwarded viewOnce ${messageType} in ${isGroup ? 'group' : 'DM'}`);
        }
    } catch (error) {
        console.error('ViewOnce Forward Error:', error);
    }
});
