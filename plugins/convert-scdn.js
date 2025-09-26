/*const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const SUPABASE_CONFIG = {
  URL: 'https://hzhzxdopkuopvvultayn.supabase.co',
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6aHp4ZG9wa3VvcHZ2dWx0YXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Mzg4MzIsImV4cCI6MjA3NDAxNDgzMn0.8DPHbJ9sUV1wZKmc1-rBPISTCv59WJ8CGsn1_krJeLo',
  BUCKET: 'mrfrankofc'
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

// Enhanced extension mapping
function getExtension(mimeType) {
  const extMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/x-matroska': '.mkv',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'text/plain': '.txt',
    'application/json': '.json'
  };

  for (const [type, ext] of Object.entries(extMap)) {
    if (mimeType.includes(type)) return ext;
  }
  return '.dat';
}

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function cleanTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Temp file cleanup failed:', err);
    }
  }
}

function formatResponse(fileName, size, url, directUrl = '') {
  let response = `*📁 Supabase CDN Upload Successful*\n\n` +
         `🔖 *Filename:* ${fileName}\n` +
         `📊 *Size:* ${formatBytes(size)}\n` +
         `🔗 *CDN URL:* ${url}\n\n`;
  
  if (directUrl) {
    response += `🌐 *Direct URL:* ${directUrl}\n\n`;
  }
  
  response += `_Powered by Supabase CDN_`;
  
  return response;
}

// Command handler
cmd({
    pattern: 'cdn',
    alias: ['upload', 'cdnup', 'supabase'],
    react: '⬆️',
    desc: 'Upload files to Supabase CDN with custom names',
    category: 'utility',
    use: '<.cdn filename> (reply to media)',
    filename: __filename
}, async (m, sock, { args, reply, quoted }) => {
    let tempFilePath;
    try {
        const media = quoted ? quoted : m;
        const mimeType = media.mimetype || '';
        
        if (!mimeType) {
            return await reply('❌ Please reply to a media file');
        }

        const mediaBuffer = await media.download();
        tempFilePath = path.join(os.tmpdir(), `supabase_temp_${Date.now()}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        // Get the correct extension for the mime type
        const extension = getExtension(mimeType);
        
        // Process filename
        let fileName;
        if (args && args.trim().length > 0) {
            // Use custom name but ensure it has the correct extension
            const baseName = args.trim().replace(/[^\w.-]/g, '_');
            fileName = `${baseName}${extension}`;
        } else {
            // Fallback to timestamp if no name provided
            fileName = `file_${Date.now()}${extension}`;
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(SUPABASE_CONFIG.BUCKET)
          .upload(`uploads/${fileName}`, fs.createReadStream(tempFilePath), {
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType
          });

        if (error) {
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(SUPABASE_CONFIG.BUCKET)
          .getPublicUrl(data.path);

        const cdnUrl = urlData.publicUrl;
        
        // Generate direct URL (if you have a proxy setup)
        const directUrl = `https://cdn.mrfrankofc.gleeze.com/${fileName}`;

        await reply(formatResponse(
            fileName,
            mediaBuffer.length,
            cdnUrl,
            directUrl
        ));

    } catch (error) {
        console.error('Supabase CDN Error:', error);
        await reply(`❌ Error: ${error.message}`);
    } finally {
        cleanTempFile(tempFilePath);
    }
});

// Additional command to list files
cmd({
    pattern: 'cdnlist',
    alias: ['listfiles', 'cdnfiles'],
    react: '📋',
    desc: 'List files in Supabase CDN',
    category: 'utility',
    use: '<.cdnlist>',
    filename: __filename
}, async (m, sock, { reply }) => {
    try {
        const { data, error } = await supabase.storage
          .from(SUPABASE_CONFIG.BUCKET)
          .list('uploads', {
            limit: 10,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }

        if (!data || data.length === 0) {
            return await reply('No files found in CDN storage.');
        }

        let fileList = '*📁 Files in CDN Storage:*\n\n';
        data.forEach((file, index) => {
            fileList += `${index + 1}. ${file.name}\n`;
        });

        fileList += `\n_Use .cdnget <filename> to retrieve a file_`;
        
        await reply(fileList);

    } catch (error) {
        console.error('CDN List Error:', error);
        await reply(`❌ Error: ${error.message}`);
    }
});

// Command to get a file URL
cmd({
    pattern: 'cdnget',
    alias: ['getfile', 'cdnurl'],
    react: '🔍',
    desc: 'Get URL for a specific file in CDN',
    category: 'utility',
    use: '<.cdnget filename>',
    filename: __filename
}, async (m, sock, { args, reply }) => {
    try {
        if (!args || args.trim().length === 0) {
            return await reply('❌ Please provide a filename. Example: .cdnget myfile.jpg');
        }

        const fileName = args.trim();
        const filePath = `uploads/${fileName}`;

        // Check if file exists
        const { data: listData } = await supabase.storage
          .from(SUPABASE_CONFIG.BUCKET)
          .list('uploads', {
            search: fileName,
          });

        if (!listData || listData.length === 0) {
            return await reply(`❌ File "${fileName}" not found in CDN storage.`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(SUPABASE_CONFIG.BUCKET)
          .getPublicUrl(filePath);

        await reply(`🔗 *File URL:* ${urlData.publicUrl}\n\n` +
                   `🌐 *Direct URL:* https://cdn.mrfrankofc.gleeze.com/${fileName}`);

    } catch (error) {
        console.error('CDN Get Error:', error);
        await reply(`❌ Error: ${error.message}`);
    }
});

// Command to delete a file
cmd({
    pattern: 'cdndel',
    alias: ['deletefile', 'cdndelete'],
    react: '🗑️',
    desc: 'Delete a file from Supabase CDN',
    category: 'utility',
    use: '<.cdndel filename>',
    filename: __filename
}, async (m, sock, { args, reply }) => {
    try {
        if (!args || args.trim().length === 0) {
            return await reply('❌ Please provide a filename. Example: .cdndel myfile.jpg');
        }

        const fileName = args.trim();
        const filePath = `uploads/${fileName}`;

        const { data, error } = await supabase.storage
          .from(SUPABASE_CONFIG.BUCKET)
          .remove([filePath]);

        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }

        await reply(`✅ File "${fileName}" successfully deleted from CDN.`);

    } catch (error) {
        console.error('CDN Delete Error:', error);
        await reply(`❌ Error: ${error.message}`);
    }
});

// Add this to your existing code
module.exports = {
  supabase, // Export supabase client for use in other modules
  SUPABASE_CONFIG
};
*/
