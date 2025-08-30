const { cmd } = require('../command');
const { getAnti, setAnti, getAllAnti, initializeAntiDeleteSettings } = require('../data/antidel');

initializeAntiDeleteSettings();

cmd({
    pattern: "antidelete",
    alias: ['antidel', 'ad'],
    desc: "Sets up the Antidelete system",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, reply, q, text, isCreator }) => {
    if (!isCreator) return reply('❌ This command is only for the bot owner.');
    try {
        const command = q?.toLowerCase();

        switch (command) {
            case 'on':
                await setAnti('gc', true);
                await setAnti('dm', true);
                await setAnti('status', true);
                return reply('✅ AntiDelete enabled for Groups, DMs, and Status.');

            case 'off':
                await setAnti('gc', false);
                await setAnti('dm', false);
                await setAnti('status', false);
                return reply('❌ AntiDelete disabled for all chats and status.');

            case 'gc':
                const gc = await getAnti('gc');
                await setAnti('gc', !gc);
                return reply(`📣 Group Chat AntiDelete ${!gc ? 'enabled' : 'disabled'}.`);

            case 'dm':
                const dm = await getAnti('dm');
                await setAnti('dm', !dm);
                return reply(`📥 Direct Message AntiDelete ${!dm ? 'enabled' : 'disabled'}.`);

            case 'status':
                const st = await getAnti('status');
                await setAnti('status', !st);
                return reply(`🕒 Status AntiDelete ${!st ? 'enabled' : 'disabled'}.`);

            case 'check':
            case 'status check':
                const allStatus = await getAllAnti();
                return reply(
`📊 *AntiDelete Status:*

👥 Group Chats: ${allStatus.gc ? '✅ Enabled' : '❌ Disabled'}
📥 Direct Messages: ${allStatus.dm ? '✅ Enabled' : '❌ Disabled'}
🕒 Status Updates: ${allStatus.status ? '✅ Enabled' : '❌ Disabled'}`
                );

            default:
                return reply(`
\`🔐 *ANTIDELETE GUIDE* 🔐\`

╭──❮ Main Toggles ❯─⟡
├ • 🟢 \`.antidelete on\` – Enable all (gc, dm, status)
├ • 🟢 \`.antidelete off\` – Disable all
├ • 🟢 \`.antidelete gc\` – Toggle Group Chat
├ • 🟢 \`.antidelete dm\` – Toggle Direct Message
├ • 🟢 \`.antidelete status\` – Toggle Status
╰─────────────⟢

📊 Use \`.antidelete check\` to check current settings.
`);
        }
    } catch (e) {
        console.error("AntiDelete command error:", e);
        return reply("⚠️ An error occurred while processing the command. Check console for details.");
    }
});
