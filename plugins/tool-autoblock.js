/*const fs = require("fs");
const path = require("path");
const { cmd } = require("../command");
const config = require("../config");

// Ensure ban.json exists
const BAN_FILE = path.join(__dirname, "../lib/ban.json");
if (!fs.existsSync(BAN_FILE)) {
    fs.writeFileSync(BAN_FILE, "[]");
}

// Auto-ban PM handler
cmd({
    on: "message"
}, async (conn, m, store, { from, sender, isGroup, isOwner, isCreator }) => {
    try {
        // Skip if it's a group chat or from owner/creator
        if (isGroup || isOwner || isCreator) return;

        // Read banned users
        const banned = JSON.parse(fs.readFileSync(BAN_FILE, "utf-8"));

        // Check if already banned
        if (banned.includes(sender)) {
            await conn.sendMessage(sender, { text: "⛔ You are banned from using this bot!" });
            return;
        }

        // Auto-ban logic when PM_BLOCKER is true
        if (config.PM_BLOCKER === true) {
            // Add to ban list
            banned.push(sender);
            fs.writeFileSync(BAN_FILE, JSON.stringify([...new Set(banned)], null, 2));

            // Notify user
            await conn.sendMessage(sender, { text: "⛔ You have been automatically banned!\nReason: PM not allowed" });

            // Notify owner
            if (config.OWNER_NUMBER) {
                const user = sender.split('@')[0];
                await conn.sendMessage(
                    config.OWNER_NUMBER + '@s.whatsapp.net',
                    { text: `🚫 Auto-banned user: @${user}` },
                    { mentions: [sender] }
                );
            }
        }
    } catch (error) {
        console.error("Auto-ban Error:", error);
    }
});
*/
/*
// Ban command (existing)
cmd({
    pattern: "ban",
    alias: ["blockuser", "addban"],
    desc: "Ban a user from using the bot",
    category: "owner",
    react: "⛔",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("_❗Only the bot owner can use this command!_");

        let target = m.mentionedJid?.[0] 
            || (m.quoted?.sender ?? null)
            || (args[0]?.replace(/[^0-9]/g, '') + "@s.whatsapp.net");

        if (!target) return reply("❌ Please provide a number or tag/reply a user.");

        let banned = JSON.parse(fs.readFileSync(BAN_FILE, "utf-8"));

        if (banned.includes(target)) {
            return reply("❌ This user is already banned.");
        }

        banned.push(target);
        fs.writeFileSync(BAN_FILE, JSON.stringify([...new Set(banned)], null, 2));

        await conn.sendMessage(from, {
            text: `⛔ @${target.split('@')[0]} has been banned from using the bot.`,
            mentions: [target]
        }, { quoted: mek });

        // Notify banned user
        await conn.sendMessage(target, { text: "⛔ You have been banned from using this bot!" });

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// Unban command (existing)
cmd({
    pattern: "unban",
    alias: ["removeban"],
    desc: "Unban a user",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("_❗Only the bot owner can use this command!_");

        let target = m.mentionedJid?.[0] 
            || (m.quoted?.sender ?? null)
            || (args[0]?.replace(/[^0-9]/g, '') + "@s.whatsapp.net");

        if (!target) return reply("❌ Please provide a number or tag/reply a user.");

        let banned = JSON.parse(fs.readFileSync(BAN_FILE, "utf-8"));

        if (!banned.includes(target)) {
            return reply("❌ This user is not banned.");
        }

        const updated = banned.filter(u => u !== target);
        fs.writeFileSync(BAN_FILE, JSON.stringify(updated, null, 2));

        await conn.sendMessage(from, {
            text: `✅ @${target.split('@')[0]} has been unbanned.`,
            mentions: [target]
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

// Listban command (existing)
cmd({
    pattern: "listban",
    alias: ["banlist", "bannedusers"],
    desc: "List all banned users",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("_❗Only the bot owner can use this command!_");

        let banned = JSON.parse(fs.readFileSync(BAN_FILE, "utf-8"));
        banned = [...new Set(banned)];

        if (banned.length === 0) return reply("✅ No banned users found.");

        let msg = "⛔ Banned Users:\n\n";
        banned.forEach((id, i) => {
            msg += `${i + 1}. @${id.split('@')[0]}\n`;
        });

        await conn.sendMessage(from, {
            text: msg,
            mentions: banned
        }, { quoted: mek });
    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});

*/
