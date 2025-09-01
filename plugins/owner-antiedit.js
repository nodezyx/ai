const { cmd } = require("../command");

cmd({
  pattern: "antiedit",
  alias: ["aedit", "edited"],
  react: '✍️',
  desc: "Owner Only - recover original edited messages",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 This is an owner command.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to an edited message!*"
      }, { quoted: message });
    }

    if (!match.quoted?.contextInfo?.quotedMessage) {
      return await client.sendMessage(from, {
        text: "❌ No original content found for this edited message."
      }, { quoted: message });
    }

    let original = match.quoted.contextInfo.quotedMessage;
    let messageContent = {};
    const options = { quoted: message };

    if (original.conversation) {
      messageContent = { text: original.conversation };
    } else if (original.extendedTextMessage) {
      messageContent = { text: original.extendedTextMessage.text || '' };
    } else if (original.imageMessage) {
      const buffer = await client.downloadMediaMessage(original.imageMessage);
      messageContent = {
        image: buffer,
        caption: original.imageMessage.caption || ''
      };
    } else if (original.videoMessage) {
      const buffer = await client.downloadMediaMessage(original.videoMessage);
      messageContent = {
        video: buffer,
        caption: original.videoMessage.caption || ''
      };
    } else {
      return await client.sendMessage(from, {
        text: "⚠️ This type of edit is not yet supported."
      }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);

  } catch (error) {
    console.error("antiedit Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching original message:\n" + error.message
    }, { quoted: message });
  }
});
