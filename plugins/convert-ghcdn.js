const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { cmd } = require('../command');

// Configuration with fallback options
const CDN_CONFIG = {
  PRIMARY_URL: 'https://mrfrankk-cdn.hf.space',
  FALLBACK_URL: 'https://cdn-mrfrank.onrender.com',
  API_KEY: 'subzero',
  DEFAULT_PATH: 'ice/',
  TIMEOUT: 30000 // 30 seconds timeout
};

// Enhanced extension mapping
function getExtension(mimeType, fileName = '') {
  // First try to get extension from filename if provided
  const fileNameExt = path.extname(fileName).toLowerCase();
  if (fileNameExt) return fileNameExt;

  // Then fall back to mime type mapping
  const extMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/octet-stream': '.bin'
  };

  for (const [type, ext] of Object.entries(extMap)) {
    if (mimeType.includes(type)) return ext;
  }

  return '.dat'; // Final fallback extension
}

// Helper functions
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

async function uploadToCDN(fileBuffer, fileName, mimeType) {
  const form = new FormData();
  form.append('file', fileBuffer, fileName);
  form.append('path', CDN_CONFIG.DEFAULT_PATH);

  const config = {
    headers: {
      ...form.getHeaders(),
      'X-API-Key': CDN_CONFIG.API_KEY
    },
    timeout: CDN_CONFIG.TIMEOUT
  };

  try {
    // Try primary CDN first
    const response = await axios.post(
      `${CDN_CONFIG.PRIMARY_URL}/upload`,
      form,
      config
    );
    return response.data;
  } catch (primaryError) {
    console.log('Primary CDN failed, trying fallback...', primaryError.message);
    
    // Try fallback CDN
    try {
      const fallbackResponse = await axios.post(
        `${CDN_CONFIG.FALLBACK_URL}/upload`,
        form,
        config
      );
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error('Both CDN endpoints failed');
      throw new Error(`Upload failed: ${fallbackError.message}`);
    }
  }
}

function formatResponse(fileName, size, url) {
  return `*📁 CDN Upload Successful*\n\n` +
         `🔖 *Filename:* ${fileName}\n` +
         `📊 *Size:* ${formatBytes(size)}\n` +
         `🔗 *URL:* ${url}\n\n` +
         `_Powered by Mr Frank CDN_`;
}

// Main command handler
cmd({
    pattern: 'cdn',
    alias: ['upload', 'cdnup'],
    react: '⬆️',
    desc: 'Upload files to CDN with custom names',
    category: 'utility',
    use: '<.cdn filename> (reply to media)',
    filename: __filename
}, async (m, sock, { args, reply, quoted }) => {
    let tempFilePath;
    try {
        // Check if we have media to upload
        const media = quoted ? quoted : m;
        const mimeType = media.mimetype || '';
        
        if (!mimeType) {
            return await reply('❌ Please reply to a media file (image, video, audio, etc.)');
        }

        // Download the media
        const mediaBuffer = await media.download();
        if (!mediaBuffer || mediaBuffer.length === 0) {
            throw new Error('Failed to download media');
        }

        // Generate filename
        let fileName = '';
        if (args && args.trim().length > 0) {
            // Use custom filename but ensure it has proper extension
            const customName = args.trim().replace(/[^\w.-]/g, '_');
            const ext = getExtension(mimeType, customName);
            fileName = customName.endsWith(ext) ? customName : `${customName}${ext}`;
        } else {
            // Default filename with timestamp
            const ext = getExtension(mimeType);
            fileName = `file_${Date.now()}${ext}`;
        }

        // Upload to CDN
        const uploadResult = await uploadToCDN(mediaBuffer, fileName, mimeType);
        
        if (!uploadResult || !uploadResult.success) {
            throw new Error(uploadResult?.message || 'Upload failed without error message');
        }

        // Send success response
        await reply(formatResponse(
            fileName,
            mediaBuffer.length,
            uploadResult.cdnUrl || uploadResult.url
        ));

    } catch (error) {
        console.error('CDN Upload Error:', error);
        await reply(`❌ Upload failed: ${error.message}\n\nPlease try again later.`);
    } finally {
        // Clean up temp file if it exists
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath).catch(() => {});
        }
    }
});
