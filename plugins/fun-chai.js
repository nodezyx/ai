const { cmd } = require('../command');
const { sleep } = require('../lib/functions'); // Import sleep function

cmd({
    pattern: "chai",
    alias: ["tea", "chay", "cha", "chah"],
    desc: "Brews you a fantastic cup of chai with the famous meme!",
    category: "tools",
    react: "☕",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        // Owner restriction check
        if (!isCreator) {
            return await conn.sendMessage(from, {
                text: "*📛 This is an owner command.*"
            }, { quoted: mek });
        }

        // making
        const brewingMsg = await conn.sendMessage(from, { 
            text: 'Brewing your chai... ☕' 
        }, { quoted: mek });

        // Chai brewing animation with fun steps
        const chaiSteps = [
            "Boiling water... 💦",
            "Adding Assam tea leaves... 🍃",
            "Pouring fresh milk... 🥛",
            "Crushing ginger & cardamom... 🧄🌿",
            "Adding just the right sugar... ⚖️",
            "Letting it boil to perfection... ♨️",
            "*Aroma intensifies* 👃🤤",
            "Straining the tea... 🕳️",
            "Pouring into cup... 🫖",
            "Almost ready... ⏳"
        ];

        // Show each step with delay
        for (const step of chaiSteps) {
            await sleep(1000); // 1 second delay between steps
            await conn.relayMessage(
                from,
                {
                    protocolMessage: {
                        key: brewingMsg.key,
                        type: 14,
                        editedMessage: {
                            conversation: step,
                        },
                    },
                },
                {}
            );
        }

        // Final text message
        await sleep(1000);
        await conn.sendMessage(from, { 
            text: 'Your masala chai is ready! ☕✨\nWait sending you...' 
        }, { quoted: mek });

        // Send the famous meme image
        await sleep(1000);
        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/dyzdgl.jpg" },
            caption: "- *The Tea Was Fantastic* ☕\n> _(Remember 2019 😂💀🗿)_ \n - *2019 X 2025 🗿😎*",
            mimetype: "image/jpeg"
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`❌ *Chai spilled!* ${e.message}\n_Better luck next time!_`);
    }
});
