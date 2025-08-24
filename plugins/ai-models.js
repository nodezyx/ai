/*const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Helper function to handle all AI responses consistently
async function handleAIResponse(conn, from, mek, m, q, apiUrl, aiName) {
    try {
        if (!q) return await conn.sendMessage(from, { text: `❌ Please provide a question to ask ${aiName}.` }, { quoted: mek });

        // React: Processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await conn.sendPresenceUpdate("composing", from);

        // Fetch AI response
        const { data } = await axios.get(apiUrl + encodeURIComponent(q));

        if (!data.status && !data.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await conn.sendMessage(from, { text: `❌ ${aiName} failed to respond.` }, { quoted: mek });
        }

        // Get the response text from different response structures
        let responseText = '';
        if (data.BK9) {
            responseText = typeof data.BK9 === 'string' ? data.BK9 : data.BK9.answer || data.BK9.response;
        } else if (data.result) {
            responseText = data.result;
        }

        if (!responseText) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await conn.sendMessage(from, { text: `❌ ${aiName} returned an empty response.` }, { quoted: mek });
        }

        // React: Success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // Send message with image and context info
        const message = `💬 *${aiName}:*\n\n ${responseText}`;
        
        await conn.sendMessage(from, {
            image: { url: `${config.BOTIMAGE}` },
            caption: message,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363304325601080@newsletter',
                    newsletterName: '『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(`${aiName} Error:`, e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await conn.sendMessage(from, { text: `❌ An error occurred while talking to ${aiName}.` }, { quoted: mek });
    }
}

// BK9.dev AI APIs
cmd({
    pattern: "gemini",
    alias: ["googleai"],
    react: "🤖",
    desc: "Talk with Google Gemini AI",
    category: "ai",
    use: '.gemini <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/gemini?q=', 'Gemini AI');
});

cmd({
    pattern: "llama",
    react: "🦙",
    desc: "Talk with Meta Llama AI",
    category: "ai",
    use: '.llama <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/llama?q=', 'Llama AI');
});

cmd({
    pattern: "deepseek",
    react: "🔍",
    desc: "Talk with DeepSeek R1 AI",
    category: "ai",
    use: '.deepseek <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/deepseek-r1?q=', 'DeepSeek AI');
});

cmd({
    pattern: "islamai",
    react: "🕌",
    desc: "Ask questions about Islam",
    category: "ai",
    use: '.islamai <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Islam-ai?q=', 'Islam AI');
});

cmd({
    pattern: "jeeves",
    react: "🤵",
    desc: "Talk with Jeeves AI",
    category: "ai",
    use: '.jeeves <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/jeeves-chat?q=', 'Jeeves AI');
});

cmd({
    pattern: "jeeves2",
    react: "🤵‍♂️",
    desc: "Talk with Jeeves AI v2",
    category: "ai",
    use: '.jeeves2 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/jeeves-chat2?q=', 'Jeeves AI v2');
});

cmd({
    pattern: "math",
    react: "🧮",
    desc: "Solve math problems",
    category: "ai",
    use: '.math <equation>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/mathssolve?q=', 'Math Solver');
});

cmd({
    pattern: "perplexity",
    react: "❓",
    desc: "Ask Perplexity AI",
    category: "ai",
    use: '.perplexity <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Perplexity?q=', 'Perplexity AI');
});

cmd({
    pattern: "aisearch",
    react: "🔎",
    desc: "AI Search v3",
    category: "ai",
    use: '.aisearch <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/ai-search-3?q=', 'AI Search v3');
});

cmd({
    pattern: "aoyo",
    react: "🇯🇵",
    desc: "Aoyo AI",
    category: "ai",
    use: '.aoyo <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Aoyo?q=', 'Aoyo AI');
});

cmd({
    pattern: "aoyo2",
    react: "🇯🇵",
    desc: "Aoyo AI v2",
    category: "ai",
    use: '.aoyo2 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Aoyo2?q=', 'Aoyo AI v2');
});

cmd({
    pattern: "aisearch2",
    react: "🔍",
    desc: "AI Search v2",
    category: "ai",
    use: '.aisearch2 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/ai-search-2?q=', 'AI Search v2');
});

// GiftedTech AI APIs
cmd({
    pattern: "gpt",
    react: "🤖",
    desc: "GPT-4 AI",
    category: "ai",
    use: '.gpt <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/gpt?apikey=gifted&q=', 'GPT-4');
});

cmd({
    pattern: "gpt4o",
    react: "🤖",
    desc: "GPT-4o AI",
    category: "ai",
    use: '.gpt4o <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=', 'GPT-4o');
});

cmd({
    pattern: "mistral",
    react: "🌬️",
    desc: "Mistral AI",
    category: "ai",
    use: '.mistral <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/mistral?apikey=gifted&q=', 'Mistral AI');
});

cmd({
    pattern: "geminipro",
    react: "💎",
    desc: "Gemini Pro AI",
    category: "ai",
    use: '.geminipro <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/geminiaipro?apikey=gifted&q=', 'Gemini Pro');
});

cmd({
    pattern: "letmegpt",
    react: "🤖",
    desc: "LetMeGPT AI",
    category: "ai",
    use: '.letmegpt <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/letmegpt?apikey=gifted&q=', 'LetMeGPT');
});

cmd({
    pattern: "meta-llama",
    react: "🦙",
    desc: "Meta Llama AI",
    category: "ai",
    use: '.meta-llama <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/meta-llama?apikey=gifted&q=', 'Meta Llama');
});

cmd({
    pattern: "groq",
    react: "⚡",
    desc: "Groq Beta AI",
    category: "ai",
    use: '.groq <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/groq-beta?apikey=gifted&q=', 'Groq AI');
});

cmd({
    pattern: "qwen",
    react: "🌐",
    desc: "Qwen AI",
    category: "ai",
    use: '.qwen <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/qwen?apikey=gifted&q=', 'Qwen AI');
});
*/

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Helper function to handle all AI responses consistently
async function handleAIResponse(conn, from, mek, m, q, apiUrl, aiName, customResponseHandler) {
    try {
        if (!q) return await conn.sendMessage(from, { text: `❌ Please provide a question to ask ${aiName}.` }, { quoted: mek });

        // React: Processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await conn.sendPresenceUpdate("composing", from);

        // Fetch AI response
        const { data } = await axios.get(apiUrl + encodeURIComponent(q));

        if (!data.status && !data.success && !data.response && !data.content && !data.author) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await conn.sendMessage(from, { text: `❌ ${aiName} failed to respond.` }, { quoted: mek });
        }

        // Get the response text using custom handler if provided, otherwise use default logic
        let responseText = '';
        if (customResponseHandler) {
            responseText = customResponseHandler(data);
        } else {
            if (data.BK9) {
                responseText = typeof data.BK9 === 'string' ? data.BK9 : data.BK9.answer || data.BK9.response;
            } else if (data.result) {
                responseText = data.result;
            } else if (data.response) {
                responseText = data.response;
            } else if (data.content) {
                responseText = data.content;
            } else if (data.author) {
                responseText = data.response || data.content || "I'm here to help!";
            }
        }

        if (!responseText) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await conn.sendMessage(from, { text: `❌ ${aiName} returned an empty response.` }, { quoted: mek });
        }

        // React: Success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // Send message with image and context info
        const message = `💬 *${aiName}:*\n\n ${responseText}`;
        
        await conn.sendMessage(from, {
            image: { url: `${config.BOTIMAGE}` },
            caption: message,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363304325601080@newsletter',
                    newsletterName: '『 𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃 』',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(`${aiName} Error:`, e);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await conn.sendMessage(from, { text: `❌ An error occurred while talking to ${aiName}.` }, { quoted: mek });
    }
}

// ======================
// BK9.dev AI APIs
// ======================

cmd({
    pattern: "gemini",
    alias: ["googleai"],
    react: "🤖",
    desc: "Talk with Google Gemini AI",
    category: "ai",
    use: '.gemini <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/gemini?q=', 'Gemini AI');
});

cmd({
    pattern: "llama",
    react: "🦙",
    desc: "Talk with Meta Llama AI",
    category: "ai",
    use: '.llama <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/llama?q=', 'Llama AI');
});

cmd({
    pattern: "deepseek",
    react: "🔍",
    desc: "Talk with DeepSeek R1 AI",
    category: "ai",
    use: '.deepseek <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/deepseek-r1?q=', 'DeepSeek AI');
});

cmd({
    pattern: "islamai",
    react: "🕌",
    desc: "Ask questions about Islam",
    category: "ai",
    use: '.islamai <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Islam-ai?q=', 'Islam AI');
});

cmd({
    pattern: "jeeves",
    react: "🤵",
    desc: "Talk with Jeeves AI",
    category: "ai",
    use: '.jeeves <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/jeeves-chat?q=', 'Jeeves AI');
});

cmd({
    pattern: "jeeves2",
    react: "🤵‍♂️",
    desc: "Talk with Jeeves AI v2",
    category: "ai",
    use: '.jeeves2 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/jeeves-chat2?q=', 'Jeeves AI v2');
});

cmd({
    pattern: "math",
    react: "🧮",
    desc: "Solve math problems",
    category: "ai",
    use: '.math <equation>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/mathssolve?q=', 'Math Solver');
});

cmd({
    pattern: "perplexity",
    react: "❓",
    desc: "Ask Perplexity AI",
    category: "ai",
    use: '.perplexity <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Perplexity?q=', 'Perplexity AI');
});

cmd({
    pattern: "aisearch",
    react: "🔎",
    desc: "AI Search v3",
    category: "ai",
    use: '.aisearch <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/ai-search-3?q=', 'AI Search v3');
});

cmd({
    pattern: "aoyo",
    react: "🇯🇵",
    desc: "Aoyo AI",
    category: "ai",
    use: '.aoyo <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Aoyo?q=', 'Aoyo AI');
});

cmd({
    pattern: "aoyo2",
    react: "🇯🇵",
    desc: "Aoyo AI v2",
    category: "ai",
    use: '.aoyo2 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/Aoyo2?q=', 'Aoyo AI v2');
});

cmd({
    pattern: "aisearch2",
    react: "🔍",
    desc: "AI Search v2",
    category: "ai",
    use: '.aisearch2 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.bk9.dev/ai/ai-search-2?q=', 'AI Search v2');
});

// ======================
// GiftedTech AI APIs
// ======================

cmd({
    pattern: "gpt",
    react: "🤖",
    desc: "GPT-4 AI",
    category: "ai",
    use: '.gpt <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/gpt?apikey=gifted&q=', 'GPT-4');
});

cmd({
    pattern: "gpt4o",
    react: "🤖",
    desc: "GPT-4o AI",
    category: "ai",
    use: '.gpt4o <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=', 'GPT-4o');
});

cmd({
    pattern: "mistral",
    react: "🌬️",
    desc: "Mistral AI",
    category: "ai",
    use: '.mistral <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/mistral?apikey=gifted&q=', 'Mistral AI');
});

cmd({
    pattern: "geminipro",
    react: "💎",
    desc: "Gemini Pro AI",
    category: "ai",
    use: '.geminipro <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/geminiaipro?apikey=gifted&q=', 'Gemini Pro');
});

cmd({
    pattern: "letmegpt",
    react: "🤖",
    desc: "LetMeGPT AI",
    category: "ai",
    use: '.letmegpt <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/letmegpt?apikey=gifted&q=', 'LetMeGPT');
});

cmd({
    pattern: "meta-llama",
    react: "🦙",
    desc: "Meta Llama AI",
    category: "ai",
    use: '.meta-llama <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/meta-llama?apikey=gifted&q=', 'Meta Llama');
});

cmd({
    pattern: "groq",
    react: "⚡",
    desc: "Groq Beta AI",
    category: "ai",
    use: '.groq <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/groq-beta?apikey=gifted&q=', 'Groq AI');
});

cmd({
    pattern: "qwen",
    react: "🌐",
    desc: "Qwen AI",
    category: "ai",
    use: '.qwen <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(conn, from, mek, m, q, 'https://api.giftedtech.web.id/api/ai/qwen?apikey=gifted&q=', 'Qwen AI');
});

// ======================
// Kaiz-APIs AI Commands
// ======================

cmd({
    pattern: "vondy",
    react: "🤖",
    desc: "Vondy AI",
    category: "ai",
    use: '.vondy <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/vondy-ai?ask=', 
        'Vondy AI',
        (data) => data.response
    );
});

cmd({
    pattern: "voila",
    react: "✨",
    desc: "Voila AI",
    category: "ai",
    use: '.voila <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/voila?ask=', 
        'Voila AI'
    );
});

cmd({
    pattern: "youai",
    react: "🤖",
    desc: "You AI",
    category: "ai",
    use: '.youai <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/you-ai?ask=&uid=1234', 
        'You AI'
    );
});

cmd({
    pattern: "venice",
    react: "🏛️",
    desc: "Venice AI",
    category: "ai",
    use: '.venice <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/venice-ai?ask=&uid=1234', 
        'Venice AI'
    );
});

cmd({
    pattern: "scira",
    react: "🔬",
    desc: "Scira AI",
    category: "ai",
    use: '.scira <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/scira-ai?ask=&uid=1234', 
        'Scira AI'
    );
});

cmd({
    pattern: "qudata",
    react: "📊",
    desc: "Qudata AI",
    category: "ai",
    use: '.qudata <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/qudata?ask=&uid=1234', 
        'Qudata AI'
    );
});

cmd({
    pattern: "pixtral",
    react: "🖼️",
    desc: "Pixtral 12B AI",
    category: "ai",
    use: '.pixtral <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/pixtral-12b?q=&uid=1234', 
        'Pixtral 12B',
        (data) => data.content
    );
});

cmd({
    pattern: "phi4",
    react: "Φ",
    desc: "Phi-4 AI",
    category: "ai",
    use: '.phi4 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/phi-4?ask=', 
        'Phi-4 AI',
        (data) => data.response
    );
});

cmd({
    pattern: "panda",
    react: "🐼",
    desc: "Panda AI",
    category: "ai",
    use: '.panda <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/panda-ai?ask=&uid=1234', 
        'Panda AI'
    );
});

cmd({
    pattern: "o3mini",
    react: "🛸",
    desc: "O3 Mini AI",
    category: "ai",
    use: '.o3mini <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/o3-mini?ask=', 
        'O3 Mini AI'
    );
});

cmd({
    pattern: "mixtral",
    react: "🌀",
    desc: "Mixtral 8x22B AI",
    category: "ai",
    use: '.mixtral <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/mixtral-8x22b?q=&uid=1234', 
        'Mixtral 8x22B',
        (data) => data.content
    );
});

cmd({
    pattern: "mistralsmall",
    react: "🌬️",
    desc: "Mistral Small AI",
    category: "ai",
    use: '.mistralsmall <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/mistral-small?q=&uid=1234', 
        'Mistral Small'
    );
});

cmd({
    pattern: "llama3",
    react: "🦙",
    desc: "Llama3 Turbo AI",
    category: "ai",
    use: '.llama3 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=&uid=1234', 
        'Llama3 Turbo'
    );
});

cmd({
    pattern: "liner",
    react: "📈",
    desc: "Liner AI",
    category: "ai",
    use: '.liner <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/liner-ai?ask=', 
        'Liner AI'
    );
});

cmd({
    pattern: "humanizer",
    react: "👤",
    desc: "Humanizer AI",
    category: "ai",
    use: '.humanizer <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/humanizer?q=', 
        'Humanizer AI'
    );
});

cmd({
    pattern: "claude3",
    react: "🤖",
    desc: "Claude 3 Haiku AI",
    category: "ai",
    use: '.claude3 <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/claude3-haiku?ask=', 
        'Claude 3 Haiku'
    );
});

cmd({
    pattern: "bert",
    react: "🤖",
    desc: "BERT AI",
    category: "ai",
    use: '.bert <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/bert-ai?q=', 
        'BERT AI'
    );
});

cmd({
    pattern: "ariax",
    react: "🎶",
    desc: "Aria AI",
    category: "ai",
    use: '.aria <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/aria?ask=&uid=1234', 
        'Aria AI'
    );
});

cmd({
    pattern: "brave",
    react: "🦁",
    desc: "Brave AI",
    category: "ai",
    use: '.brave <your question>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await handleAIResponse(
        conn, from, mek, m, q, 
        'https://kaiz-apis.gleeze.com/api/brave-ai?ask=', 
        'Brave AI'
    );
});
