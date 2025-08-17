const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "gofiledl",
  alias: ["gofile"],
  desc: "Download file or folder from Gofile",
  category: "download",
  use: "<gofile-url>",
  filename: __filename
}, async (conn, m, { q, prefix, command }) => {
  if (!q || !q.includes("gofile.io")) {
    return await conn.sendMessage(m.chat, {
      text: `❌ Please provide a valid Gofile URL.\n\nExample:\n${prefix + command} https://gofile.io/d/GjibbO`
    }, { quoted: m });
  }

  try {
    const apiUrl = `https://api.giftedtech.web.id/api/download/gofile?apikey=gifted&url=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.success || !data.result || !data.result.canAccess) {
      return await conn.sendMessage(m.chat, {
        text: `❌ Unable to access or find files at the given Gofile URL.`
      }, { quoted: m });
    }

    const result = data.result;

    // If it is a file, send it directly
    if (result.type === "file") {
      await conn.sendMessage(m.chat, {
        document: { url: result.link },
        fileName: result.name,
        mimetype: result.mimetype,
        caption: `📁 Gofile File Download\n\nName: ${result.name}\nSize: ${(result.size / (1024 * 1024)).toFixed(2)} MB`
      }, { quoted: m });
    } 
    // If it is a folder, list files and send links (or multiple files if desired)
    else if (result.type === "folder" && result.childrenCount > 0) {
      let text = `📂 Gofile Folder: ${result.name}\nTotal Files: ${result.childrenCount}\nTotal Size: ${(result.totalSize / (1024 * 1024)).toFixed(2)} MB\n\nFiles:\n`;

      const children = result.children;
      for (const key in children) {
        const file = children[key];
        text += `• ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)\nDownload: ${file.link}\n\n`;
      }

      await conn.sendMessage(m.chat, { text }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, { text: "❌ No downloadable files found in the provided Gofile URL." }, { quoted: m });
    }

  } catch (error) {
    console.error("GofileDL Error:", error);
    await conn.sendMessage(m.chat, {
      text: "❌ Failed to download from Gofile. Please try again later."
    }, { quoted: m });
  }
});
