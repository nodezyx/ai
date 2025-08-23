const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Global AI state (from your previous code)
let AI_ENABLED = "false";

// Initialize AI state
(async () => {
    try {
        const savedState = await getConfig("AI_ENABLED");
        if (savedState) AI_ENABLED = savedState;
    } catch (error) {
        console.error("Error loading AI config:", error);
    }
})();

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

cmd({
    pattern: "gemini",
    alias: ["ai", "googleai", "ask"],
    desc: "Interact with Gemini Flash 2.0 AI - ask questions or analyze images",
    category: "AI",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, sender, body, args, reply, quoted }) => {
    try {
        // Check if AI is globally disabled
        if (AI_ENABLED !== "true") {
            return reply("🤖 AI chatbot is currently disabled. Use `.chatbot on` to enable it.");
        }

        const isImageAnalysis = quoted && quoted.mimeType && quoted.mimeType.includes('image');
        const question = args.join(' ').trim();

        if (!question && !isImageAnalysis) {
            return reply(
                "❌ *Usage:*\n" +
                "• `.gemini your question` - Ask a question\n" +
                "• Reply to an image with `.gemini describe this` - Analyze image\n\n" +
                "Example: `.gemini what is quantum computing?`"
            );
        }

        let imageUrl = null;
        
        // Process image if quoted message contains image
        if (isImageAnalysis) {
            const processingMsg = await reply("📷 *Downloading and processing image...*");
            
            try {
                const mediaBuffer = await quoted.download();
                imageUrl = await uploadToCatbox(mediaBuffer, quoted.mimeType);
                
                if (!imageUrl) {
                    return reply("❌ Failed to upload image for analysis");
                }
                
                await conn.sendMessage(from, { delete: processingMsg.key });
            } catch (error) {
                console.error("Image processing error:", error);
                return reply("❌ Error processing image. Please try again.");
            }
        }

        // Show thinking message
        const thinkingMsg = await reply(
            `🤖 *Gemini Flash 2.0 is thinking...*${imageUrl ? " (with image analysis)" : ""}\n` +
            `▰▰▰▰▰▰▰▰▰▰ 90%`
        );

        try {
            // Get user ID for personalization
            const userId = sender.split('@')[0];
            
            // Prepare API request
            const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-flash-2.0?q=${encodeURIComponent(question || "Describe this image")}&uid=${userId}&imageUrl=${encodeURIComponent(imageUrl || '')}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;
            
            const response = await axios.get(apiUrl, { timeout: 45000 });
            
            if (response.data && response.data.response) {
                // Delete thinking message
                await conn.sendMessage(from, { delete: thinkingMsg.key });
                
                // Send AI response
                await reply(
                    `✨ *Gemini Flash 2.0 Response:*\n\n` +
                    `${response.data.response}\n\n` +
                    `_🔮 Powered by Mr Frank's Subzero MD_`
                );
            } else {
                await conn.sendMessage(from, { delete: thinkingMsg.key });
                reply("❌ No response from Gemini AI. Please try again.");
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            await conn.sendMessage(from, { delete: thinkingMsg.key });
            reply("❌ Error connecting to Gemini AI. Please try again later.");
        }

    } catch (error) {
        console.error("Gemini command error:", error);
        reply("❌ An unexpected error occurred. Please try again.");
    }
});

// Optional: Add automatic AI responses (like your previous chatbot)
cmd({
    on: "text"
}, async (conn, m, store, { from, body, sender, isGroup, reply }) => {
    try {
        if (AI_ENABLED !== "true") return;
        if (!body || m.key.fromMe || body.startsWith(config.PREFIX || ".")) return;
        
        // Only respond in private chats or when mentioned in groups
        if (isGroup && !body.includes('@' + (conn.user.id.split(':')[0]))) {
            return;
        }

        const userId = sender.split('@')[0];
        const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-flash-2.0?q=${encodeURIComponent(body)}&uid=${userId}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        
        if (response.data && response.data.response) {
            await reply(
                `🤖 ${response.data.response}\n\n` +
                `_🔮 Powered by Gemini Flash 2.0_`
            );
        }
    } catch (error) {
        // Silent fail for automatic responses
    }
});
