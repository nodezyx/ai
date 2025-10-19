/*const { cmd } = require('../command');

cmd({
    pattern: "online",
    alias: ["whosonline", "onlinemembers"],
    desc: "Check who's online in the group (Admins & Owner only)",
    category: "main",
    react: "🟢",
    filename: __filename
},
async (conn, mek, m, { from, quoted, isGroup, isAdmins, isCreator, fromMe, reply }) => {
    try {
        // Check if the command is used in a group
        if (!isGroup) return reply("╭─「 ❌ ERROR 」\n│\n│ This command can only be used in a group!\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ");

        // Check if user is either creator or admin
        if (!isCreator && !isAdmins && !fromMe) {
            return reply("╭─「 ❌ PERMISSION DENIED 」\n│\n│ Only bot owner and group admins\n│ can use this command!\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ");
        }

        // Animated searching message
        const progress = ["▱▱▱▱▱▱▱▱▱▱", "▰▱▱▱▱▱▱▱▱▱", "▰▰▰▱▱▱▱▱▱▱", "▰▰▰▰▰▱▱▱▱▱", "▰▰▰▰▰▰▰▱▱▱", "▰▰▰▰▰▰▰▰▰▱", "▰▰▰▰▰▰▰▰▰▰"];
        let progressMsg = await conn.sendMessage(from, { 
            text: `╭─「 🔍 SCANNING 」\n│\n│ Detecting online members...\n│ ${progress[0]} 0%\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ` 
        }, { quoted: mek });

        for (let i = 1; i < progress.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await conn.sendMessage(from, { 
                text: `╭─「 🔍 SCANNING 」\n│\n│ Detecting online members...\n│ ${progress[i]} ${i*15}%\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`,
                edit: progressMsg.key 
            });
        }

        const onlineMembers = new Set();
        const groupData = await conn.groupMetadata(from);
        const presencePromises = [];

        // Request presence updates
        for (const participant of groupData.participants) {
            presencePromises.push(
                conn.presenceSubscribe(participant.id)
                    .then(() => conn.sendPresenceUpdate('composing', participant.id))
            );
        }

        await Promise.all(presencePromises);

        // Presence handler
        const presenceHandler = (json) => {
            for (const id in json.presences) {
                const presence = json.presences[id]?.lastKnownPresence;
                if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                    onlineMembers.add(id);
                }
            }
        };

        conn.ev.on('presence.update', presenceHandler);

        // Multiple checks
        const checks = 3;
        const checkInterval = 5000;
        let checksDone = 0;

        const checkOnline = async () => {
            checksDone++;
            
            if (checksDone >= checks) {
                clearInterval(interval);
                conn.ev.off('presence.update', presenceHandler);
                
                if (onlineMembers.size === 0) {
                    return reply("╭─「 ⚠️ NO RESULTS 」\n│\n│ Couldn't detect any online members.\n│ They might be hiding their presence.\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ");
                }
                
                const onlineArray = Array.from(onlineMembers);
                const onlineList = onlineArray.map((member, index) => 
                    `│ ${index + 1}. @${member.split('@')[0]}`
                ).join('\n');
                
                const message = `╭─「 🟢 ONLINE MEMBERS 」\n│\n│ 📊 Status: ${onlineArray.length}/${groupData.participants.length} online\n│\n${onlineList}\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`;
                
                await conn.sendMessage(from, { 
                    text: message,
                    mentions: onlineArray
                }, { quoted: mek });
            }
        };

        const interval = setInterval(checkOnline, checkInterval);

    } catch (e) {
        console.error("Error in online command:", e);
        reply(`╭─「 ❌ ERROR 」\n│\n│ ${e.message}\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`);
    }
});


cmd({
    pattern: "listonline",
    alias: ["whosonline", "onlinemembers"],
    desc: "Check who's online (in group and DMs) - Admins & Owner only",
    category: "main",
    react: "🟢",
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, isAdmins, isCreator, fromMe, reply }) => {
    try {
        // Check permissions
        if (!isCreator && !isAdmins && !fromMe) {
            return reply("╭─「 ❌ PERMISSION DENIED 」\n│\n│ Only bot owner and group admins\n│ can use this command!\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ");
        }

        // Animated searching message
        const progress = ["▱▱▱▱▱▱▱▱▱▱", "▰▱▱▱▱▱▱▱▱▱", "▰▰▰▱▱▱▱▱▱▱", "▰▰▰▰▰▱▱▱▱▱", "▰▰▰▰▰▰▰▱▱▱", "▰▰▰▰▰▰▰▰▰▱", "▰▰▰▰▰▰▰▰▰▰"];
        let progressMsg = await reply(`╭─「 🔍 SCANNING 」\n│\n│ Detecting online contacts...\n│ ${progress[0]} 0%\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`);

        for (let i = 1; i < progress.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await conn.sendMessage(from, { 
                text: `╭─「 🔍 SCANNING 」\n│\n│ Detecting online contacts...\n│ ${progress[i]} ${i*15}%\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`,
                edit: progressMsg.key 
            });
        }

        const onlineContacts = new Set();

        // Check group members if in group
        if (isGroup) {
            const groupData = await conn.groupMetadata(from);
            const presencePromises = [];

            for (const participant of groupData.participants) {
                presencePromises.push(
                    conn.presenceSubscribe(participant.id)
                    .then(() => conn.sendPresenceUpdate('composing', participant.id))
                );
            }

            await Promise.all(presencePromises);
        }

        // Presence handler for both group and DMs
        const presenceHandler = (json) => {
            for (const id in json.presences) {
                const presence = json.presences[id]?.lastKnownPresence;
                if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                    onlineContacts.add(id);
                }
            }
        };

        conn.ev.on('presence.update', presenceHandler);

        // Multiple checks with delay
        await new Promise(resolve => setTimeout(resolve, 10000));
        conn.ev.off('presence.update', presenceHandler);

        if (onlineContacts.size === 0) {
            return reply("╭─「 ⚠️ NO RESULTS 」\n│\n│ Couldn't detect any online contacts.\n│ They might be hiding their presence.\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ");
        }

        const onlineArray = Array.from(onlineContacts);
        const onlineList = onlineArray.map((contact, index) => 
            `│ ${index + 1}. @${contact.split('@')[0]}`
        ).join('\n');

        // Send to group (if in group)
        if (isGroup) {
            await conn.sendMessage(from, { 
                text: `╭─「 🟢 GROUP ONLINE 」\n│\n│ 📊 Online Contacts: ${onlineArray.length}\n│\n${onlineList}\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`,
                mentions: onlineArray
            });
        }

        // Always send to sender's DM
        await conn.sendMessage(sender, { 
            text: `╭─「 📱 YOUR CONTACTS ONLINE 」\n│\n│ 🕒 ${new Date().toLocaleTimeString()}\n│\n${onlineList}\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`,
            mentions: onlineArray
        });

    } catch (e) {
        console.error("Error in online command:", e);
        reply(`╭─「 ❌ ERROR 」\n│\n│ ${e.message}\n╰───────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ sᴜʙᴢᴇʀᴏ`);
    }
});


*/ const { cmd } = require('../command');

cmd({
    pattern: "online",
    alias: ["whosonline", "onlinemembers"],
    desc: "Check who's online in the group (Admins & Owner only)",
    category: "main",
    react: "🟢",
    filename: __filename
},
async (conn, mek, m, { from, quoted, isGroup, isAdmins, isCreator, fromMe, reply }) => {
    try {
        // Check if the command is used in a group
        if (!isGroup) return reply("❌ This command can only be used in a group!");

        // Check if user is either creator or admin
        if (!isCreator && !isAdmins && !fromMe) {
            return reply("❌ Only bot owner and group admins can use this command!");
        }

        // Inform user that we're checking
        await reply("🔄 Scanning for online members... This may take 15-20 seconds.");

        const onlineMembers = new Set();
        const groupData = await conn.groupMetadata(from);
        const presencePromises = [];

        // Request presence updates for all participants
        for (const participant of groupData.participants) {
            presencePromises.push(
                conn.presenceSubscribe(participant.id)
                    .then(() => {
                        // Additional check for better detection
                        return conn.sendPresenceUpdate('composing', participant.id);
                    })
            );
        }

        await Promise.all(presencePromises);

        // Presence update handler
        const presenceHandler = (json) => {
            for (const id in json.presences) {
                const presence = json.presences[id]?.lastKnownPresence;
                // Check all possible online states
                if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                    onlineMembers.add(id);
                }
            }
        };

        conn.ev.on('presence.update', presenceHandler);

        // Longer timeout and multiple checks
        const checks = 3;
        const checkInterval = 5000; // 5 seconds
        let checksDone = 0;

        const checkOnline = async () => {
            checksDone++;
            
            if (checksDone >= checks) {
                clearInterval(interval);
                conn.ev.off('presence.update', presenceHandler);
                
                if (onlineMembers.size === 0) {
                    return reply("⚠️ Couldn't detect any online members. They might be hiding their presence.");
                }
                
                const onlineArray = Array.from(onlineMembers);
                const onlineList = onlineArray.map((member, index) => 
                    `${index + 1}. @${member.split('@')[0]}`
                ).join('\n');
                
                const message = `🚦 *Online Members* (${onlineArray.length}/${groupData.participants.length}):\n\n${onlineList}`;
                
                await conn.sendMessage(from, { 
                    text: message,
                    mentions: onlineArray
                }, { quoted: mek });
            }
        };

        const interval = setInterval(checkOnline, checkInterval);

    } catch (e) {
        console.error("Error in online command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

