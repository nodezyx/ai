const { cmd } = require('../command');
const config = require('../config');
const { setConfig, getConfig } = require("../lib/configdb");

// Store active button sessions to prevent memory leaks
const activeButtonSessions = new Map();

cmd({
    pattern: "buttons",
    alias: ["button", "buttonmode"],
    react: "🔮",
    desc: "Enable or disable interactive buttons in the bot",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const currentStatus = getConfig("BUTTON") || config.BUTTON || "false";
    const isEnabled = currentStatus === "true" || currentStatus === true;
    
    const option = args[0]?.toLowerCase();
    
    // Show button interface ONLY if buttons are enabled AND no option is provided
    if (isEnabled && !option) {
        // Button-based interface
        try {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const buttonsMessage = {
                text: `🔘 *BUTTON SETTINGS*\n\nCurrent Status: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:`,
                footer: config.FOOTER || 'Toggle button functionality',
                buttons: [
                    {
                        buttonId: `enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `status-${sessionId}`,
                        buttonText: { displayText: '📊 STATUS' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            // Send message with buttons
            const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
            const messageId = finalMsg.key.id;

            // Create button handler
            const buttonHandler = async (msgData) => {
                try {
                    const receivedMsg = msgData.messages[0];
                    if (!receivedMsg?.message?.buttonsResponseMessage) return;

                    const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
                    const senderId = receivedMsg.key.remoteJid;
                    const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

                    // Validate the response
                    if (!isReplyToBot || senderId !== from || !buttonId.includes(sessionId)) {
                        return;
                    }

                    // Remove listener immediately to prevent multiple triggers
                    conn.ev.off('messages.upsert', buttonHandler);
                    activeButtonSessions.delete(sessionId);

                    await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

                    let responseText = "";
                    
                    if (buttonId.startsWith(`enable-${sessionId}`)) {
                        setConfig("BUTTON", "true");
                        config.BUTTON = "true";
                        responseText = "✅ *Interactive buttons are now ENABLED*\n\nThe bot will now use button interfaces where available.";
                    } 
                    else if (buttonId.startsWith(`disable-${sessionId}`)) {
                        setConfig("BUTTON", "false");
                        config.BUTTON = "false";
                        responseText = "❌ *Interactive buttons are now DISABLED*\n\nThe bot will use text-based interfaces instead.";
                    }
                    else if (buttonId.startsWith(`status-${sessionId}`)) {
                        const newStatus = getConfig("BUTTON") || config.BUTTON || "false";
                        const newEnabled = newStatus === "true" || newStatus === true;
                        responseText = `🔘 *Current Button Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}`;
                    }

                    // Send response and confirmation
                    await conn.sendMessage(from, { text: responseText }, { quoted: receivedMsg });
                    await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });

                } catch (error) {
                    console.error('Button action error:', error);
                    try {
                        await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                        await conn.sendMessage(from, { text: `❌ Error: ${error.message || 'Action failed'}` });
                    } catch (e) {
                        console.error('Failed to send error message:', e);
                    }
                }
            };

            // Store session and add listener
            activeButtonSessions.set(sessionId, {
                handler: buttonHandler,
                timestamp: Date.now()
            });
            
            conn.ev.on('messages.upsert', buttonHandler);

            // Auto-cleanup after 2 minutes
            setTimeout(() => {
                if (activeButtonSessions.has(sessionId)) {
                    conn.ev.off('messages.upsert', buttonHandler);
                    activeButtonSessions.delete(sessionId);
                }
            }, 120000);

        } catch (error) {
            console.error('Button interface error:', error);
            // Fall back to text interface if button interface fails
            await showTextInterface();
        }
    } else {
        // Text-based interface (when buttons are disabled OR an option is provided)
        await showTextInterface();
    }

    async function showTextInterface() {
        if (!option) {
            // Show current status
            return reply(`🔘 *Button Status:* ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n` +
                        `Usage: .buttons on - Enable interactive buttons\n` +
                        `       .buttons off - Disable interactive buttons`);
        }
        
        if (option === "on" || option === "true" || option === "enable") {
            setConfig("BUTTON", "true");
            config.BUTTON = "true";
            return reply("✅ *Interactive buttons are now ENABLED*\n\nThe bot will now use button interfaces where available.");
        } 
        else if (option === "off" || option === "false" || option === "disable") {
            setConfig("BUTTON", "false");
            config.BUTTON = "false";
            return reply("❌ *Interactive buttons are now DISABLED*\n\nThe bot will use text-based interfaces instead.");
        } 
        else {
            return reply("❌ *Invalid option!*\n\nUsage: .buttons on - Enable buttons\n       .buttons off - Disable buttons");
        }
    }
});

// Cleanup old sessions periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of activeButtonSessions.entries()) {
        if (now - session.timestamp > 120000) { // 2 minutes
            activeButtonSessions.delete(sessionId);
        }
    }
}, 60000); // Cleanup every minute
