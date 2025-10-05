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

// Original remini command
cmd({
  pattern: "remini2",
  alias: ["enhance2", "hd2", "upscale2"],
  react: '✨',
  desc: "Enhance photo quality using AI",
  category: "utility",
  use: ".remini [reply to image]",
  filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
  try {
    // Check if quoted message exists and has media
    const quotedMsg = quoted || mek;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini.png' },
        caption: `✨ *AI Image Enhancer*\n\nPlease reply to an image file (JPEG/PNG) to enhance its quality.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

    // Send processing message
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini.png' },
      caption: `✨ *Enhancing Image Quality...*\n\n⏳ Please wait while we process your image...\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
    }, { quoted: mek });

    // Download the media
    const mediaBuffer = await quotedMsg.download();
    const originalSize = formatBytes(mediaBuffer.length);
    
    // Get file extension based on mime type
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini.png' },
        caption: `❌ *Unsupported Format*\n\nPlease use JPEG or PNG images only.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

    // Create temp file
    const tempFilePath = path.join(os.tmpdir(), `remini_input_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // Upload to Catbox
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), `image${extension}`);
    form.append('reqtype', 'fileupload');

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadResponse.data;
    fs.unlinkSync(tempFilePath); // Clean up temp file

    if (!imageUrl) {
      throw "Failed to upload image to Catbox";
    }

    // Enhance image using API
    const apiUrl = `https://api.kimkiro.my.id/tool/upscale?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, { 
      responseType: 'arraybuffer',
      timeout: 60000 // 1 minute timeout
    });

    // Check if response is valid image
    if (!response.data || response.data.length < 100) {
      throw "API returned invalid image data";
    }

    const enhancedSize = formatBytes(response.data.length);

    // Prepare caption with config.FOOTER
    const caption = `✨ *Image Enhanced Successfully!*\n\n` +
                   `📏 *Original Size:* ${originalSize}\n` +
                   `📏 *Enhanced Size:* ${enhancedSize}\n` +
                   `🎯 *Quality:* HD Upscaled\n` +
                   `🤖 *Powered by:* AI Enhancement\n\n` +
                   `${config.FOOTER || '© Created By Mr Frank OFC'}`;

    // Send the enhanced image
    await conn.sendMessage(from, {
      image: response.data,
      caption: caption
    }, { quoted: mek });

  } catch (error) {
    console.error('Image Enhancement Error:', error);
    
    const errorCaption = `❌ *Enhancement Failed*\n\n` +
                        `💡 *Possible reasons:*\n` +
                        `• Image is too large\n` +
                        `• AI service is busy\n` +
                        `• Unsupported image format\n` +
                        `• Network connection issue\n\n` +
                        `🔄 Please try again with a different image.\n\n` +
                        `${config.FOOTER || '© Created By Mr Frank OFC'}`;
    
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini.png' },
      caption: errorCaption
    }, { quoted: mek });
  }
});

// New remini2 command with different API
cmd({
  pattern: "remini3",
  alias: ["enhance3", "hd3", "upscale3"],
  react: '🌟',
  desc: "Enhance photo quality using alternative AI",
  category: "utility",
  use: ".remini2 [reply to image]",
  filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
  try {
    // Check if quoted message exists and has media
    const quotedMsg = quoted || mek;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType || !mimeType.startsWith('image/')) {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini2.png' },
        caption: `🌟 *AI Image Enhancer V2*\n\nPlease reply to an image file (JPEG/PNG) to enhance its quality.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

    // Send processing message
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini2.png' },
      caption: `🌟 *Enhancing Image Quality (V2)...*\n\n⏳ Using alternative AI engine...\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
    }, { quoted: mek });

    // Download the media
    const mediaBuffer = await quotedMsg.download();
    const originalSize = formatBytes(mediaBuffer.length);
    
    // Get file extension based on mime type
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else {
      return await conn.sendMessage(from, {
        image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini2.png' },
        caption: `❌ *Unsupported Format*\n\nPlease use JPEG or PNG images only.\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
      }, { quoted: mek });
    }

    // Create temp file
    const tempFilePath = path.join(os.tmpdir(), `remini2_input_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // Upload to Catbox
    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath), `image${extension}`);
    form.append('reqtype', 'fileupload');

    const uploadResponse = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadResponse.data;
    fs.unlinkSync(tempFilePath); // Clean up temp file

    if (!imageUrl) {
      throw "Failed to upload image to Catbox";
    }

    // Enhance image using alternative API
    const apiUrl = `https://api.zenzxz.my.id/maker/remini?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, { 
      responseType: 'arraybuffer',
      timeout: 60000
    });

    // Check if response is valid image
    if (!response.data || response.data.length < 100) {
      throw "Alternative API returned invalid image data";
    }

    const enhancedSize = formatBytes(response.data.length);

    // Prepare caption with config.FOOTER
    const caption = `🌟 *Image Enhanced Successfully! (V2)*\n\n` +
                   `📏 *Original Size:* ${originalSize}\n` +
                   `📏 *Enhanced Size:* ${enhancedSize}\n` +
                   `🎯 *Quality:* Super HD\n` +
                   `🤖 *Powered by:* Alternative AI Engine\n\n` +
                   `${config.FOOTER || '© Created By Mr Frank OFC'}`;

    // Send the enhanced image
    await conn.sendMessage(from, {
      image: response.data,
      caption: caption
    }, { quoted: mek });

  } catch (error) {
    console.error('Image Enhancement V2 Error:', error);
    
    const errorCaption = `❌ *Enhancement Failed (V2)*\n\n` +
                        `💡 *Possible reasons:*\n` +
                        `• Alternative AI service is busy\n` +
                        `• Image format not supported\n` +
                        `• File size too large\n` +
                        `• Network timeout\n\n` +
                        `🔄 Please try the original .remini command\n\n` +
                        `${config.FOOTER || '© Created By Mr Frank OFC'}`;
    
    await conn.sendMessage(from, {
      image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/remini2.png' },
      caption: errorCaption
    }, { quoted: mek });
  }
});
