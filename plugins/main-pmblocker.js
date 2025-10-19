/*const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "pmblock",
    alias: ["pmblocker"],
    desc: "Enable/disable PM blocking",
    category: "security",
    filename: __filename,
    usage: "pmblock [on/off]"
}, async (m, conn, { args, isOwner }) => {
    if (!isOwner) return m.reply("❌ Only the bot owner can use this command");

    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        config.PM_BLOCKER = "true";
        return m.reply("✅ *PM Blocker Enabled*\nBot will now block non-owners who message privately.");
    } 
    else if (action === 'off') {
        config.PM_BLOCKER = "false";
        return m.reply("✅ *PM Blocker Disabled*\nUsers can now PM the bot.");
    }
    return m.reply("Usage: pmblock on/off");
});

*/
