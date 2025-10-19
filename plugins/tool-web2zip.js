const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

// ==============================================
// MR FRANK OFC
// ==============================================



// ==============================================
// WEB TO ZIP PLUGIN
// ==============================================

cmd({
  pattern: "web2zip",
  alias: ["site2zip", "webarchive", "archive"],
  react: '🗂️',
  desc: "Convert website to downloadable ZIP archive",
  category: "tools",
  use: ".web2zip <url>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const url = args[0];
    if (!url) return reply("Please provide a URL\nExample: .web2zip https://google.com");
    
    if (!url.match(/^https?:\/\//)) {
      return reply("Invalid URL. Please include http:// or https://");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    const apiUrl = `https://api.giftedtech.web.id/api/tools/web2zip?apikey=gifted&url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });

    if (!response.data?.success || !response.data?.result?.download_url) {
      return reply("Failed to archive website. The site may be too large or restricted.");
    }

    const { siteUrl, copiedFilesAmount, download_url } = response.data.result;

    await reply(`🗂️ Archiving: *${siteUrl}*\n📂 Files: ${copiedFilesAmount}\n\n⏳ Preparing download...`);

    const zipResponse = await axios.get(download_url, {
      responseType: "arraybuffer",
      timeout: 60000
    });

    if (!zipResponse.data) return reply("Failed to download archive. The file may be too large.");

    const zipBuffer = Buffer.from(zipResponse.data, "binary");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `website_archive_${timestamp}.zip`;

    await conn.sendMessage(
      from,
      {
        document: zipBuffer,
        fileName: filename,
        mimetype: "application/zip",
        caption: `🗂️ *Website Archive*\n🌐 ${siteUrl}\n📂 ${copiedFilesAmount} files\n\n${config.FOOTER}`,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      },
      { quoted: mek }
    );

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error("Web2Zip error:", error);
    reply(`❌ Error: ${error.message.includes("timeout") ? "Request timed out" : "Failed to archive website"}`);
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
