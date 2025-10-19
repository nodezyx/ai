const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
    pattern: "repotree",
    alias: ["repostructure", "repodir"],
    react: "📁",
    desc: "Show repository folder structure",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        // Get repo from config or use default
        const repoUrl =  "https://github.com/3strox/x" || config.REPO ;
        const repoPath = repoUrl.replace('https://github.com/', '');
        const [owner, repo] = repoPath.split('/');
        
        if (!owner || !repo) {
            return reply("❌ Invalid repository URL in config");
        }

        // Fetch root directory
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
        const { data } = await axios.get(apiUrl);

        // Build simple structure
        let structure = `📁 ${repo}\n`;
        
        for (const item of data) {
            if (item.type === 'dir') {
                structure += `├── 📂 ${item.name}/\n`;
            } else {
                structure += `├── 📄 ${item.name}\n`;
            }
        }

        await reply(`\`\`\`\n${structure}\`\`\``);

    } catch (error) {
        console.error("Repotree error:", error);
        reply("❌ Failed to fetch repository structure");
    }
});
