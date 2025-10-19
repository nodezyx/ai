const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: "fakecard",
  alias: ["gencard", "fakeid", "cardgen","cc"],
  react: "💳",
  desc: "Generate fake identity cards",
  category: "fun",
  use: ".fakecard",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    // Send waiting message
    await reply("🔄 *Generating fake card... Please wait*");

    // Call the API
    const response = await axios.get('https://draculazyx-xyzdrac.hf.space/api/Card');
    const data = response.data;

    // Format the response
    const cardInfo = `
🎫 *Fake Identity Card* 🎫

👤 *Name*: ${data.name}
⚧ *Gender*: ${data.gender}
🎂 *Birthdate*: ${data.birthdate}
🏠 *Address*: ${data.address}
📞 *Phone*: ${data.phone}
📧 *Email*: ${data.email}
🌍 *Nationality*: ${data.nationality}

💼 *Job*: ${data.jobTitle}
🏢 *Company*: ${data.company}

💳 *Credit Card*:
   - Number: ${data.creditCard.number}
   - Type: ${data.creditCard.type.toUpperCase()}
   - CVV: ${data.creditCard.cvv}
   - Expiry: ${data.creditCard.expiry}

✨ *Creator*: ${data.CREATOR}
✅ *Status*: ${data.STATUS}

> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ
    `;

    // Send the formatted message
    await conn.sendMessage(from, {
      text: cardInfo,
      contextInfo: {
        externalAdReply: {
          title: "Fake Card Generator",
          body: "Powered by Mr Frank OFC",
          thumbnail: Buffer.alloc(0),
          mediaType: 1,
          mediaUrl: 'https://files.catbox.moe/18il7k.jpg',
          sourceUrl: 'https://mrfrankinc.vercel.app'
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error('Error in fakecard command:', error);
    reply("❌ *Failed to generate card. Please try again later.*");
  }
});
