const { cmd } = require('../command');
const config = require('../config');

// Store original messages (persists across restarts if using Redis/MongoDB)
const messageStore = new Map();

// Anti-edit detector that's always active
cmd({
    on: "message"
}, async (conn, mek, m, { sender, from }) => {
    try {
        // 1. Store all text messages for edit detection
        if (m.message?.conversation || m.message?.extendedTextMessage?.text) {
            const text = m.message.conversation || m.message.extendedTextMessage.text;
            messageStore.set(m.key.id, {
                text: text,
                sender: sender,
                timestamp: new Date(),
                chatJid: from
            });
        }
        
        // 2. Detect and handle edited messages
        if (m.message?.editedMessage?.message) {
            if (!config.ANTI_EDIT) return;
            
            const editedContent = m.message.editedMessage.message;
            const originalMessage = messageStore.get(m.key.id);
            
            if (!originalMessage) return;
            
            const newText = editedContent.conversation || 
                           editedContent.extendedTextMessage?.text;
            
            if (!newText) return;
            
            // Send edit notification
            await conn.sendMessage(originalMessage.chatJid, {
                text: `✂️ *EDIT DETECTED* ✂️\n\n` +
                      `👤 *Editor:* @${originalMessage.sender.split('@')[0]}\n` +
                      `⏰ *Original at:* ${originalMessage.timestamp.toLocaleTimeString()}\n` +
                      `📜 *Was:* ${originalMessage.text}\n` +
                      `🖊️ *Now:* ${newText}\n\n` +
                      `_Message editing is logged for security_`,
                mentions: [originalMessage.sender]
            }, { quoted: m });
            
            console.log(`Edit detected from ${originalMessage.sender}`);
        }
    } catch (error) {
        console.error('Anti-Edit Error:', error);
    }
});

// Cleanup old messages every hour
setInterval(() => {
    const now = new Date();
    const cutoff = 24 * 60 * 60 * 1000; // 24 hours retention
    
    for (const [id, msg] of messageStore.entries()) {
        if (now - msg.timestamp > cutoff) {
            messageStore.delete(id);
        }
    }
}, 60 * 60 * 1000); // Run hourly
