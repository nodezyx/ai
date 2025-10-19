const { cmd } = require('../command');
const { getBuffer, fetchJson } = require('../lib/functions');

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get complete user profile information",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted, participants }) => {
    try {
        // 1. DETERMINE TARGET USER
        let userJid = quoted?.sender || 
                     mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     sender;

        // 2. VERIFY USER EXISTS
        const [user] = await conn.onWhatsApp(userJid).catch(() => []);
        if (!user?.exists) return reply("❌ User not found on WhatsApp");

        // 3. GET PROFILE PICTURE
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // 4. GET NAME (MULTI-SOURCE FALLBACK)
        let userName = userJid.split('@')[0];
        try {
            // Try group participant info first
            if (isGroup) {
                const member = participants.find(p => p.id === userJid);
                if (member?.notify) userName = member.notify;
            }
            
            // Try contact DB
            if (userName === userJid.split('@')[0] && conn.contactDB) {
                const contact = await conn.contactDB.get(userJid).catch(() => null);
                if (contact?.name) userName = contact.name;
            }
            
            // Try presence as final fallback
            if (userName === userJid.split('@')[0]) {
                const presence = await conn.presenceSubscribe(userJid).catch(() => null);
                if (presence?.pushname) userName = presence.pushname;
            }
        } catch (e) {
            console.log("Name fetch error:", e);
        }

        // 5. GET BIO/ABOUT
        let bio = {};
        try {
            // Try personal status
            const statusData = await conn.fetchStatus(userJid).catch(() => null);
            if (statusData?.status) {
                bio = {
                    text: statusData.status,
                    type: "Personal",
                    updated: statusData.setAt ? new Date(statusData.setAt * 1000) : null
                };
            } else {
                // Try business profile
                const businessProfile = await conn.getBusinessProfile(userJid).catch(() => null);
                if (businessProfile?.description) {
                    bio = {
                        text: businessProfile.description,
                        type: "Business",
                        updated: null
                    };
                }
            }
        } catch (e) {
            console.log("Bio fetch error:", e);
        }

        // 6. GET GROUP ROLE
        let groupRole = "";
        if (isGroup) {
            const participant = participants.find(p => p.id === userJid);
            groupRole = participant?.admin ? "👑 Admin" : "👥 Member";
        }

        // 7. FORMAT OUTPUT WITH ENHANCED VISUALS
        const formattedBio = bio.text ? 
            `┌─ 📝 *About*\n` +
            `│  ${bio.text}\n` +
            `└─ 🏷️ ${bio.type} Bio${bio.updated ? ` | ⏳ ${bio.updated.toLocaleString()}` : ''}` : 
            "└─ ❌ No bio available";

        const accountTypeEmoji = user.isBusiness ? "💼" : user.isEnterprise ? "🏢" : "👤";
        const accountTypeText = user.isBusiness ? "Business" : user.isEnterprise ? "Enterprise" : "Personal";

        const userInfo = `
╭─❖ *USER PROFILE* ❖─
│
│  � *Profile Picture* 👇
│
├─❖ *BASIC INFO* ❖─
│  📛 *Name*: ${userName}
│  🔢 *Number*: ${userJid.replace(/@.+/, '')}
│  ${accountTypeEmoji} *Account Type*: ${accountTypeText}
│
├─❖ *BIOGRAPHY* ❖─
${formattedBio.includes('┌─') ? formattedBio : `│  ${formattedBio}`}
│
├─❖ *ACCOUNT STATUS* ❖─
│  ✅ *Registered*: ${user.isUser ? "Yes" : "No"}
│  🛡️ *Verified*: ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}
${isGroup ? `│  � *Group Role*: ${groupRole}\n` : ''}
╰───────────────────
`.trim();

        // 8. SEND RESULT WITH BETTER FORMATTING
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch profile"}`);
    }
});



/* const { cmd } = require('../command');

cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get instant user profile info",
    category: "utility",
    filename: __filename
}, async (m, conn) => {
    try {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1. CONSTANT DECLARATIONS (All variables defined at top)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const FALLBACK_IMAGE = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        const DEFAULT_BIO = 'No bio available';
        const FOOTER = '> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ғʀᴀɴᴋ';

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2. TARGET USER RESOLUTION (REPLY > MENTION > SENDER)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const targetUser = m.quoted?.sender || m.mentioned[0] || m.sender;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. PARALLEL DATA FETCHING (FASTEST POSSIBLE)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const [userData, profilePic] = await Promise.all([
            conn.onWhatsApp(targetUser).then(res => res[0]),
            conn.profilePictureUrl(targetUser, 'image').catch(() => FALLBACK_IMAGE)
        ]);

        if (!userData?.exists) return m.reply("❌ User not found " + FOOTER);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 4. NAME RESOLUTION (GROUP > CONTACT > NUMBER)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const contactName = await conn.getName(targetUser).catch(() => null);
        const groupName = m.isGroup 
            ? m.groupMetadata.participants.find(p => p.id === targetUser)?.notify 
            : null;
        const userName = groupName || contactName || targetUser.split('@')[0];

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 5. BIO/STATUS FETCH (WITH TIMEOUT SAFETY)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const bioFetch = await Promise.race([
            conn.fetchStatus(targetUser),
            new Promise(resolve => setTimeout(resolve, 1500))
        ]);
        const userBio = bioFetch?.status || DEFAULT_BIO;
        const bioUpdateTime = bioFetch?.setAt 
            ? new Date(bioFetch.setAt * 1000).toLocaleString() 
            : null;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 6. GROUP ROLE DETECTION (IF IN GROUP)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const userRole = m.isGroup 
            ? m.groupMetadata.participants.find(p => p.id === targetUser)?.admin 
                ? "👑 Admin" 
                : "👥 Member"
            : null;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 7. COMPILE FINAL MESSAGE (WITH PERFECT FORMATTING)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const finalMessage = `
*👤 USER PROFILE INFORMATION*

🆔 *Name:* ${userName}
📞 *Number:* ${targetUser.replace('@s.whatsapp.net', '')}
📌 *Account Type:* ${userData.isBusiness ? '💼 Business' : '👤 Personal'}

📝 *Bio/Status:*
${userBio}
${bioUpdateTime ? `🕒 *Updated:* ${bioUpdateTime}` : ''}

${userRole ? `👥 *Group Role:* ${userRole}` : ''}

🌐 *Chat Link:* https://wa.me/${targetUser.replace('@s.whatsapp.net', '')}

${FOOTER}
`.trim();

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 8. SEND FINAL RESULT (WITH PROPER MENTIONS)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await conn.sendMessage(m.chat, {
            image: { url: profilePic },
            caption: finalMessage,
            mentions: [targetUser]
        }, { quoted: m });

    } catch (error) {
        const errorMessage = `❌ Error: ${error.message}\n${FOOTER}`;
        m.reply(errorMessage);
    }
});
*/
