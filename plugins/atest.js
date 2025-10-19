const { cmd } = require("../command");

cmd({
  pattern: "te",
  desc: "Test command with formatted reply",
  category: "utility",
  react: "⚡",
  filename: __filename
}, async (m, conn) => {
  try {
    await conn.sendMessage(
      m.chat, 
      { text: "hello 👋" }, 
      {
        quoted: {
          key: {
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "BAE5F2EB3A64C5A1",
            participant: "0@s.whatsapp.net"
          },
          message: {
            extendedTextMessage: {
              text: "Powering Smart Automation",
              contextInfo: {
                externalAdReply: {
                  title: "WhatsApp Business",
                  body: "Group",
                  thumbnailUrl: "",
                  sourceUrl: "",
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            }
          }
        }
      }
    );
  } catch (error) {
    console.error("Test command error:", error);
    m.reply("❌ An error occurred while sending the test message");
  }
});
