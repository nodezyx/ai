/*const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const axios = require('axios');
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

function getHarareTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Harare',
        hour12: true,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
}

async function getBotVersion() {
    try {
        if (!config.REPO) return 'Ultimate';
        const repoUrl = config.REPO;
        const rawUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
        const { data } = await axios.get(rawUrl);
        return data.version || 'Ultimate';
    } catch (error) {
        console.error("Version check error:", error);
        return 'Ultimate';
    }
}

function fancy(txt) {
    if (!txt || typeof txt !== 'string') return '';
    const map = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ',
        g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ',
        m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
        s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
        y: 'ʏ', z: 'ᴢ', "1": "𝟏", "2": "𝟐", "3": "𝟑",
        "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖",
        "9": "𝟗", "0": "𝟎", ".": ".", "-": "-", "_": "_"
    };
    return txt.toLowerCase().split('').map(c => map[c] || c).join('');
}

function generateMainMenu(categories) {
    let mainMenu = `*${config.BOT_NAME} MAIN MENU*\n\n`;
    mainMenu += `╭─────────────···◈\n`;
    
    let index = 1;
    for (const category of Object.keys(categories)) {
        mainMenu += `*┋* *${index}. ${category.toUpperCase()}*\n`;
        index++;
    }
    
    mainMenu += `╰─────────────╶╶···◈\n\n`;
    mainMenu += `Reply with the number of the menu you want to see (e.g. 1)\n`;
    return mainMenu;
}

function generateCategoryMenu(categoryName, commandsList) {
    let menu = `*🏮 ${categoryName.toUpperCase()} MENU 🏮*\n\n╭─────────────···◈\n`;
    
    commandsList.forEach(cmd => {
        if (cmd.pattern) {
            menu += `*┋* *⬡ ${config.PREFIX}${fancy(cmd.pattern)}*\n`;
            if (cmd.desc) menu += `*┋* ➤ ${cmd.desc}\n`;
            if (cmd.use) menu += `*┋* ➤ Usage: ${cmd.use}\n`;
            menu += `*┋*\n`;
        }
    });
    
    menu += `╰─────────────╶╶···◈\n\n`;
    menu += `Reply "0" to return to main menu\n`;
    return menu;
}

cmd({
    pattern: "menua",
    desc: "Interactive menu with numbered categories",
    alias: ["helpa", "commands", "list", "cmdlist", "listcmd"],
    category: "menu",
    react: "✅",
    filename: __filename
}, 
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const version = await getBotVersion();
        const totalCommands = commands.filter(cmd => cmd.pattern).length;
        const botname = "𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃";
        const ownername = "𝐌𝐑 𝐅𝐑𝐀𝐍𝐊";

        const subzero = { 
            key: { 
                remoteJid: 'status@broadcast', 
                participant: '0@s.whatsapp.net' 
            }, 
            message: { 
                newsletterAdminInviteMessage: { 
                    newsletterJid: '120363270086174844@newsletter',
                    newsletterName: "𝐈𝐂𝐘 𝐁𝐎𝐓",
                    caption: `${botname} 𝐁𝐘 ${ownername}`, 
                    inviteExpiration: 0
                }
            }
        };

        // Filter valid commands
        const validCommands = commands.filter(cmd => 
            cmd.pattern && 
            cmd.category && 
            cmd.category.toLowerCase() !== 'menu' &&
            !cmd.hideCommand
        );

        // Group commands by category
        const categories = {};
        validCommands.forEach(cmd => {
            const category = cmd.category.toLowerCase();
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        });

        // Generate main menu
        const mainMenu = `
        \`\`\`${config.BOT_NAME}\`\`\`
        
⟣──────────────────⟢
▧ *ᴄʀᴇᴀᴛᴏʀ* : *mr frank (🇿🇼)*
▧ *ᴍᴏᴅᴇ* : *${config.MODE}* 
▧ *ᴘʀᴇғɪx* : *${config.PREFIX}*
▧ *ʀᴀᴍ* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB 
▧ *ᴠᴇʀsɪᴏɴ* : *${version}* 
▧ *ᴜᴘᴛɪᴍᴇ* : ${runtime(process.uptime())} 
▧ *ᴄᴏᴍᴍᴀɴᴅs* : ${totalCommands}
⟣──────────────────⟢

> ＳＵＢＺＥＲＯ - ＭＤ- ＢＯＴ

⟣──────────────────⟢
${readMore}

${generateMainMenu(categories)}

*━━━━━━━━━━━━━━━━━━━━*⁠⁠⁠⁠
> ＭＡＤＥ ＢＹ ＭＲ ＦＲＡＮＫ
*━━━━━━━━━━━━━━━━━━━━━*
`;

        const imageUrl = config.BOT_IMAGE || 'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png';
        
        const menuMessage = await conn.sendMessage(
            from,
            {
                image: { url: imageUrl },
                caption: mainMenu,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363304325601080@newsletter',
                        newsletterName: '🍁『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』🍁 ',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: subzero }
        );

        // Store menu state for this chat
        if (!conn.menuStates) conn.menuStates = {};
        conn.menuStates[from] = {
            currentMenu: 'main',
            categories: Object.keys(categories),
            commandsByCategory: categories,
            menuMessageId: menuMessage.key.id
        };

        // Clean up previous listeners
        if (conn.menuListeners && conn.menuListeners[from]) {
            conn.ev.off('messages.upsert', conn.menuListeners[from]);
        }

        // Set up reply listener
        const listener = async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg.message || msg.key.remoteJid !== from) return;
                
                const menuState = conn.menuStates[from];
                if (!menuState) return;
                
                const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text;
                if (!messageText) return;
                
                // Check if this is a reply to the menu message
                const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === menuState.menuMessageId;
                
                if (isReply) {
                    const selectedNumber = parseInt(messageText.trim());
                    
                    if (menuState.currentMenu === 'main') {
                        // Main menu handling
                        if (!isNaN(selectedNumber) {
                            if (selectedNumber > 0 && selectedNumber <= menuState.categories.length) {
                                const selectedCategory = menuState.categories[selectedNumber - 1];
                                const categoryCommands = menuState.commandsByCategory[selectedCategory];
                                
                                const categoryMenu = generateCategoryMenu(selectedCategory, categoryCommands);
                                
                                await conn.sendMessage(
                                    from,
                                    {
                                        text: categoryMenu,
                                        contextInfo: {
                                            mentionedJid: [m.sender],
                                            forwardingScore: 999,
                                            isForwarded: true
                                        }
                                    },
                                    { quoted: subzero }
                                );
                                
                                // Update menu state
                                menuState.currentMenu = 'category';
                                menuState.currentCategory = selectedCategory;
                            }
                        }
                    } else if (menuState.currentMenu === 'category') {
                        // Category menu handling
                        if (messageText.trim() === '0') {
                            // Return to main menu
                            await conn.sendMessage(
                                from,
                                {
                                    image: { url: imageUrl },
                                    caption: mainMenu,
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 999,
                                        isForwarded: true
                                    }
                                },
                                { quoted: subzero }
                            );
                            menuState.currentMenu = 'main';
                        }
                    }
                }
            } catch (error) {
                console.error('Menu listener error:', error);
            }
        };

        // Store the listener for cleanup
        if (!conn.menuListeners) conn.menuListeners = {};
        conn.menuListeners[from] = listener;
        conn.ev.on('messages.upsert', listener);

        // Set timeout to clean up listener after 5 minutes
        setTimeout(() => {
            if (conn.menuListeners && conn.menuListeners[from]) {
                conn.ev.off('messages.upsert', conn.menuListeners[from]);
                delete conn.menuListeners[from];
                delete conn.menuStates[from];
            }
        }, 5 * 60 * 1000); // 5 minutes

        await conn.sendPresenceUpdate('paused', from);
        
    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ Error generating menu: ${e.message}`);
    }
});
*/
