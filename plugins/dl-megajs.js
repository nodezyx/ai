const { cmd } = require('../command');
const { File } = require('megajs');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');

cmd({
    pattern: "megadl",
    alias: ["mega", "meganz"],
    react: "📦",
    desc: "Download ZIP or any file from Mega.nz",
    category: "downloader",
    use: '.megadl <mega file link>',
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, {
                image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/mega.png' },
                caption: `📦 *Mega.nz Downloader*\n\n✍️ Please provide a Mega.nz file link.\n\n*Example:*\n${config.PREFIX || '.'}megadl https://mega.nz/file/xxxx#key\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
            }, { quoted: mek });
        }

        // React: Processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Send processing message
        await conn.sendMessage(from, {
            image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/mega.png' },
            caption: `📦 *Downloading from Mega.nz...*\n\n🔗 *Link:* ${q}\n\n⏳ Please wait while we download your file...\n\n${config.FOOTER || '© Created By Mr Frank OFC'}`
        }, { quoted: mek });

        // Initialize MEGA File from link
        const file = File.fromURL(q);

        // Download into buffer
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        // Create temp file path
        const savePath = path.join(os.tmpdir(), file.name || "mega_file.zip");

        // Save file locally
        fs.writeFileSync(savePath, data);

        // Prepare caption with config.FOOTER
        const caption = `📦 *File Downloaded Successfully!*\n\n` +
                       `📁 *File Name:* ${file.name || "mega_file.zip"}\n` +
                       `🔗 *Source:* Mega.nz\n` +
                       `💾 *Status:* Download Complete\n\n` +
                       `${config.FOOTER || '© Created By Mr Frank OFC'}`;

        // Send file
        await conn.sendMessage(from, {
            document: fs.readFileSync(savePath),
            fileName: file.name || "subzero_mega_download.zip",
            mimetype: "application/zip",
            caption: caption
        }, { quoted: mek });

        // Delete temp file
        fs.unlinkSync(savePath);

        // React: Done
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("❌ MEGA Downloader Error:", error);
        
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        
        const errorCaption = `❌ *Download Failed*\n\n` +
                           `🔗 *Link:* ${q}\n\n` +
                           `💡 *Possible reasons:*\n` +
                           `• Invalid or expired Mega.nz link\n` +
                           `• File requires decryption key\n` +
                           `• File is too large\n` +
                           `• Network connection issue\n` +
                           `• File is private or deleted\n\n` +
                           `🔄 Please check the link and try again.\n\n` +
                           `${config.FOOTER || '© Created By Mr Frank OFC'}`;
        
        await conn.sendMessage(from, {
            image: { url: config.BOTIMAGE || 'https://mrfrankk-cdn.hf.space/mrfrank/mini/mega.png' },
            caption: errorCaption
        }, { quoted: mek });
    }
});
