const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const config = require('../config');

// Store cached plugins
let pluginCache = [];

cmd({
    pattern: "listplugins2",
    alias: ["plugins2", "plugs"],
    react: "📂",
    desc: "List all available plugins",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        // Get repo from config or use default
        const repoUrl = config.REPO || "https://github.com/3strox/x";
        const repoPath = repoUrl.replace('https://github.com/', '');
        const [owner, repo] = repoPath.split('/');
        
        if (!owner || !repo) {
            return reply("❌ Invalid repository URL in config");
        }

        // Fetch plugins folder
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/plugins`;
        const { data } = await axios.get(apiUrl);
        
        // Filter only JS files
        const plugins = data.filter(item => 
            item.type === 'file' && item.name.endsWith('.js')
        );
        
        if (plugins.length === 0) {
            return reply("❌ No plugins found in repository");
        }

        // Cache plugins
        pluginCache = plugins;

        // Format list
        let list = "📂 *Subzero Available Plugins:*\n\n";
        plugins.forEach((plugin, i) => {
            list += `${i+1}. ${plugin.name}\n`;
        });
        
        list += "\n💡 Use `.getplugin <number>` to download";
        
        await reply(list);
        
    } catch (error) {
        console.error("Listplugins error:", error);
        reply("❌ Failed to fetch plugins list");
    }
});

cmd({
    pattern: "getplugin",
    alias: ["plugin", "download"],
    react: "⬇️",
    desc: "Download a plugin",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    try {
        if (!args[0]) return reply("❌ Please specify plugin number or name\nExample: .getplugin 1");

        // Get plugin by number or name
        let plugin;
        const input = args[0];
        
        if (/^\d+$/.test(input)) {
            // Input is a number
            const num = parseInt(input) - 1;
            if (num < 0 || num >= pluginCache.length) {
                return reply("❌ Invalid plugin number");
            }
            plugin = pluginCache[num];
        } else {
            // Input is a name
            plugin = pluginCache.find(p => 
                p.name.toLowerCase() === input.toLowerCase()
            );
            if (!plugin) return reply("❌ Plugin not found");
        }

        // Download plugin
        const { data } = await axios.get(plugin.download_url, {
            responseType: 'arraybuffer'
        });

        // Send as document
        await conn.sendMessage(
            m.chat, 
            {
                document: data,
                fileName: plugin.name,
                mimetype: 'application/javascript'
            }, 
            { quoted: mek }
        );

        await reply(`✅ Successfully downloaded ${plugin.name}`);

    } catch (error) {
        console.error("Getplugin error:", error);
        reply("❌ Failed to download plugin");
    }
});
