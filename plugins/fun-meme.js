const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "meme",
    desc: "Generate random memes",
    alias: ["randommeme"],
    category: "fun",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Popular meme subreddits to pull from
        const subreddits = [
            'dankmemes',
            'memes',
            'wholesomememes',
            'ProgrammerHumor',
            'me_irl',
            'AdviceAnimals',
            'MemeEconomy',
            'comedyheaven',
            'terriblefacebookmemes',
            'funny'
        ];
        
        // Select random subreddit
        const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)];
        
        // Get meme from API
        const { data } = await axios.get(`https://meme-api.com/gimme/${randomSub}`);
        
        if (!data.url) throw new Error('No meme found');
        
        // Send the meme image
        await conn.sendMessage(from, {
            image: { url: data.url },
            caption: `*${data.title}*\n\n> _From r/${data.subreddit}_`,
            contextInfo: {
                externalAdReply: {
                    title: "Random Meme Generator",
                    body: "Powered by Mr Frank 🦋",
                    thumbnail: { url: data.url }
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error('Meme Error:', error);
        reply('❌ Failed to get meme. Try again later!');
    }
});
