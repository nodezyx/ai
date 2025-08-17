const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

cmd(
    {
        pattern: 'modapk',
        alias: ['mod', 'apkmod'],
        desc: 'Download MOD APK files',
        category: 'download',
        react: '📱',
        use: '<app name>',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply('📱 *Usage:* .modapk <app name>\nExample: .modapk WhatsApp');

            // Send initial reaction
            try {
                if (mek?.key?.id) {
                    await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });
                }
            } catch (reactError) {
                console.error('Reaction error:', reactError);
            }

            // Search for MOD APKs
            const apiUrl = `https://infinity-apis.vercel.app/api/modapk-dl?query=${encodeURIComponent(text)}`;
            
            const response = await axiosInstance.get(apiUrl);
            const data = response.data;

            if (!data.success || !data.results?.length) {
                return reply('❌ No MOD APKs found for your search');
            }

            // Get the top result
            const topApk = data.results[0];
            
            // Send downloading message
            await reply(`⏳ Downloading *${topApk.title}*...`);

            try {
                // Get the APK file
                const apkResponse = await axiosInstance.get(topApk.downloadUrl, {
                    responseType: 'arraybuffer',
                    maxRedirects: 5,
                    timeout: 30000
                });

                const apkBuffer = Buffer.from(apkResponse.data, 'binary');
                const fileName = `${topApk.title.replace(/[<>:"\/\\|?*]+/g, '')}.apk`;

                // Send the APK file
                await conn.sendMessage(mek.chat, {
                    document: apkBuffer,
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: fileName,
                    caption: `📱 *${topApk.title}*\n🔹 Version: ${topApk.version}\n🔹 Size: ${topApk.size.replace('Size:\n                        ', '').split('\n')[0]}\n🔹 Features: ${topApk.tag}\n\n> ${Config.FOOTER}`
                }, { quoted: mek });

                // Send success reaction
                try {
                    if (mek?.key?.id) {
                        await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });
                    }
                } catch (reactError) {
                    console.error('Success reaction failed:', reactError);
                }

            } catch (error) {
                console.error('Download error:', error);
                await reply('❌ Download failed: ' + (error.message || 'Network error'));
                try {
                    if (mek?.key?.id) {
                        await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
                    }
                } catch (reactError) {
                    console.error('Error reaction failed:', reactError);
                }
            }

        } catch (error) {
            console.error('Main error:', error);
            reply('❌ An error occurred: ' + (error.message || 'Please try again later'));
            try {
                if (mek?.key?.id) {
                    await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
                }
            } catch (reactError) {
                console.error('Final reaction failed:', reactError);
            }
        }
    }
);
