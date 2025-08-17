
const { cmd } = require('../command');
const config = require('../config');

const recentCallers = new Set(); // Prevent message spam

cmd({
  on: "body"
}, async (conn, mek, m, { from }) => {
  try {
    conn.ev.on("call", async (json) => {
      if (config.ANTICALL !== "true") return;

      for (const id of json) {
        if (id.status === "offer" && !id.isGroup) {
          await conn.rejectCall(id.id, id.from);

          // Only send warning once per user per session
          if (!recentCallers.has(id.from)) {
            recentCallers.add(id.from);

            await conn.sendMessage(id.from, {
              text: `*📵 Call rejected automatically!*\n\n*Owner is busy, please do not call!* ⚠️`,
              mentions: [id.from]
            });

            // Optional: clear after 10 minutes (prevent memory leaks)
            setTimeout(() => recentCallers.delete(id.from), 10 * 60 * 1000);
          }
        }
      }
    });
  } catch (e) {
    console.error(e);
    await conn.sendMessage(from, { text: `⚠️ Error: ${e.message}` }, { quoted: m });
  }
});

/*
const { cmd, commands } = require('../command');
const config = require('../config')

cmd({
     on:"body"},async(conn,mek,m,{from,body,isCmd,isGroup,isOwner,isAdmins,groupAdmins,isBotAdmins,sender,pushname,groupName,quoted})=>{
try{
conn.ev.on("call", async(json) => {
	  if(config.ANTI_CALL === "true") { 
    	for(const id of json) {
    		if(id.status == "offer") {
    			if(id.isGroup == false) {
    				await conn.rejectCall(id.id, id.from);
				
				if ( mek.key.fromMe) return await conn.sendMessage(id.from, {
    					text: `*Call rejected automatically because owner is busy ⚠️*`, 
							mentions: [id.from]
    				});
	
    			} else {
    				await conn.rejectCall(id.id, id.from);
    			}
    		}
    	}}
    });
} catch (e) {
console.log(e)
reply(e)
}}
) */

/*
const { cmd, commands } = require('../command');
const config = require('../config');

// Register the call event listener only once when the bot starts
// This should be in your main bot initialization code, not inside a command
function setupAntiCall(conn) {
    conn.ev.on("call", async (json) => {
        if (config.ANTI_CALL === "true") {
            for (const id of json) {
                if (id.status == "offer") {
                    if (id.isGroup == false) {
                        await conn.rejectCall(id.id, id.from);
                        
                        // Only send message if not from the bot itself
                        if (!id.fromMe) {
                            await conn.sendMessage(id.from, {
                                text: `*Call rejected automatically because owner is busy ⚠️*`,
                                mentions: [id.from]
                            });
                        }
                    } else {
                        await conn.rejectCall(id.id, id.from);
                    }
                }
            }
        }
    });
}

// Command handler (if you still need this for something)
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isCmd, isGroup, isOwner, isAdmins, groupAdmins, isBotAdmins, sender, pushname, groupName, quoted }) => {
    // Your command logic here
    // Don't put the call event listener here
});

// Export the setup function to be called when bot starts
module.exports = { setupAntiCall };*/
