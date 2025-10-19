/*const converter = require('../data/mediaconverter');
const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');
const { getRandomString, getExtensionFromMime } = require('../lib/tovideo-utils');

// Download and cache the cover image
let coverImagePath = null;
const COVER_URL = 'https://files.catbox.moe/18il7k.jpg';

async function ensureCoverImage() {
    if (!coverImagePath) {
        coverImagePath = path.join(converter.tempDir, 'audio_cover.jpg');
        try {
            const response = await axios.get(COVER_URL, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(coverImagePath, response.data);
        } catch (e) {
            console.error('Failed to download cover image:', e);
            throw new Error('Could not download cover image');
        }
    }
    return coverImagePath;
}

cmd({
    pattern: 'tovideo',
    desc: 'Convert audio to video with cover image',
    category: 'media',
    react: '🎬',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🎵 Please reply to an audio message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (match.quoted.mtype !== 'audioMessage') {
        return await client.sendMessage(from, {
            text: "*❌ Only audio messages can be converted to video*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    // Send processing message
    const processingMsg = await client.sendMessage(from, {
        text: "*🔄 Downloading cover image and preparing video...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
    }, { quoted: message });

    try {
        // Ensure cover image exists
        const imagePath = await ensureCoverImage();
        const buffer = await match.quoted.download();
        const audioPath = path.join(converter.tempDir, `${getRandom('.mp3')}`);
        const outputPath = path.join(converter.tempDir, `${getRandom('.mp4')}`);

        // Write audio to temp file
        await fs.promises.writeFile(audioPath, buffer);

        // Update processing message
        await client.sendMessage(from, {
            text: "*🔄 Converting audio to video (this may take a while)...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ",
            edit: processingMsg.key
        });

        // FFmpeg command with better quality settings
        const ffmpegArgs = [
            '-loop', '1',
            '-i', imagePath,
            '-i', audioPath,
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', '18',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
            '-movflags', '+faststart',
            outputPath
        ];

        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

            ffmpeg.stderr.on('data', (data) => {
                console.debug('FFmpeg:', data.toString());
            });

            ffmpeg.on('close', async (code) => {
                await converter.cleanFile(audioPath);
                if (code !== 0) {
                    await converter.cleanFile(outputPath);
                    return reject(new Error(`FFmpeg exited with code ${code}`));
                }
                resolve();
            });

            ffmpeg.on('error', reject);
        });

        // Send the resulting video
        const videoBuffer = await fs.promises.readFile(outputPath);
        await converter.cleanFile(outputPath);

        await client.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: "🎵 Audio Visualized\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });

    } catch (e) {
        console.error('Video conversion error:', e);
        await client.sendMessage(from, {
            text: `*❌ Failed to convert to video*\n${e.message}\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ`
        }, { quoted: message });
    }
});

cmd({
    pattern: 'tomp3',
    desc: 'Convert media to audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🔊 Please reply to a video/audio message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*❌ Only video/audio messages can be converted*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 300) {
        return await client.sendMessage(from, {
            text: "*⏱️ Media too long (max 5 minutes)*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    // Send processing message and store it
    await client.sendMessage(from, {
        text: "*🔄 Converting to audio...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const audio = await converter.toAudio(buffer, ext);

        // Send result
        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });

    } catch (e) {
        console.error('Conversion error:', e.message);
        await client.sendMessage(from, {
            text: "*❌ Failed to process audio*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }
});

cmd({
    pattern: 'toptt',
    alias: ['toaudio'],
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🗣️ Please reply to a video/audio message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*❌ Only video/audio messages can be converted*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 60) {
        return await client.sendMessage(from, {
            text: "*⏱️ Media too long for voice (max 1 minute)*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    // Send processing message
    await client.sendMessage(from, {
        text: "*🔄 Converting to voice message...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const ptt = await converter.toPTT(buffer, ext);

        // Send result
        await client.sendMessage(from, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: message });

    } catch (e) {
        console.error('PTT conversion error:', e.message);
        await client.sendMessage(from, {
            text: "*❌ Failed to create voice message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }
});
*/

const converter = require('../data/mediaconverter');
const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

// ==================== UTILITY FUNCTIONS ====================
function getRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
}

function getExtensionFromMime(mimeType) {
    const extensions = {
        'audio/mpeg': 'mp3',
        'audio/aac': 'aac',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'image/jpeg': 'jpg'
    };
    return extensions[mimeType] || 'bin';
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
        .filter(Boolean)
        .join(':');
}

// ==================== COVER IMAGE HANDLING ====================
const COVER_URL = 'https://files.catbox.moe/18il7k.jpg';
let coverImagePath = null;

async function ensureCoverImage() {
    if (!coverImagePath) {
        coverImagePath = path.join(converter.tempDir, `cover_${getRandomString()}.jpg`);
        try {
            const response = await axios.get(COVER_URL, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(coverImagePath, response.data);
        } catch (e) {
            console.error('Failed to download cover image:', e);
            throw new Error('Could not download cover image');
        }
    }
    return coverImagePath;
}

// ==================== TOVIDEO COMMAND ====================
cmd({
    pattern: 'tovideo2',
    desc: 'Convert audio to video with cover image',
    category: 'media',
    react: '🎬',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🎵 Please reply to an audio message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (match.quoted.mtype !== 'audioMessage') {
        return await client.sendMessage(from, {
            text: "*❌ Only audio messages can be converted to video*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    const processingMsg = await client.sendMessage(from, {
        text: "*🔄 Downloading cover image and preparing video...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
    }, { quoted: message });

    try {
        const imagePath = await ensureCoverImage();
        const buffer = await match.quoted.download();
        const audioPath = path.join(converter.tempDir, `audio_${getRandomString()}.mp3`);
        const outputPath = path.join(converter.tempDir, `video_${getRandomString()}.mp4`);

        await fs.promises.writeFile(audioPath, buffer);

        await client.sendMessage(from, {
            text: "*🔄 Converting audio to video (this may take a while)...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ",
            edit: processingMsg.key
        });

        const ffmpegArgs = [
            '-loop', '1',
            '-i', imagePath,
            '-i', audioPath,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-vf', 'scale=640:480:force_original_aspect_ratio=decrease',
            outputPath
        ];

        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, ffmpegArgs);
            ffmpeg.on('close', async (code) => {
                await Promise.all([
                    converter.cleanFile(audioPath),
                    converter.cleanFile(imagePath)
                ]);
                code !== 0 ? reject(new Error(`FFmpeg error ${code}`)) : resolve();
            });
            ffmpeg.on('error', reject);
        });

        const videoBuffer = await fs.promises.readFile(outputPath);
        await converter.cleanFile(outputPath);

        await client.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: "🎵 Audio Visualized\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });

    } catch (e) {
        console.error('Video conversion error:', e);
        await client.sendMessage(from, {
            text: `*❌ Failed to convert to video*\n${e.message}\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ`
        }, { quoted: message });
    }
});

// ==================== TOMP3 COMMAND ====================
cmd({
    pattern: 'tomp3',
    desc: 'Convert media to audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🔊 Please reply to a video/audio message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*❌ Only video/audio messages can be converted*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 300) {
        return await client.sendMessage(from, {
            text: `*⏱️ Media too long (max 5 minutes)*\nDuration: ${formatDuration(match.quoted.seconds)}\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ`
        }, { quoted: message });
    }

    await client.sendMessage(from, {
        text: "*🔄 Converting to audio...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = getExtensionFromMime(match.quoted.mimetype) || 
                   (match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a');
        const audio = await converter.toAudio(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });

    } catch (e) {
        console.error('Conversion error:', e);
        await client.sendMessage(from, {
            text: "*❌ Failed to process audio*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }
});

// ==================== TOPTT COMMAND ====================
cmd({
    pattern: 'toptt',
    alias: ['toaudio'],
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🗣️ Please reply to a video/audio message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*❌ Only video/audio messages can be converted*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 60) {
        return await client.sendMessage(from, {
            text: `*⏱️ Media too long for voice (max 1 minute)*\nDuration: ${formatDuration(match.quoted.seconds)}\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ`
        }, { quoted: message });
    }

    await client.sendMessage(from, {
        text: "*🔄 Converting to voice message...*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = getExtensionFromMime(match.quoted.mimetype) || 
                   (match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a');
        const ptt = await converter.toPTT(buffer, ext);

        await client.sendMessage(from, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: message });

    } catch (e) {
        console.error('PTT conversion error:', e);
        await client.sendMessage(from, {
            text: "*❌ Failed to create voice message*\n\n> © Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ"
        }, { quoted: message });
    }
});
