const { cmd } = require("../command");

cmd({
  pattern: "wow",
  alias: ["mmm", "save2", "cool", "take","😂"],
  react: '❤️',
  desc: "Forwards quoted message to bot's inbox",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {
    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a message!*"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const botInbox = client.user.id; // Bot's own JID (your inbox)
    const currentTime = new Date().toLocaleString();

    // Create context info
    const contextInfo = `*📥 Saved Message*\n\n` +
                       `*🕒 Time:* ${currentTime}\n` +
                       `*👤 From:* @${message.sender.split('@')[0]}\n` +
                       `*💬 Original Caption:* ${match.quoted.text || 'None'}`;

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: contextInfo,
          mimetype: match.quoted.mimetype || "image/jpeg",
          contextInfo: {
            mentionedJid: [message.sender],
            forwardingScore: 999,
            isForwarded: true
          }
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: contextInfo,
          mimetype: match.quoted.mimetype || "video/mp4",
          contextInfo: {
            mentionedJid: [message.sender],
            forwardingScore: 999,
            isForwarded: true
          }
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: match.quoted.ptt || false,
          contextInfo: {
            mentionedJid: [message.sender],
            forwardingScore: 999,
            isForwarded: true
          }
        };
        break;
      case "documentMessage":
        messageContent = {
          document: buffer,
          mimetype: match.quoted.mimetype,
          fileName: match.quoted.fileName || "document",
          caption: contextInfo
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, audio and document messages are supported"
        }, { quoted: message });
    }

    // Send to bot's inbox
    await client.sendMessage(botInbox, messageContent);

    // Optional: Confirm to user (you can remove this if you want it silent)
   /* await client.sendMessage(from, {
      text: "✅ Message saved to my inbox",
      contextInfo: {
        mentionedJid: [message.sender]
      }
    }, { quoted: message });*/

  } catch (error) {
    console.error("Save Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error saving message:\n" + error.message
    }, { quoted: message });
  }
});
