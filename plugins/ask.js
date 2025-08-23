const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Import the command handler - adjust the path as needed for your project
const { cmd } = require('../command'); // or whatever the correct path is

// Simple AI state variable
let AI_ENABLED = "true";

// Helper function to upload to Catbox
async function uploadToCatbox(imageBuffer, mimeType) {
    try {
        // Get file extension
        let extension = '.jpg';
        if (mimeType.includes('image/png')) extension = '.png';
        if (mimeType.includes('image/gif')) extension = '.gif';
        if (mimeType.includes('image/webp')) extension = '.webp';
        
        const tempFilePath = path.join(os.tmpdir(), `catbox_${Date.now()}${extension}`);
        fs.writeFileSync(tempFilePath, imageBuffer);

        const form = new FormData();
        form.append('fileToUpload', fs.createReadStream(tempFilePath), `file${extension}`);
        form.append('reqtype', 'fileupload');

        const response = await axios.post("https://catbox.moe/user/api.php", form, {
            headers: form.getHeaders(),
            timeout: 30000
        });

        fs.unlinkSync(tempFilePath);
        
        return response.data;
    } catch (error) {
        console.error("Catbox upload error:", error);
        return null;
    }
}

// Gemini command
cmd({
    pattern: "gemini",
    alias: ["ai", "googleai", "ask"],
    desc: "Interact with Gemini Flash 2.0 AI",
    category: "AI",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, sender, body, args, reply, quoted, isOwner }) => {
    try {
        if (AI_ENABLED !== "true" && !isOwner) {
            return reply("🤖 AI chatbot is currently disabled.");
        }

        const isImageAnalysis = quoted && quoted.mimeType && quoted.mimeType.includes('image');
        const question = args.join(' ').trim();

        if (!question && !isImageAnalysis) {
            return reply(
                "❌ *Usage:*\n" +
                "• `.gemini your question` - Ask a question\n" +
                "• Reply to image + `.gemini describe this` - Analyze image\n\n" +
                "Example: `.gemini what is quantum computing?`"
            );
        }

        let imageUrl = null;
        
        if (isImageAnalysis) {
            const processingMsg = await reply("📷 *Processing image...*");
            
            try {
                const mediaBuffer = await quoted.download();
                imageUrl = await uploadToCatbox(mediaBuffer, quoted.mimeType);
                
                if (!imageUrl) {
                    await conn.sendMessage(from, { delete: processingMsg.key });
                    return reply("❌ Failed to upload image");
                }
                
                await conn.sendMessage(from, { delete: processingMsg.key });
            } catch (error) {
                console.error("Image error:", error);
                return reply("❌ Error processing image");
            }
        }

        const thinkingMsg = await reply(
            `🤖 *Gemini is thinking...*${imageUrl ? " (with image)" : ""}`
        );

        try {
            const userId = sender.split('@')[0];
            const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-flash-2.0?q=${encodeURIComponent(question || "Describe this image")}&uid=${userId}&imageUrl=${encodeURIComponent(imageUrl || '')}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;
            
            const response = await axios.get(apiUrl, { timeout: 45000 });
            
            if (response.data && response.data.response) {
                await conn.sendMessage(from, { delete: thinkingMsg.key });
                await reply(
                    `✨ *Gemini Response:*\n\n` +
                    `${response.data.response}\n\n` +
                    `_🔮 Powered by Subzero MD_`
                );
            } else {
                await conn.sendMessage(from, { delete: thinkingMsg.key });
                reply("❌ No response from AI");
            }

        } catch (error) {
            console.error("API error:", error);
            await conn.sendMessage(from, { delete: thinkingMsg.key });
            reply("❌ Error connecting to AI");
        }

    } catch (error) {
        console.error("Command error:", error);
        reply("❌ An error occurred");
    }
});

// AI toggle command
cmd({
    pattern: "aichat",
    alias: ["aitoggle"],
    desc: "Toggle AI on/off",
    category: "settings",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, isOwner }) => {
    if (!isOwner) return reply("*📛 Owner only!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        AI_ENABLED = "true";
        return reply("🤖 AI enabled");
    } else if (status === "off") {
        AI_ENABLED = "false";
        return reply("🤖 AI disabled");
    } else {
        return reply(`🤖 AI: ${AI_ENABLED === "true" ? "ON" : "OFF"}`);
    }
});

// If you still get cmd error, try this alternative approach:
// module.exports = {
//     name: "gemini",
//     alias: ["ai", "googleai", "ask"],
//     desc: "Interact with Gemini AI",
//     category: "AI",
//     async exec(conn, mek, m, args, from, sender, reply, quoted, isOwner) {
//         // Same code as above but adjust function signature
//     }
// };
