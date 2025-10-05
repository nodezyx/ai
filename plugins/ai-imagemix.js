const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { cmd } = require("../command");
const config = require('../config');

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

cmd({
  pattern: "imagemix",
  alias: ["imgmix", "editimg"],
  react: '🧠',
  desc: "Edit image using AI with a custom prompt",
  category: "img_edit",
  use: ".imix <prompt> [reply to image]",
  filename: __filename
}, async (conn, message, m, { reply, text, from }) => {
  try {
    if (!text) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/imix.png' },
        caption: `🧠 *AI Image Editor*\n\n✍️ Please provide a prompt for image editing.\n\n*Example:*\n${config.PREFIX || '.'}imix add a boy in with this girl\n\n💡 *Reply to an image* with your editing instructions\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: message });
    }

    // Check for quoted image
    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    if (!mimeType || !mimeType.startsWith('image/')) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/imix.png' },
        caption: `📸 *Image Required*\n\nPlease reply to an *image* (JPEG or PNG) that you want to edit.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: message });
    }

    // Send processing message
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/imix.png' },
      caption: `🧠 *AI Image Editing Started...*\n\n📝 *Prompt:* ${text}\n\n⏳ Processing your image edit...\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
    }, { quoted: message });

    // Download media
    const mediaBuffer = await quotedMsg.download();
    const fileSize = formatBytes(mediaBuffer.length);

    // Determine extension
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/imix.png' },
        caption: `❌ *Unsupported Format*\n\nPlease use JPEG or PNG images only.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: message });
    }

    // Save to temp file
    const tempFilePath = path.join(os.tmpdir(), `imix_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // Upload to Catbox
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), `image${extension}`);
    form.append('reqtype', 'fileupload');

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadResponse.data;
    fs.unlinkSync(tempFilePath); // Clean temp

    if (!imageUrl || !imageUrl.startsWith('https')) {
      throw new Error("Failed to upload image to Catbox.");
    }

    // Call ZenZ API with prompt
    const apiUrl = `https://api.zenzxz.my.id/maker/imagedit?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/imix.png' },
        caption: `⚠️ *API Error*\n\nAI service did not return a valid image. Try again later.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: message });
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    // Prepare caption with config.FOOTER
    const caption = `🧠 *AI Image Edit Completed!*\n\n` +
                   `📏 *Original Size:* ${fileSize}\n` +
                   `📝 *Edit Prompt:* ${text}\n` +
                   `✨ *Enhanced with:* AI Image Editing\n\n` +
                   `${config.FOOTER || '© Created By Mr Frank OFC'}`;

    // Send edited image
    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: caption
    }, { quoted: message });

  } catch (error) {
    console.error("Imix Error:", error);
    
    const errorCaption = `❌ *Image Edit Failed*\n\n` +
                        `💡 *Possible reasons:*\n` +
                        `• AI service is busy\n` +
                        `• Prompt was too complex\n` +
                        `• Image format not supported\n` +
                        `• Network connection issue\n\n` +
                        `🔄 Please try again with a different image or prompt.\n\n` +
                        `${config.FOOTER || '© Created By Mr Frank OFC'}`;
    
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/imix.png' },
      caption: errorCaption
    }, { quoted: message });
  }
});
