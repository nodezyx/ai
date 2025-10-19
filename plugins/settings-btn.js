const { cmd } = require('../command');
const config = require('../config');
const { setConfig, getConfig } = require("../lib/configdb");
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Utility functions
function shouldUseButtons() {
    const buttonStatus = getConfig("BUTTON") || config.BUTTON || "false";
    return buttonStatus === "true" || buttonStatus === true;
}

async function createButtonInterface(conn, from, mek, title, options, currentStatus) {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const buttonsMessage = {
        text: `⚙️ *${title}*\n\nCurrent Status: ${currentStatus}\n\nSelect an option:`,
        footer: config.FOOTER || 'Toggle setting',
        buttons: options.map(option => ({
            buttonId: `${option.id}-${sessionId}`,
            buttonText: { displayText: option.text },
            type: 1
        })),
        headerType: 1
    };

    const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
    return { sessionId, messageId: finalMsg.key.id };
}

function setupButtonHandler(conn, from, sessionId, messageId, handler) {
    const buttonHandler = async (msgData) => {
        const receivedMsg = msgData.messages[0];
        if (!receivedMsg.message?.buttonsResponseMessage) return;

        const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
        const senderId = receivedMsg.key.remoteJid;
        const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

        if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
            conn.ev.off('messages.upsert', buttonHandler);
            await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });
            
            try {
                await handler(buttonId, receivedMsg);
                await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
            } catch (error) {
                console.error('Button action error:', error);
                await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
                conn.sendMessage(from, { text: `❌ Error: ${error.message || 'Action failed'}` });
            }
        }
    };

    conn.ev.on('messages.upsert', buttonHandler);
    setTimeout(() => conn.ev.off('messages.upsert', buttonHandler), 120000);
}

// Button toggle command
cmd({
    pattern: "buttons2",
    alias: ["togglebuttons2", "buttonmode2"],
    react: "🪀",
    desc: "Enable or disable interactive buttons in the bot",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const currentStatus = getConfig("BUTTON") || config.BUTTON || "false";
    const isEnabled = currentStatus === "true" || currentStatus === true;
    
    const option = args[0]?.toLowerCase();
    
    if (!option) {
        return reply(`🔘 *Button Status:* ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nUsage: .buttons on - Enable interactive buttons\n.buttons off - Disable interactive buttons`);
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
        return reply("❌ *Invalid option!*\n\nUsage: .buttons on - Enable buttons\n.buttons off - Disable buttons");
    }
});

// Mode command with button support
cmd({
    pattern: "mode",
    alias: ["setmode"],
    react: "🔐",
    desc: "Set bot mode to private or public.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply, from }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const currentMode = getConfig("MODE") || config.MODE || "public";
    const useButtons = shouldUseButtons() && !args[0];

    if (useButtons) {
        try {
            const { sessionId, messageId } = await createButtonInterface(
                conn, from, mek, 
                "BOT MODE SETTINGS", 
                [
                    { id: "mode-private", text: "🔒 PRIVATE" },
                    { id: "mode-public", text: "🌐 PUBLIC" },
                    { id: "mode-status", text: "📊 STATUS" }
                ],
                currentMode.toUpperCase()
            );

            setupButtonHandler(conn, from, sessionId, messageId, async (buttonId, receivedMsg) => {
                if (buttonId.startsWith(`mode-private-${sessionId}`)) {
                    setConfig("MODE", "private");
                    config.MODE = "private";
                    await conn.sendMessage(from, { 
                        text: "✅ Bot mode is now set to *PRIVATE*.\n\n♻ Restarting bot to apply changes..." 
                    }, { quoted: receivedMsg });
                    exec("pm2 restart all");
                } 
                else if (buttonId.startsWith(`mode-public-${sessionId}`)) {
                    setConfig("MODE", "public");
                    config.MODE = "public";
                    await conn.sendMessage(from, { 
                        text: "✅ Bot mode is now set to *PUBLIC*.\n\n♻ Restarting bot to apply changes..." 
                    }, { quoted: receivedMsg });
                    exec("pm2 restart all");
                }
                else if (buttonId.startsWith(`mode-status-${sessionId}`)) {
                    const newMode = getConfig("MODE") || config.MODE || "public";
                    await conn.sendMessage(from, { 
                        text: `📊 Current Mode: *${newMode.toUpperCase()}*` 
                    }, { quoted: receivedMsg });
                }
            });

        } catch (error) {
            console.error('Button interface error:', error);
            await showModeTextInterface();
        }
    } else {
        await showModeTextInterface();
    }

    async function showModeTextInterface() {
        if (!args[0]) {
            return reply(`📌 Current mode: *${currentMode.toUpperCase()}*\n\nUsage: .mode private OR .mode public`);
        }

        const modeArg = args[0].toLowerCase();
        if (["private", "public"].includes(modeArg)) {
            setConfig("MODE", modeArg);
            config.MODE = modeArg;
            await reply(`✅ Bot mode is now set to *${modeArg.toUpperCase()}*.\n\n♻ Restarting bot to apply changes...`);
            exec("pm2 restart all");
        } else {
            return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
        }
    }
});

// Heartreact command with button support
cmd({
    pattern: "heartreact",
    react: "❤️",
    alias: ["heart"],
    desc: "Enable or disable heart react.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const currentStatus = getConfig("HEARTREACT") || config.HEARTREACT || "false";
    const isEnabled = currentStatus === "true";
    const useButtons = shouldUseButtons() && !args[0];

    if (useButtons) {
        try {
            const { sessionId, messageId } = await createButtonInterface(
                conn, from, mek, 
                "HEART REACT SETTINGS", 
                [
                    { id: "heart-enable", text: "❤️ ENABLE" },
                    { id: "heart-disable", text: "💔 DISABLE" },
                    { id: "heart-status", text: "📊 STATUS" }
                ],
                isEnabled ? '✅ ENABLED' : '❌ DISABLED'
            );

            setupButtonHandler(conn, from, sessionId, messageId, async (buttonId, receivedMsg) => {
                if (buttonId.startsWith(`heart-enable-${sessionId}`)) {
                    setConfig("HEARTREACT", "true");
                    config.HEARTREACT = "true";
                    await conn.sendMessage(from, { 
                        text: "❤️ Heart react is now enabled." 
                    }, { quoted: receivedMsg });
                } 
                else if (buttonId.startsWith(`heart-disable-${sessionId}`)) {
                    setConfig("HEARTREACT", "false");
                    config.HEARTREACT = "false";
                    await conn.sendMessage(from, { 
                        text: "💔 Heart react is now disabled." 
                    }, { quoted: receivedMsg });
                }
                else if (buttonId.startsWith(`heart-status-${sessionId}`)) {
                    const newStatus = getConfig("HEARTREACT") || config.HEARTREACT || "false";
                    const newEnabled = newStatus === "true";
                    await conn.sendMessage(from, { 
                        text: `❤️ Heart React: ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}` 
                    }, { quoted: receivedMsg });
                }
            });

        } catch (error) {
            console.error('Button interface error:', error);
            await showHeartTextInterface();
        }
    } else {
        await showHeartTextInterface();
    }

    async function showHeartTextInterface() {
        const option = args[0]?.toLowerCase();
        
        if (!option) {
            return reply(`❤️ Heart React: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nUsage: .heartreact on OR .heartreact off`);
        }
        
        if (option === "on" || option === "true") {
            setConfig("HEARTREACT", "true");
            config.HEARTREACT = "true";
            return reply("❤️ Heart react is now enabled.");
        } else if (option === "off" || option === "false") {
            setConfig("HEARTREACT", "false");
            config.HEARTREACT = "false";
            return reply("💔 Heart react is now disabled.");
        } else {
            return reply("❌ Invalid option! Use `.heartreact on` or `.heartreact off`");
        }
    }
});

// Generic toggle command creator
function createToggleCommand(pattern, aliases, react, desc, category, configKey, friendlyName) {
    cmd({
        pattern,
        alias: aliases,
        react,
        desc,
        category,
        filename: __filename,
    }, async (conn, mek, m, { from, args, isOwner, reply }) => {
        if (!isOwner) return reply("*📛 Only the owner can use this command!*");

        const currentStatus = getConfig(configKey) || config[configKey] || "false";
        const isEnabled = currentStatus === "true";
        const useButtons = shouldUseButtons() && !args[0];

        if (useButtons) {
            try {
                const { sessionId, messageId } = await createButtonInterface(
                    conn, from, mek, 
                    `${friendlyName.toUpperCase()} SETTINGS`, 
                    [
                        { id: `${configKey}-enable`, text: "✅ ENABLE" },
                        { id: `${configKey}-disable`, text: "❌ DISABLE" },
                        { id: `${configKey}-status`, text: "📊 STATUS" }
                    ],
                    isEnabled ? '✅ ENABLED' : '❌ DISABLED'
                );

                setupButtonHandler(conn, from, sessionId, messageId, async (buttonId, receivedMsg) => {
                    if (buttonId.startsWith(`${configKey}-enable-${sessionId}`)) {
                        setConfig(configKey, "true");
                        config[configKey] = "true";
                        await conn.sendMessage(from, { 
                            text: `✅ ${friendlyName} is now enabled.` 
                        }, { quoted: receivedMsg });
                    } 
                    else if (buttonId.startsWith(`${configKey}-disable-${sessionId}`)) {
                        setConfig(configKey, "false");
                        config[configKey] = "false";
                        await conn.sendMessage(from, { 
                            text: `❌ ${friendlyName} is now disabled.` 
                        }, { quoted: receivedMsg });
                    }
                    else if (buttonId.startsWith(`${configKey}-status-${sessionId}`)) {
                        const newStatus = getConfig(configKey) || config[configKey] || "false";
                        const newEnabled = newStatus === "true";
                        await conn.sendMessage(from, { 
                            text: `📊 ${friendlyName}: ${newEnabled ? '✅ ENABLED' : '❌ DISABLED'}` 
                        }, { quoted: receivedMsg });
                    }
                });

            } catch (error) {
                console.error('Button interface error:', error);
                await showTextInterface();
            }
        } else {
            await showTextInterface();
        }

        async function showTextInterface() {
            const option = args[0]?.toLowerCase();
            
            if (!option) {
                return reply(`📊 ${friendlyName}: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nUsage: .${pattern} on OR .${pattern} off`);
            }
            
            if (option === "on" || option === "true") {
                setConfig(configKey, "true");
                config[configKey] = "true";
                return reply(`✅ ${friendlyName} is now enabled.`);
            } else if (option === "off" || option === "false") {
                setConfig(configKey, "false");
                config[configKey] = "false";
                return reply(`❌ ${friendlyName} is now disabled.`);
            } else {
                return reply(`❌ Invalid option! Use .${pattern} on or .${pattern} off`);
            }
        }
    });
}

// Create all toggle commands
createToggleCommand("autotyping", ["setautotyping"], "🫟", "Enable or disable auto-typing feature.", "settings", "AUTOTYPING", "Auto Typing");
createToggleCommand("alwaysonline", ["setalwaysonline"], "🌐", "Set bot status to always online or offline.", "settings", "ALWAYSONLINE", "Always Online");
createToggleCommand("autorecording", ["autorecoding","setautorecording"], "🎙️", "Enable or disable auto-recording feature.", "settings", "AUTORECORDING", "Auto Recording");
createToggleCommand("autostatusreact", ["setautoreactstatus","autostatusreact"], "📱", "Enable or disable auto-viewing of statuses", "settings", "AUTOSTATUSREACT", "Auto Status React");
createToggleCommand("autostatusview", ["setautoviewstatus","autoviewstatus","setautostatusview"], "👀", "Enable or disable autoview of statuses", "settings", "AUTOSTATUSSEEN", "Auto Status View");
createToggleCommand("anticall", ["statusreaction"], "📞", "Enable or disable anti-call", "settings", "ANTICALL", "Anti Call");
createToggleCommand("antibad", ["setantibad","antibadword"], "🚫", "Enable or disable anti-bad words", "settings", "ANTIBADWORD", "Anti Bad Words");
createToggleCommand("autosticker", ["setautosticker"], "🖼️", "Enable or disable auto-sticker", "settings", "AUTOSTICKER", "Auto Sticker");
createToggleCommand("autoreply", ["setautoreply"], "💬", "Enable or disable auto-reply", "settings", "AUTOREPLY", "Auto Reply");
createToggleCommand("autoreact", ["setautoreact"], "❤️", "Enable or disable auto-react", "settings", "AUTOREACT", "Auto React");
createToggleCommand("autostatusreply", ["setautostatusreply"], "📢", "Enable or disable auto status reply", "settings", "AUTOSTATUSREPLY", "Auto Status Reply");
createToggleCommand("welcome", ["setwelcome"], "👋", "Enable or disable welcome messages", "settings", "WELCOME", "Welcome Messages");

// Settings menu command
cmd({
    pattern: "setvar",
    alias: ["settings", "cmdlist"],
    react: "⚙️",
    desc: "List all commands and their current status.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const cmdList = `
----------------------------------------
\`\`\`SUBZERO SETTINGS\`\`\`
----------------------------------------

🔧 *1. Mode*
   - Current Status: ${getConfig("MODE") || config.MODE || "public"}
   - Usage: ${config.PREFIX}mode private/public

🎯 *2. Auto Typing*
   - Current Status: ${getConfig("AUTOTYPING") || config.AUTOTYPING || "off"}
   - Usage: ${config.PREFIX}autotyping on/off

🌐 *3. Always Online*
   - Current Status: ${getConfig("ALWAYSONLINE") || config.ALWAYSONLINE || "off"}
   - Usage: ${config.PREFIX}alwaysonline on/off

🎙️ *4. Auto Recording*
   - Current Status: ${getConfig("AUTORECORDING") || config.AUTORECORDING || "off"}
   - Usage: ${config.PREFIX}autorecording on/off

📖 *5. Auto Read Status*
   - Current Status: ${getConfig("AUTOSTATUSREACT") || config.AUTOSTATUSREACT || "off"}
   - Usage: ${config.PREFIX}autoreadstatus on/off

🚫 *6. Anti Bad Word*
   - Current Status: ${getConfig("ANTIBADWORD") || config.ANTIBADWORD || "off"}
   - Usage: ${config.PREFIX}antibad on/off

🗑️ *7. Anti Delete*
   - Current Status: ${getConfig("ANTIDELETE") || config.ANTIDELETE || "off"}
   - Usage: ${config.PREFIX}antidelete on/off

🖼️ *8. Auto Sticker*
   - Current Status: ${getConfig("AUTOSTICKER") || config.AUTOSTICKER || "off"}
   - Usage: ${config.PREFIX}autosticker on/off

💬 *9. Auto Reply*
   - Current Status: ${getConfig("AUTOREPLY") || config.AUTOREPLY || "off"}
   - Usage: ${config.PREFIX}autoreply on/off

❤️ *10. Auto React*
   - Current Status: ${getConfig("AUTOREACT") || config.AUTOREACT || "off"}
   - Usage: ${config.PREFIX}autoreact on/off

📢 *11. Status Reply*
   - Current Status: ${getConfig("AUTOSTATUSREPLY") || config.AUTOSTATUSREPLY || "off"}
   - Usage: ${config.PREFIX}autostatusreply on/off

🔗 *12. Anti Link*
   - Current Status: ${getConfig("ANTILINK") || config.ANTILINK || "off"}
   - Usage: ${config.PREFIX}antilink on/off

🤖 *13. Anti Bot*
   - Current Status: ${getConfig("ANTIBOT") || config.ANTIBOT || "off"}
   - Usage: ${config.PREFIX}antibot off/warn/delete/kick

💖 *14. Heart React*
   - Current Status: ${getConfig("HEARTREACT") || config.HEARTREACT || "off"}
   - Usage: ${config.PREFIX}heartreact on/off

🔧 *15. Set Prefix*
   - Current Prefix: ${config.PREFIX || "."}
   - Usage: ${config.PREFIX}setprefix <new_prefix>

🔘 *16. Interactive Buttons*
   - Current Status: ${getConfig("BUTTON") || config.BUTTON || "off"}
   - Usage: ${config.PREFIX}buttons on/off

📌 *Note*: Replace "on/off" with the desired state to enable or disable a feature.
`;

    try {
        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/18il7k.jpg' },
            caption: cmdList
        }, { quoted: mek });
    } catch (e) {
        console.error('Error sending with image:', e);
        await conn.sendMessage(from, { 
            text: cmdList 
        }, { quoted: mek });
    }
});

// Set bot image command
cmd({
    pattern: "setbotimage",
    desc: "Set the bot's image URL",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let imageUrl = args[0];

        // Upload image if replying to one
        if (!imageUrl && m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");

            const mediaBuffer = await quotedMsg.download();
            const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
            const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}${extension}`);
            fs.writeFileSync(tempFilePath, mediaBuffer);

            const form = new FormData();
            form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage${extension}`);
            form.append("reqtype", "fileupload");

            const response = await axios.post("https://catbox.moe/user.api.php", form, {
                headers: form.getHeaders()
            });

            fs.unlinkSync(tempFilePath);

            if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
                throw new Error(`Catbox upload failed: ${response.data}`);
            }

            imageUrl = response.data;
        }

        if (!imageUrl || !imageUrl.startsWith("http")) {
            return reply("❌ Provide a valid image URL or reply to an image.");
        }

        await setConfig("BOTIMAGE", imageUrl);

        await reply(`✅ Bot image updated.\n\n*New URL:* ${imageUrl}\n\n♻️ Restarting...`);
        setTimeout(() => exec("pm2 restart all"), 2000);

    } catch (err) {
        console.error(err);
        reply(`❌ Error: ${err.message || err}`);
    }
});

// Set prefix command
cmd({
    pattern: "setprefix",
    desc: "Set the bot's command prefix",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    const newPrefix = args[0]?.trim();
    if (!newPrefix || newPrefix.length > 2) return reply("❌ Provide a valid prefix (1–2 characters).");

    await setConfig("PREFIX", newPrefix);

    await reply(`✅ Prefix updated to: *${newPrefix}*\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
});

// Set bot name command
cmd({
    pattern: "setbotname",
    desc: "Set the bot's name",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    const newName = args.join(" ").trim();
    if (!newName) return reply("❌ Provide a bot name.");

    await setConfig("BOTNAME", newName);

    await reply(`✅ Bot name updated to: *${newName}*\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
});

// Set owner name command
cmd({
    pattern: "setownername",
    desc: "Set the owner's name",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    const name = args.join(" ").trim();
    if (!name) return reply("❌ Provide an owner name.");

    await setConfig("OWNERNAME", name);

    await reply(`✅ Owner name updated to: *${name}*\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
});

module.exports = { shouldUseButtons };
