const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "npm",
    alias: ["npmpkg", "npmsearch"],
    react: "📦",
    desc: "Search for NPM packages",
    category: "search",
    use: ".npm <package-name>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide an NPM package name!");

        const processingMsg = await reply("🔍 Searching NPM registry...");

        const apiUrl = `https://api.giftedtech.web.id/api/search/npmsearch?apikey=gifted&packagename=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });

        if (!response.data?.success || !response.data?.result) {
            return reply("❌ Package not found or API error");
        }

        const pkg = response.data.result;
        
        let message = `📦 \`NPM Package Info\` \n\n` +
                     `✨ *Name:* ${pkg.name || "N/A"}\n` +
                     `📝 *Description:* ${pkg.description || "N/A"}\n` +
                     `🏷️ *Version:* ${pkg.version || "N/A"}\n` +
                     `📅 *Published:* ${pkg.publishedDate || "N/A"}\n` +
                     `👤 *Owner:* ${pkg.owner || "N/A"}\n` +
                     `📜 *License:* ${pkg.license || "N/A"}\n\n` +
                     `🔗 *Package Link:* ${pkg.packageLink || "N/A"}\n` +
                     `🏠 *Homepage:* ${pkg.homepage || "N/A"}\n` +
                     `📥 *Download:* ${pkg.downloadLink || "N/A"}\n\n`;

        if (pkg.keywords?.length > 0) {
            message += `🏷️ *Keywords:* ${pkg.keywords.join(", ")}\n`;
        }

        message += `\n> Gᴇɴᴇʀᴀᴛᴇᴅ ʙʏ Sᴜʙᴢᴇʀᴏ`;

        // Send the result
        await conn.sendMessage(from, { 
            text: message,
            contextInfo: {
                externalAdReply: {
                    title: pkg.name,
                    body: pkg.description || "NPM package",
                    thumbnail: await (await axios.get('https://files.catbox.moe/u099km.jpg', { responseType: 'arraybuffer' })).data,
                    sourceUrl: pkg.packageLink || "https://www.npmjs.com"
                }
            }
        }, { quoted: mek });

        // Delete processing message
        await conn.sendMessage(from, { delete: processingMsg.key });

    } catch (error) {
        console.error("NPM search error:", error);
       // reply(`❌ Error: ${error.response?.status === 404 ? "Package not found" : "Search failed"}`);
    }
});
