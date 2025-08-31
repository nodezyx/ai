const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "test",
    alias: ["testbuttons", "buttontest"],
    desc: "Test different types of interactive buttons",
    category: "test",
    react: "🧪",
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    try {
        const jid = from;
        
        // Send message with multiple button types
        await conn.sendMessage(jid, {
            text: "🧪 *Button Testing Menu*\n\nSelect an option to test different button types available in WhatsApp!", 
            footer: `© ${config.BOTNAME || "Baileys Pro"}`,
            buttons: [
                {
                    buttonId: `${config.PREFIX}test simple`,
                    buttonText: {
                        displayText: '📱 SIMPLE BUTTONS'
                    },
                    type: 1,
                },
                {
                    buttonId: `${config.PREFIX}test interactive`,
                    buttonText: {
                        displayText: '🎯 INTERACTIVE MESSAGE'
                    },
                    type: 1,
                },
                {
                    buttonId: `${config.PREFIX}test all`,
                    buttonText: {
                        displayText: '🔧 ALL BUTTON TYPES'
                    },
                    type: 1,
                }
            ],
            headerType: 1
        }, { quoted: mek });

    } catch (error) {
        console.error('Test command error:', error);
        reply('❌ Failed to send test buttons');
    }
});

// Simple buttons test
cmd({
    pattern: "test simple",
    desc: "Test simple buttons",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            text: "📱 *Simple Buttons Test*\n\nThese are regular quick reply buttons.", 
            footer: "Tap any button to test",
            buttons: [
                {
                    buttonId: `${config.PREFIX}button1`,
                    buttonText: {
                        displayText: '✅ BUTTON 1'
                    },
                    type: 1,
                },
                {
                    buttonId: `${config.PREFIX}button2`,
                    buttonText: {
                        displayText: '❌ BUTTON 2'
                    },
                    type: 1,
                },
                {
                    buttonId: `${config.PREFIX}button3`,
                    buttonText: {
                        displayText: 'ℹ️ BUTTON 3'
                    },
                    type: 1,
                }
            ],
            headerType: 1
        }, { quoted: mek });

    } catch (error) {
        console.error('Simple buttons test error:', error);
        reply('❌ Failed to send simple buttons');
    }
});

// Interactive message test
cmd({
    pattern: "test interactive",
    desc: "Test interactive message button",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            text: "🎯 *Interactive Message Test*\n\nThis demonstrates the interactive message button with native flow.", 
            footer: "Tap the interactive button below",
            buttons: [
                {
                    buttonId: `${config.PREFIX}back`,
                    buttonText: {
                        displayText: '🔙 BACK TO MENU'
                    },
                    type: 1,
                },
                {
                    buttonId: ' ',
                    buttonText: {
                        displayText: '🔒 PRIVATE SCRIPT'
                    },
                    type: 1,
                },
                {
                    buttonId: 'action',
                    buttonText: {
                        displayText: '📨 INTERACTIVE MESSAGE'
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Interactive Message Demo',
                            sections: [
                                {
                                    title: 'Bot Features',
                                    highlight_label: '🚀',
                                    rows: [
                                        {
                                            header: 'AI',
                                            title: 'Artificial Intelligence',
                                            description: 'Smart responses and AI capabilities',
                                            id: 'ai_feature',
                                        },
                                        {
                                            header: 'MEDIA',
                                            title: 'Media Downloader',
                                            description: 'Download videos from various platforms',
                                            id: 'media_downloader',
                                        },
                                        {
                                            header: 'GROUP',
                                            title: 'Group Management',
                                            description: 'Advanced group control features',
                                            id: 'group_tools',
                                        },
                                    ],
                                },
                                {
                                    title: 'Settings',
                                    highlight_label: '⚙️',
                                    rows: [
                                        {
                                            header: 'MODE',
                                            title: 'Bot Mode Settings',
                                            description: 'Change between public/private mode',
                                            id: 'mode_settings',
                                        },
                                        {
                                            header: 'AUTO',
                                            title: 'Auto Features',
                                            description: 'Configure auto-reply and auto-react',
                                            id: 'auto_features',
                                        },
                                    ],
                                },
                            ],
                        }),
                    },
                },
            ],
            headerType: 1
        }, { quoted: mek });

    } catch (error) {
        console.error('Interactive message test error:', error);
        reply('❌ Failed to send interactive message');
    }
});

// All button types test
cmd({
    pattern: "test all",
    desc: "Test all button types",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            text: "🔧 *All Button Types Test*\n\nTesting various button configurations and types.", 
            footer: "Explore different button options",
            buttons: [
                {
                    buttonId: `${config.PREFIX}test`,
                    buttonText: {
                        displayText: '🔄 RELOAD TEST'
                    },
                    type: 1,
                },
                {
                    buttonId: `${config.PREFIX}menu`,
                    buttonText: {
                        displayText: '📋 MAIN MENU'
                    },
                    type: 1,
                },
                {
                    buttonId: 'action',
                    buttonText: {
                        displayText: '⚡ QUICK ACTIONS'
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Quick Actions',
                            sections: [
                                {
                                    title: 'Common Actions',
                                    highlight_label: '⚡',
                                    rows: [
                                        {
                                            header: 'DOWNLOAD',
                                            title: 'Download Media',
                                            description: 'Download videos/music',
                                            id: 'download_action',
                                        },
                                        {
                                            header: 'SETTINGS',
                                            title: 'Bot Settings',
                                            description: 'Change bot configuration',
                                            id: 'settings_action',
                                        },
                                        {
                                            header: 'INFO',
                                            title: 'Bot Information',
                                            description: 'Get bot details and status',
                                            id: 'info_action',
                                        },
                                    ],
                                },
                            ],
                        }),
                    },
                },
            ],
            headerType: 1
        }, { quoted: mek });

    } catch (error) {
        console.error('All buttons test error:', error);
        reply('❌ Failed to send all buttons test');
    }
});

// Button response handlers
cmd({
    pattern: "button1",
    desc: "Button 1 response",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    await reply('✅ You pressed Button 1!\n\nThis is a response from a simple button.');
});

cmd({
    pattern: "button2",
    desc: "Button 2 response",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    await reply('❌ You pressed Button 2!\n\nThis button demonstrates cancellation or negative action.');
});

cmd({
    pattern: "button3",
    desc: "Button 3 response",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    await reply('ℹ️ You pressed Button 3!\n\nThis button provides information or details.');
});

cmd({
    pattern: "back",
    desc: "Back button response",
    category: "test",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    await reply('🔙 Returning to main test menu...');
    // You can trigger the main test command again here
});

// Interactive message response handler (for native flow responses)
cmd({
    on: "message"
}, async (conn, mek, m) => {
    try {
        // Check if this is an interactive message response
        if (mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage) {
            const response = mek.message.interactiveResponseMessage.nativeFlowResponseMessage;
            const params = JSON.parse(response.paramsJson || '{}');
            
            console.log('Interactive response received:', params);
            
            // Handle different response types
            if (params.name === 'single_select' && params.response) {
                const selectedId = params.response.id;
                const from = mek.key.remoteJid;
                
                let responseMessage = '';
                
                switch (selectedId) {
                    case 'ai_feature':
                        responseMessage = '🤖 *AI Feature Selected*\n\nArtificial Intelligence capabilities activated!';
                        break;
                    case 'media_downloader':
                        responseMessage = '📥 *Media Downloader Selected*\n\nReady to download videos and music!';
                        break;
                    case 'group_tools':
                        responseMessage = '👥 *Group Tools Selected*\n\nGroup management features enabled!';
                        break;
                    case 'mode_settings':
                        responseMessage = '⚙️ *Mode Settings Selected*\n\nUse .mode command to change bot mode!';
                        break;
                    case 'auto_features':
                        responseMessage = '🔄 *Auto Features Selected*\n\nConfigure auto-reply with .autoreply command!';
                        break;
                    case 'download_action':
                        responseMessage = '📥 *Download Action Selected*\n\nUse .video, .audio, or .tiktok commands!';
                        break;
                    case 'settings_action':
                        responseMessage = '⚙️ *Settings Action Selected*\n\nUse .setvar to see all settings!';
                        break;
                    case 'info_action':
                        responseMessage = '📊 *Info Action Selected*\n\nUse .script for bot information!';
                        break;
                    default:
                        responseMessage = '🔘 *Interactive Response Received*\n\nSelected option: ' + selectedId;
                }
                
                await conn.sendMessage(from, { text: responseMessage }, { quoted: mek });
            }
        }
    } catch (error) {
        console.error('Interactive response handler error:', error);
    }
});

module.exports = {
    // Export if needed by other modules
};
