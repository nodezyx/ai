const config = require('../config');
const { isJidGroup, jidDecode } = require(config.BAILEYS);
const { loadMessage, getAnti } = require('../data');

async function getSenderInfo(conn, jid) {
    try {
        const name = await conn.getName(jid);
        const number = jidDecode(jid)?.user || jid.split('@')[0];
        return { name, number };
    } catch {
        const number = jidDecode(jid)?.user || jid.split('@')[0];
        return { name: number, number };
    }
}

const handleTextDelete = async (conn, mek, jid, info) => {
    const content = mek.message?.conversation || 
                   mek.message?.extendedTextMessage?.text || 
                   '[Media message]';
    
    await conn.sendMessage(jid, {
        text: `🚨 *DELETION ALERT* 🚨\n\n` +
              `📅 *Time:* ${info.time}\n` +
              `${info.isGroup ? `👥 *Group:* ${info.groupName}\n` : ''}` +
              `🗑️ *Deleted by:* ${info.deleter.name} (${info.deleter.number})\n` +
              `✍️ *Sender:* ${info.sender.name} (${info.sender.number})\n\n` +
              `📝 *Content:* ${content}`,
        mentions: [info.deleter.jid, info.sender.jid].filter(Boolean)
    });
};

const handleMediaDelete = async (conn, mek, jid, info) => {
    try {
        // Forward original message first
        const forwarded = await conn.copyNForward(jid, mek, true);
        
        // Send deletion info
        await conn.sendMessage(jid, {
            text: `🚨 *DELETION ALERT* 🚨\n\n` +
                  `📅 *Time:* ${info.time}\n` +
                  `${info.isGroup ? `👥 *Group:* ${info.groupName}\n` : ''}` +
                  `🗑️ *Deleted by:* ${info.deleter.name} (${info.deleter.number})\n` +
                  `✍️ *Sender:* ${info.sender.name} (${info.sender.number})`,
            mentions: [info.deleter.jid, info.sender.jid].filter(Boolean)
        }, { quoted: forwarded });
    } catch (error) {
        console.error('Media forward failed:', error);
        // Fallback to sending just the info
        await conn.sendMessage(jid, {
            text: `🚨 *MEDIA DELETION ALERT* 🚨\n\n` +
                  `📅 *Time:* ${info.time}\n` +
                  `${info.isGroup ? `👥 *Group:* ${info.groupName}\n` : ''}` +
                  `🗑️ *Deleted by:* ${info.deleter.name} (${info.deleter.number})\n` +
                  `✍️ *Sender:* ${info.sender.name} (${info.sender.number})\n` +
                  `📁 *Media type:* ${Object.keys(mek.message)[0]}`,
            mentions: [info.deleter.jid, info.sender.jid].filter(Boolean)
        });
    }
};

const handleStatusDelete = async (conn, mek, jid, info) => {
    try {
        // Try to forward status first
        const forwarded = await conn.copyNForward(jid, mek, true);
        
        await conn.sendMessage(jid, {
            text: `⚠️ *STATUS DELETION* ⚠️\n\n` +
                  `📅 *Time:* ${info.time}\n` +
                  `👤 *User:* ${info.sender.name} (${info.sender.number})`,
            mentions: [info.sender.jid]
        }, { quoted: forwarded });
    } catch (error) {
        console.error('Status forward failed:', error);
        await conn.sendMessage(jid, {
            text: `⚠️ *STATUS DELETION* ⚠️\n\n` +
                  `📅 *Time:* ${info.time}\n` +
                  `👤 *User:* ${info.sender.name} (${info.sender.number})\n` +
                  `📁 *Media type:* ${Object.keys(mek.message)[0]}`,
            mentions: [info.sender.jid]
        });
    }
};

const AntiDelete = async (conn, updates) => {
    for (const update of updates) {
        if (update.update.message === null) {
            try {
                const store = await loadMessage(update.key.id);
                if (!store?.message) continue;

                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const isStatus = store.jid.includes('status@broadcast');
                const antiDeleteStatus = await getAnti(isGroup ? 'gc' : 'dm');
                
                if (!antiDeleteStatus) continue;

                const time = new Date().toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                // Get participant info
                const senderJid = mek.key.participant || mek.key.remoteJid;
                const deleterJid = update.key.participant || update.key.remoteJid;
                
                const [sender, deleter] = await Promise.all([
                    getSenderInfo(conn, senderJid),
                    getSenderInfo(conn, deleterJid)
                ]);

                const info = {
                    time,
                    isGroup,
                    sender: { ...sender, jid: senderJid },
                    deleter: { ...deleter, jid: deleterJid },
                    groupName: isGroup ? (await conn.groupMetadata(store.jid)).subject : null
                };

                if (isStatus) {
                    await handleStatusDelete(conn, mek, conn.user.id, info);
                } else if (mek.message?.conversation || mek.message?.extendedTextMessage) {
                    await handleTextDelete(conn, mek, conn.user.id, info);
                } else {
                    await handleMediaDelete(conn, mek, conn.user.id, info);
                }
            } catch (error) {
                console.error('AntiDelete error:', error);
            }
        }
    }
};

module.exports = {
    AntiDelete
};
