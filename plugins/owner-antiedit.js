const { cmd } = require("../command");

let antiEditEnabled = false;
if (!global.msgStore) global.msgStore = {};

// Store every incoming message
const registerAntiEditListener = (client) => {
  client.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    global.msgStore[msg.key.id] =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      "[media]";
  });

  // Listen for edits
  client.ev.on("messages.update", async (updates) => {
    if (!antiEditEnabled) return;

    for (const update of updates) {
      try {
        if (update.update?.editedMessage) {
          const key = update.key;
          const jid = key.remoteJid;

          const oldMessage = global.msgStore?.[key.id];
          const newMessage =
            update.update.editedMessage.message?.conversation ||
            update.update.editedMessage.message?.extendedTextMessage?.text ||
            update.update.editedMessage.message?.imageMessage?.caption ||
            update.update.editedMessage.message?.videoMessage?.caption ||
            "[media]";

          if (oldMessage && oldMessage !== newMessage) {
            await client.sendMessage(jid, {
              text: `✍️ *Anti-Edit Alert!*\n\n*Original:* ${oldMessage}\n*Edited:* ${newMessage}`
            });
          }
        }
      } catch (e) {
        console.error("AntiEdit Error:", e);
      }
    }
  });
};

cmd({
  pattern: "antiedit",
  alias: ["aedit", "toggleedit"],
  react: '✍️',
  desc: "Owner Only - toggle anti-edit on/off",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (match && match.trim().toLowerCase() === "on") {
      antiEditEnabled = true;
      registerAntiEditListener(client);
      return await client.sendMessage(from, {
        text: "✅ Anti-Edit has been *ENABLED*."
      }, { quoted: message });
    }

    if (match && match.trim().toLowerCase() === "off") {
      antiEditEnabled = false;
      return await client.sendMessage(from, {
        text: "❌ Anti-Edit has been *DISABLED*."
      }, { quoted: message });
    }

    return await client.sendMessage(from, {
      text: `⚙️ Anti-Edit is currently *${antiEditEnabled ? "ON" : "OFF"}*\n\nUse:\n.antiedit on\n.antiedit off`
    }, { quoted: message });

  } catch (error) {
    console.error("antiedit command Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error:\n" + error.message
    }, { quoted: message });
  }
});
