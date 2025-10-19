//const converter = require('../data/converter');
const stickerConverter = require('../data/sticker-converter');
const { cmd } = require('../command');

cmd({
    pattern: 'tophoto',
    alias: ['sticker2img', 'stoimg', 'stickertoimage', 's2i'],
    desc: 'Convert stickers to images',
    category: 'media',
    react: '🖼️',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!message.quoted) {
        return await client.sendMessage(from, {
            text: "✨ *Sticker Converter*\n\nPlease reply to a sticker message\n\nExample: `.convert` (reply to sticker)"
        }, { quoted: message });
    }

    if (message.quoted.mtype !== 'stickerMessage') {
        return await client.sendMessage(from, {
            text: "❌ Only sticker messages can be converted"
        }, { quoted: message });
    }

    // Send processing message
    await client.sendMessage(from, {
        text: "🔄 Converting sticker to image..."
    }, { quoted: message });

    try {
        const stickerBuffer = await message.quoted.download();
        const imageBuffer = await stickerConverter.convertStickerToImage(stickerBuffer);

        // Send result
        await client.sendMessage(from, {
            image: imageBuffer,
            caption: "> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ",
            mimetype: 'image/png'
        }, { quoted: message });

    } catch (error) {
        console.error('Conversion error:', error);
        await client.sendMessage(from, {
            text: "❌ Please try with a different sticker."
        }, { quoted: message });
    }
});
