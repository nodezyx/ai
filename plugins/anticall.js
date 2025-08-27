const { cmd } = require('../command');
const config = require('../config');

// Store to prevent message spam
const recentCallers = new Set();

// Simple button check function
function shouldUseButtons() {
    const buttonStatus = config.BUTTON || "false";
    return buttonStatus === "true" || buttonStatus === true;
}

// Anti-call system setup (call this in your main bot file)
function setupAntiCallSystem(conn) {
    console.log('🔒 Anti-call system initialized');
    
    conn.ev.on("call", async (callData) => {
        try {
            if (config.ANTICALL !== "true") return;

            const calls = Array.isArray(callData) ? callData : [callData];
            
            for (const call of calls) {
                if (call.status === "offer" && !call.fromMe) {
                    console.log(`📵 Incoming call from: ${call.from}`);
                    
                    // Reject the call immediately
                    await conn.rejectCall(call.id, call.from);
                    console.log('✅ Call rejected');

                    // Send warning message (once per user per session)
                    if (!recentCallers.has(call.from)) {
                        recentCallers.add(call.from);
                        
                        await conn.sendMessage(call.from, {
                            text: `*📵 Call Rejected Automatically!*\n\n*Owner is busy, please do not call!* ⚠️\n\nSend a message instead for faster response.`
                        });
                        console.log('📩 Warning message sent');

                        // Clear from recent callers after 10 minutes
                        setTimeout(() => {
                            recentCallers.delete(call.from);
                        }, 10 * 60 * 1000);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Anti-call error:', error);
        }
    });
}

// Anti-call command with button support
cmd({
    pattern: "anticall",
    alias: ["antical"],
    react: "📵",
    desc: "Enable or disable anti-call feature",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isOwner, reply, from }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const currentStatus = config.ANTICALL || "false";
    const isEnabled = currentStatus === "true";
    const useButtons = shouldUseButtons() && !args[0];

    if (useButtons) {
        // Button-based interface
        try {
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const buttonsMessage = {
                text: `📵 *ANTI-CALL SETTINGS*\n\nCurrent Status: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nSelect an option:`,
                footer: config.FOOTER || 'Toggle anti-call feature',
                buttons: [
                    {
                        buttonId: `anticall-enable-${sessionId}`,
                        buttonText: { displayText: '✅ ENABLE' },
                        type: 1
                    },
                    {
                        buttonId: `anticall-disable-${sessionId}`,
                        buttonText: { displayText: '❌ DISABLE' },
                        type: 1
                    },
                    {
                        buttonId: `anticall-status-${sessionId}`,
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
                try {
                    const receivedMsg = msgData.messages[0];
                    if (!receivedMsg?.message?.buttonsResponseMessage) return;

                    const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
                    const senderId = receivedMsg.key.remoteJid;
                    const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

                    if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
                        conn.ev.off('messages.upsert', buttonHandler);

                        await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

                        if (buttonId.startsWith(`anticall-enable-${sessionId}`)) {
                            config.ANTICALL = "true";
                            await conn.sendMessage(from, { 
                                text: "✅ *Anti-call feature enabled*\n\nAll incoming calls will be automatically rejected." 
                            }, { quoted: receivedMsg });
                        } 
                        else if (buttonId.startsWith(`anticall-disable-${sessionId}`)) {
                            config.ANTICALL = "false";
                            await conn.sendMessage(from, { 
                                text: "❌ *Anti-call feature disabled*\n\nIncoming calls will not be automatically rejected." 
                            }, { quoted: receivedMsg });
                        }
                        else if (buttonId.startsWith(`anticall-status-${sessionId}`)) {
                            const newStatus = config.ANTICALL || "false";
                            const newEnabled = newStatus === "true";
                            await conn.sendMessage(from, { 
                                text: `📊 *Anti-call Status:* ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}` 
                            }, { quoted: receivedMsg });
                        }

                        await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                    await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                }
            };

            // Add listener
            conn.ev.on('messages.upsert', buttonHandler);

            // Remove listener after timeout
            setTimeout(() => {
                conn.ev.off('messages.upsert', buttonHandler);
            }, 120000);

        } catch (error) {
            console.error('Button interface error:', error);
            await showTextInterface();
        }
    } else {
        // Text-based interface
        await showTextInterface();
    }

    async function showTextInterface() {
        const option = args[0]?.toLowerCase();
        
        if (!option) {
            return reply(`📵 *Anti-call Status:* ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nUsage: .anticall on OR .anticall off`);
        }
        
        if (option === "on" || option === "true") {
            config.ANTICALL = "true";
            return reply("✅ *Anti-call feature enabled*\n\nAll incoming calls will be automatically rejected.");
        } else if (option === "off" || option === "false") {
            config.ANTICALL = "false";
            return reply("❌ *Anti-call feature disabled*\n\nIncoming calls will not be automatically rejected.");
        } else {
            return reply("❌ Invalid option! Use `.anticall on` or `.anticall off`");
        }
    }
});

// Export the setup function to be called in your main bot file
module.exports = { setupAntiCallSystem };
