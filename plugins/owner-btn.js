const { cmd } = require('../command');
const config = require('../config');
const { setConfig, getConfig } = require("../lib/configdb");

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
    
    // Check if button interface should be used
    const useButtons = isEnabled && !option;
    
    if (useButtons) {
        // Button-based interface
        try {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const buttonsMessage = {
                text: `🔘 *BUTTON SETTINGS*\n\nCurrent Status: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:`,
                footer: config.FOOTER || 'Toggle button functionality',
                buttons: [
                    {
                        buttonId: `buttons-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `buttons-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `buttons-status-${sessionId}`,
                        buttonText: { displayText: '📊 STATUS' },
                        type: 1
                    }
                ],
                headerType: 1
            };

            // Send message with buttons
            const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
            const messageId = finalMsg.key.id;

            // Button handler
            const buttonHandler = async (msgData) => {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg.message?.buttonsResponseMessage) return;

                const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
                const senderId = receivedMsg.key.remoteJid;
                const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

                if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
                    conn.ev.off('messages.upsert', buttonHandler); // Remove listener

                    await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

                    try {
                        if (buttonId.startsWith(`buttons-enable-${sessionId}`)) {
                            setConfig("BUTTON", "true");
                            config.BUTTON = "true";
                            await conn.sendMessage(from, { 
                                text: "✅ *Interactive buttons are now ENABLED*\n\nThe bot will now use button interfaces where available." 
                            }, { quoted: receivedMsg });
                        } 
                        else if (buttonId.startsWith(`buttons-disable-${sessionId}`)) {
                            setConfig("BUTTON", "false");
                            config.BUTTON = "false";
                            await conn.sendMessage(from, { 
                                text: "❌ *Interactive buttons are now DISABLED*\n\nThe bot will use text-based interfaces instead." 
                            }, { quoted: receivedMsg });
                        }
                        else if (buttonId.startsWith(`buttons-status-${sessionId}`)) {
                            const newStatus = getConfig("BUTTON") || config.BUTTON || "false";
                            const newEnabled = newStatus === "true" || newStatus === true;
                            await conn.sendMessage(from, { 
                                text: `🔘 *Current Button Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}` 
                            }, { quoted: receivedMsg });
                        }

                        await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
                    } catch (error) {
                        console.error('Button action error:', error);
                        await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                        conn.sendMessage(from, { text: `❌ Error: ${error.message || 'Action failed'}` });
                    }
                }
            };

            // Add listener
            conn.ev.on('messages.upsert', buttonHandler);

            // Remove listener after 2 minutes
            setTimeout(() => {
                conn.ev.off('messages.upsert', buttonHandler);
            }, 120000);

        } catch (error) {
            console.error('Button interface error:', error);
            // Fall back to text interface if button interface fails
            await showTextInterface();
        }
    } else {
        // Text-based interface
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
