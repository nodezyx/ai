const config = require('../config');
const { isJidGroup } = require(config.BAILEYS);
//const config = require('../config');

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363304325601080@newsletter',
            newsletterName: '𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

const welcomeImages = [
    'https://files.catbox.moe/m31j88.jpg', // Colorful welcome image
    'https://files.catbox.moe/m31j88.jpg', // Party welcome image
    'https://files.catbox.moe/m31j88.jpg'  // Flowers welcome image
];

const goodbyeImages = [
    'https://files.catbox.moe/m31j88.jpg', // Sad goodbye image
    'https://files.catbox.moe/m31j88.jpg', // Sunset goodbye image
    'https://files.catbox.moe/m31j88.jpg'  // Door closing goodbye image
];

const GroupEvents = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString();

            if (update.action === "add" && config.WELCOME_GOODBYE === "true") {
                const welcomeImg = welcomeImages[Math.floor(Math.random() * welcomeImages.length)];
                const WelcomeText = `
╔═════════════⟢
║  🎊 𝗪𝗘𝗟𝗖𝗢𝗠𝗘  🎊
╠═════════════⟢
║  👋 𝗛𝗲𝘆 @${userName}!
║  🌟 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘁𝗼: *${metadata.subject}*
║  
║  🧮 𝗠𝗲𝗺𝗯𝗲𝗿 𝗡𝗼: ${groupMembersCount}
║  🕒 𝗝𝗼𝗶𝗻𝗲𝗱: ${timestamp}
║  
║  📜 𝗚𝗿𝗼𝘂𝗽 𝗗𝗲𝘀𝗰:
║  ${desc}
║  
> ║  💫 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 ${config.BOT_NAME}
╚═════════════⟢
                `.trim();

                await conn.sendMessage(update.id, {
                    image: { url: welcomeImg },
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } else if (update.action === "remove" && config.WELCOME_GOODBYE === "true") {
                const goodbyeImg = goodbyeImages[Math.floor(Math.random() * goodbyeImages.length)];
                const GoodbyeText = `
╔════════════⟢
║  😢 𝗚𝗢𝗢𝗗𝗕𝗬𝗘  😢
╠════════════⟢
║  👋 𝗙𝗮𝗿𝗲𝘄𝗲𝗹𝗹 @${userName}!
║  
║  🕒 𝗟𝗲𝗳𝘁 𝗮𝘁: ${timestamp}
║  👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀 𝗻𝗼𝘄: ${groupMembersCount}
║  
║  🌌 𝗪𝗲 𝘄𝗶𝗹𝗹 𝗺𝗶𝘀𝘀 𝘆𝗼𝘂!
║  🚪 𝗗𝗼𝗼𝗿 𝗶𝘀 𝗮𝗹𝘄𝗮𝘆𝘀 𝗼𝗽𝗲𝗻 𝗳𝗼𝗿 �𝘆𝗼𝘂
║  
> ║ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 ${config.BOT_NAME}
╚════════════⟢
                `.trim();

                await conn.sendMessage(update.id, {
                    image: { url: goodbyeImg },
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } else if (update.action === "demote" && config.ADMIN_EVENTS === "true") {
                const demoter = update.author.split("@")[0];
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@${demoter} has demoted @${userName} from admin. 👀\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject}`,
                    mentions: [update.author, num],
                    contextInfo: getContextInfo({ sender: update.author }),
                });

            } else if (update.action === "promote" && config.ADMIN_EVENTS === "true") {
                const promoter = update.author.split("@")[0];
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@${promoter} has promoted @${userName} to admin. 🎉\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject}`,
                    mentions: [update.author, num],
                    contextInfo: getContextInfo({ sender: update.author }),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;





/*const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363304325601080@newsletter',
            newsletterName: '𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString();

            if (update.action === "add" && config.WELCOME_GOODBYE === "true") {
                const WelcomeText = `Hey @${userName} 👋\n` +
                    `Welcome to *${metadata.subject}*.\n` +
                    `You are member number ${groupMembersCount} in this group. 🙏\n` +
                    `Time joined: *${timestamp}*\n` +
                    `Please read the group description to avoid being removed:\n` +
                    `${desc}\n` +
                    `*Powered by ${config.BOT_NAME}*.`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } else if (update.action === "remove" && config.WELCOME_GOODBYE === "true") {
                const GoodbyeText = `Goodbye @${userName}. 😔\n` +
                    `Another member has left the group.\n` +
                    `Time left: *${timestamp}*\n` +
                    `The group now has ${groupMembersCount} members. 😭`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } else if (update.action === "demote" && config.ADMIN_EVENTS === "true") {
                const demoter = update.author.split("@")[0];
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@${demoter} has demoted @${userName} from admin. 👀\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject}`,
                    mentions: [update.author, num],
                    contextInfo: getContextInfo({ sender: update.author }),
                });

            } else if (update.action === "promote" && config.ADMIN_EVENTS === "true") {
                const promoter = update.author.split("@")[0];
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@${promoter} has promoted @${userName} to admin. 🎉\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject}`,
                    mentions: [update.author, num],
                    contextInfo: getContextInfo({ sender: update.author }),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;
*/
