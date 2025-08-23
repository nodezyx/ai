const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { cmd } = require('../command');

let AI_ENABLED = "true";

// Helper function to upload to Catbox
async function uploadToCatbox(imageBuffer, mimeType) {
    try {
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

        const thinkingMsg = await reply(`🤖 *Gemini is thinking...*${imageUrl ? " (with image)" : ""}`);

        try {
            const userId = sender.split('@')[0];
            
            // Build the API URL correctly
            const baseUrl = "https://kaiz-apis.gleeze.com/api/gemini-flash-2.0";
            const params = new URLSearchParams();
            
            params.append('q', question || "Describe this image");
            params.append('uid', userId);
            if (imageUrl) params.append('imageUrl', imageUrl);
            params.append('apikey', 'cf2ca612-296f-45ba-abbc-473f18f991eb');
            
            const apiUrl = `${baseUrl}?${params.toString()}`;
            
            console.log("API URL:", apiUrl); // Debug log

            const response = await axios.get(apiUrl, { 
                timeout: 45000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            
            console.log("API Response:", response.data); // Debug log

            if (response.data && response.data.response) {
                await conn.sendMessage(from, { delete: thinkingMsg.key });
                
                // Format the response nicely
                const aiResponse = response.data.response;
                await reply(
                    `✨ *Gemini Flash 2.0 Response:*\n\n` +
                    `${aiResponse}\n\n` +
                    `_🔮 Powered by Subzero MD_`
                );
            } else {
                await conn.sendMessage(from, { delete: thinkingMsg.key });
                reply("❌ No response from AI. Please try again.");
            }

        } catch (error) {
            console.error("API error details:", error.response?.data || error.message);
            await conn.sendMessage(from, { delete: thinkingMsg.key });
            
            if (error.code === 'ECONNABORTED') {
                reply("❌ Request timeout. Please try again.");
            } else if (error.response?.status === 404) {
                reply("❌ API endpoint not found. Please check the URL.");
            } else if (error.response?.status === 401) {
                reply("❌ Invalid API key. Please check the configuration.");
            } else {
                reply("❌ Error connecting to AI service. Please try again later.");
            }
        }

    } catch (error) {
        console.error("Command error:", error);
        reply("❌ An unexpected error occurred.");
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
