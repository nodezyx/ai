const { cmd } = require('../command');
const config = require('../config');
const { setConfig, getConfig } = require("../lib/configdb");

cmd({
    pattern: "buttons",
    alias: ["togglebuttons", "buttonmode"],
    react: "🔘",
    desc: "Enable or disable interactive buttons in the bot",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const currentStatus = getConfig("BUTTON") || config.BUTTON || "false";
    const isEnabled = currentStatus === "true" || currentStatus === true;
    
    const option = args[0]?.toLowerCase();
    
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
});
