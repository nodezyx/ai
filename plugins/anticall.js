const { cmd } = require('../command');
const config = require('../config');

// Store to prevent message spam
const recentCallers = new Set();
let isAntiCallInitialized = false;

// Simple button check function
function shouldUseButtons() {
    const buttonStatus = config.BUTTON || "false";
    return buttonStatus === "true" || buttonStatus === true;
}

// Anti-call command with button support AND built-in initialization
cmd({
    pattern: "anticall",
    alias: ["antical"],
    react: "📵",
    desc: "Enable or disable anti-call feature",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isOwner, reply, from }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    // Initialize anti-call system if not already done
    if (!isAntiCallInitialized) {
        setupAntiCallSystem(conn);
        isAntiCallInitialized = true;
    }

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

// Anti-call system implementation
function setupAntiCallSystem(conn) {
    console.log('🔒 Anti-call system initialized');
    
    conn.ev.on("call", async (callData) => {
        try {
            if (config.ANTICALL !== "true") {
                console.log('📞 Anti-call is disabled, ignoring call');
                return;
            }

            const calls = Array.isArray(callData) ? callData : [callData];
            
            for (const call of calls) {
                if (call.status === "offer" && !call.fromMe) {
                    console.log(`📵 Incoming call from: ${call.from}`);
                    
                    // Reject the call immediately
                    await conn.rejectCall(call.id, call.from).catch(e => {
                        console.log('⚠️ Could not reject call (might be already ended):', e.message);
                    });
                    console.log('✅ Call rejected');

                    // Send warning message (once per user per session)
                    if (!recentCallers.has(call.from)) {
                        recentCallers.add(call.from);
                        
                        try {
                            await conn.sendMessage(call.from, {
                                text: `*📵 Call Rejected Automatically!*\n\n*Owner is busy, please do not call!* ⚠️\n\nSend a message instead for faster response.`
                            });
                            console.log('📩 Warning message sent');
                        } catch (msgError) {
                            console.log('⚠️ Could not send warning message:', msgError.message);
                        }

                        // Clear from recent callers after 10 minutes
                        setTimeout(() => {
                            recentCallers.delete(call.from);
                            console.log(`🔄 Cleared caller from recent list: ${call.from}`);
                        }, 10 * 60 * 1000);
                    } else {
                        console.log('⚠️ Already sent warning to this caller recently');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Anti-call system error:', error.message);
        }
    });

    // Also handle call events from different event formats
    conn.ev.on("messages.upsert", async (data) => {
        try {
            if (config.ANTICALL !== "true") return;

            const messages = data.messages;
            if (messages && messages[0] && messages[0].message && messages[0].message.call) {
                const call = messages[0].message.call;
                if (call.callEnded) return; // Ignore ended calls
                
                console.log(`📵 Incoming call detected via message event: ${messages[0].key.remoteJid}`);
                
                if (!messages[0].key.fromMe) {
                    await conn.rejectCall(call.callId, messages[0].key.remoteJid).catch(e => {
                        console.log('⚠️ Could not reject call:', e.message);
                    });
                }
            }
        } catch (error) {
            console.error('❌ Call handling error in message event:', error.message);
        }
    });
}

// Auto-initialize when this file is loaded (if we have access to conn)
if (typeof conn !== 'undefined') {
    setupAntiCallSystem(conn);
    isAntiCallInitialized = true;
}

// Export nothing since this is a complete standalone plugin
