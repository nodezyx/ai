/*const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const util = require("util");
const { getAnti, setAnti, initializeAntiDeleteSettings } = require('../data/antidel');

initializeAntiDeleteSettings();

cmd({
    pattern: "antidelete",
    alias: ['antidel', 'ad'],
    desc: "Sets up the Antidelete",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, reply, q, text, isCreator, fromMe }) => {
    if (!isCreator) return reply('This command is only for the bot owner');
    try {
        const command = q?.toLowerCase();

        switch (command) {
            case 'set all':
                await setAnti('gc', false);
                await setAnti('dm', false);
                return reply('_AntiDelete is now off for Group Chats and Direct Messages._');

            case 'off gc':
                await setAnti('gc', false);
                return reply('_AntiDelete for Group Chats is now disabled._');

            case 'off dm':
                await setAnti('dm', false);
                return reply('_AntiDelete for Direct Messages is now disabled._');

            case 'set gc':
                const gcStatus = await getAnti('gc');
                await setAnti('gc', !gcStatus);
                return reply(`_AntiDelete for Group Chats ${!gcStatus ? 'enabled' : 'disabled'}._`);

            case 'set dm':
                const dmStatus = await getAnti('dm');
                await setAnti('dm', !dmStatus);
                return reply(`_AntiDelete for Direct Messages ${!dmStatus ? 'enabled' : 'disabled'}._`);

            case 'on':
                await setAnti('gc', true);
                await setAnti('dm', true);
                return reply('_AntiDelete set for all chats._');

            case 'status':
                const currentDmStatus = await getAnti('dm');
                const currentGcStatus = await getAnti('gc');
                return reply(`_AntiDelete Status_\n\n*DM AntiDelete:* ${currentDmStatus ? 'Enabled' : 'Disabled'}\n*Group Chat AntiDelete:* ${currentGcStatus ? 'Enabled' : 'Disabled'}`);

            default:
                const helpMessage = `
🔐 *ANTIDELETE COMMAND GUIDE* 🔐

╭────────────────────────╮
🔄 *Main Commands*
│
├ • 🟢 \`.antidelete on\` 
│   Reset AntiDelete for all chats (disabled by default)
│
├ • 🔴 \`.antidelete off gc\` 
│   Disable AntiDelete for Group Chats
│
├ • 🔴 \`.antidelete off dm\` 
│   Disable AntiDelete for Direct Messages
╰────────────────────────╯

╭────────────────────────╮
⚙️ *Toggle Settings*
│
├ • 🔄 \`.antidelete set gc\` 
│   Toggle AntiDelete for Group Chats
│
├ • 🔄 \`.antidelete set dm\` 
│   Toggle AntiDelete for Direct Messages
│
├ • 🔄 \`.antidelete set all\` 
│   Enable AntiDelete for all chats
╰────────────────────────╯

╭────────────────────────╮
ℹ️ *Status Check*
│
├ • 📊 \`.antidelete status\` 
│   Check current AntiDelete status
╰────────────────────────╯
`;
                return reply(helpMessage);
        }
    } catch (e) {
        console.error("Error in antidelete command:", e);
        return reply("An error occurred while processing your request.");
    }
});

*/
const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');
const { getAnti, setAnti, initializeAntiDeleteSettings } = require('../data/antidel');

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
            case 'set all':
                await setAnti('gc', true);
                await setAnti('dm', true);
                await setAnti('status', true);
                return reply('✅ AntiDelete enabled for Groups, DMs, and Status.');

            case 'off':
                await setAnti('gc', false);
                await setAnti('dm', false);
                await setAnti('status', false);
                return reply('❌ AntiDelete disabled for all chats and status.');

            case 'set gc':
                const gc = await getAnti('gc');
                await setAnti('gc', !gc);
                return reply(`📣 Group Chat AntiDelete ${!gc ? 'enabled' : 'disabled'}.`);

            case 'set dm':
                const dm = await getAnti('dm');
                await setAnti('dm', !dm);
                return reply(`📥 Direct Message AntiDelete ${!dm ? 'enabled' : 'disabled'}.`);

            case 'set status':
                const st = await getAnti('status');
                await setAnti('status', !st);
                return reply(`🕒 Status AntiDelete ${!st ? 'enabled' : 'disabled'}.`);

            case 'off gc':
                await setAnti('gc', false);
                return reply('❌ Group Chat AntiDelete is now disabled.');

            case 'off dm':
                await setAnti('dm', false);
                return reply('❌ Direct Message AntiDelete is now disabled.');

            case 'off status':
                await setAnti('status', false);
                return reply('❌ Status AntiDelete is now disabled.');

            case 'status':
                const gcStatus = await getAnti('gc');
                const dmStatus = await getAnti('dm');
                const statusStatus = await getAnti('status');
                return reply(
`📊 *AntiDelete Status:*

👥 Group Chats: ${gcStatus ? '✅ Enabled' : '❌ Disabled'}
📥 Direct Messages: ${dmStatus ? '✅ Enabled' : '❌ Disabled'}
🕒 Status Updates: ${statusStatus ? '✅ Enabled' : '❌ Disabled'}`
                );

            default:
                return reply(`
\`🔐 *ANTIDELETE  GUIDE* 🔐\`

╭──❮ Main Toggles ❯─⟡
├ • 🟢 \`.antidelete on\` – Enable all (gc, dm, status)
├ • 🟢 \`.antidelete off\` – Disable all
├ • 🟢 \`.antidelete set gc\` – Toggle Group Chat
├ • 🟢 \`.antidelete set dm\` – Toggle Direct Message
├ • 🟢 \`.antidelete set status\` – Toggle Status
╰─────────────⟢

📊 Use \`.antidelete status\` to check current settings.
`);
        }
    } catch (e) {
        console.error("AntiDelete error:", e);
        return reply("⚠️ An error occurred while processing the command.");
    }
});
