const { cmd } = require('../command');

cmd({
    on: "message"
}, async (conn, mek, m, { from }) => {
    try {
        // Check for view-once messages
        if (m.message?.viewOnceMessageV2 || m.message?.viewOnceMessage) {
            const viewOnceMsg = m.message.viewOnceMessageV2 || m.message.viewOnceMessage;
            const messageContent = viewOnceMsg.message;
            const messageType = Object.keys(messageContent)[0];
            
            // Download the media
            const buffer = await conn.downloadMediaMessage(m);
            
            let forwardContent = {};
            switch (messageType) {
                case 'imageMessage':
                    forwardContent = { 
                        image: buffer,
                        mimetype: messageContent.imageMessage?.mimetype || 'image/jpeg'
                    };
                    break;
                case 'videoMessage':
                    forwardContent = { 
                        video: buffer,
                        mimetype: messageContent.videoMessage?.mimetype || 'video/mp4'
                    };
                    break;
                default:
                    return; // Only handle images and videos
            }
            
            // Add caption if exists
            if (messageContent[messageType]?.caption) {
                forwardContent.caption = messageContent[messageType].caption;
            }
            
            // Forward to same chat with original sender info
            await conn.sendMessage(from, forwardContent, { 
                quoted: {
                    key: m.key,
                    message: {
                        conversation: "View once message saved"
                    }
                }
            });
            
            console.log(`Forwarded view-once ${messageType} in chat ${from}`);
        }
    } catch (error) {
        console.error('ViewOnce Forward Error:', error);
        // Optionally send error to owner
         await conn.sendMessage(config.OWNER_NUMBER, { text: `Error: ${error.message}` });
    }
});
