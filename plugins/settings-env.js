
/* Credits Kerm Owner of Kerm MD */

const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions');
const { writeFileSync } = require('fs');
const path = require('path');

let antilinkAction = "off"; // Default state
let warnCount = {}; // Track warnings per user

const os = require('os');
const { exec } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const { setConfig, getConfig } = require("../lib/configdb");




// SET BOT IMAGE
cmd({
  pattern: "setbotimage",
  desc: "Set the bot's image URL",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");

    let imageUrl = args[0];

    // Upload image if replying to one
    if (!imageUrl && m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");

      const mediaBuffer = await quotedMsg.download();
      const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
      const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}${extension}`);
      fs.writeFileSync(tempFilePath, mediaBuffer);

      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage${extension}`);
      form.append("reqtype", "fileupload");

      const response = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders()
      });

      fs.unlinkSync(tempFilePath);

      if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
        throw new Error(`Catbox upload failed: ${response.data}`);
      }

      imageUrl = response.data;
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
      return reply("❌ Provide a valid image URL or reply to an image.");
    }

    await setConfig("BOTIMAGE", imageUrl);

    await reply(`✅ Bot image updated.\n\n*New URL:* ${imageUrl}\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);

  } catch (err) {
    console.error(err);
    reply(`❌ Error: ${err.message || err}`);
  }
});

// SET PREFIX
cmd({
  pattern: "setprefix",
  desc: "Set the bot's command prefix",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  const newPrefix = args[0]?.trim();
  if (!newPrefix || newPrefix.length > 2) return reply("❌ Provide a valid prefix (1–2 characters).");

  await setConfig("PREFIX", newPrefix);

  await reply(`✅ Prefix updated to: *${newPrefix}*\n\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});



// SET BOT NAME
cmd({
  pattern: "setbotname",
  desc: "Set the bot's name",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  const newName = args.join(" ").trim();
  if (!newName) return reply("❌ Provide a bot name.");

  await setConfig("BOTNAME", newName);

  await reply(`✅ Bot name updated to: *${newName}*\n\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});

// SET OWNER NAME
cmd({
  pattern: "setownername",
  desc: "Set the owner's name",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  const name = args.join(" ").trim();
  if (!name) return reply("❌ Provide an owner name.");

  await setConfig("OWNERNAME", name);

  await reply(`✅ Owner name updated to: *${name}*\n\n♻️ Restarting...`);
  setTimeout(() => exec("pm2 restart all"), 2000);
});

// OLD SETTINGS

/*const { setConfig, getConfig } = require("../lib/configdb");
const { exec } = require("child_process");
const FormData = require('form-data');
const os = require('os');
const axios = require('axios');

cmd({
  pattern: "setbotimage",
  desc: "Set the bot's image URL",
  category: "owner",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");

    let imageUrl = args[0];

    // If no URL and replying to an image
    if (!imageUrl && m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");

      const mediaBuffer = await quotedMsg.download();
      const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
      const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}${extension}`);
      fs.writeFileSync(tempFilePath, mediaBuffer);

      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage${extension}`);
      form.append("reqtype", "fileupload");

      const response = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders()
      });

      fs.unlinkSync(tempFilePath);

      if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
        throw `Catbox upload failed: ${response.data}`;
      }

      imageUrl = response.data;
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
      return reply("❌ Provide a valid image URL or reply to an image.");
    }

    setConfig("BOT_IMAGE", imageUrl);

    await reply(`✅ Bot image updated.\n\n*New URL:* ${imageUrl}\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);

  } catch (err) {
    console.error(err);
    reply(`❌ Error: ${err.message || err}`);
  }
});




cmd({
    pattern: "setprefix",
    desc: "Set the bot's command prefix",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    const newPrefix = args[0]?.trim();
    if (!newPrefix || newPrefix.length > 2) return reply("❌ Provide a valid prefix (1–2 characters).");

    setConfig("PREFIX", newPrefix);

    await reply(`✅ Prefix updated to: *${newPrefix}*\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
});



cmd({
    pattern: "setbotname",
    desc: "Set the bot's name",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    const newName = args.join(" ").trim();
    if (!newName) return reply("❌ Provide a bot name.");

    setConfig("BOT_NAME", newName);

    await reply(`✅ Bot name updated to: *${newName}*\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
});


cmd({
    pattern: "setownername",
    desc: "Set the owner's name",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");
    const name = args.join(" ").trim();
    if (!name) return reply("❌ Provide an owner name.");

    setConfig("OWNER_NAME", name);

    await reply(`✅ Owner name updated to: *${name}*\n\n♻️ Restarting...`);
    setTimeout(() => exec("pm2 restart all"), 2000);
});
*/



//SETTINGS MENU

cmd({
    pattern: "setvar",
    alias: ["settings", "cmdlist"],
    react: "⚙️",
    desc: "List all commands and their current status.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, isOwner, reply }) => {
    // if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const cmdList = `
    ----------------------------------------
    \`\`\`SUBZERO SETTINGS\`\`\`
    -----------------------------------------
    
🔧 *1. \`Mode\`*
   - Current Status: ${config.MODE || "public"}
   - Usage: ${config.PREFIX}mode private/public

🎯 *2. \`Auto Typing\`*
   - Current Status: ${config.AUTOTYPING || "off"}
   - Usage: ${config.PREFIX}autotyping on/off

🌐 *3. \`Always Online\`*
   - Current Status: ${config.ALWAYSONLINE || "off"}
   - Usage: ${config.PREFIX}alwaysonline on/off

🎙️ *4. \`Auto Recording\`*
   - Current Status: ${config.AUTORECORDING || "off"}
   - Usage: ${config.PREFIX}autorecording on/off

📖 *5. \`Auto Read Status\`*
   - Current Status: ${config.AUTOSTATUSREACT || "off"}
   - Usage: ${config.PREFIX}autoreadstatus on/off

🚫 *6. \`Anti Bad Word\`*
   - Current Status: ${config.ANTIBADWORD || "off"}
   - Usage: ${config.PREFIX}antibad on/off

🗑️ *7. \`Anti Delete\`*
   - Current Status: ${config.ANTIDELETE || "off"}
   - Usage: ${config.PREFIX}antidelete on/off

🖼️ *8. \`Auto Sticker\`*
   - Current Status: ${config.AUTOSTICKER || "off"}
   - Usage: ${config.PREFIX}autosticker on/off

💬 *9. \`Auto Reply\`*
   - Current Status: ${config.AUTOREPLY || "off"}
   - Usage: ${config.PREFIX}autoreply on/off

❤️ *10. \`Auto React\`*
   - Current Status: ${config.AUTOREACT || "off"}
   - Usage: ${config.PREFIX}autoreact on/off

📢 *11. \`Status Reply\`*
   - Current Status: ${config.AUTOSTATUSREPLY || "off"}
   - Usage: ${config.PREFIX}autostatusreply on/off

🔗 *12. \`Anti Link\`*
   - Current Status: ${config.ANTILINK || "off"}
   - Usage: ${config.PREFIX}antilink on/off

🤖 *13. \`Anti Bot\`*
   - Current Status: ${config.ANTIBOT || "off"}
   - Usage: ${config.PREFIX}antibot off/warn/delete/kick

💖 *14. \`Heart React\`*
   - Current Status: ${config.HEARTREACT || "off"}
   - Usage: ${config.PREFIX}heartreact on/off

🔧 *15. \`Set Prefix\`*
   - Current Prefix: ${config.PREFIX || "."}
   - Usage: ${config.PREFIX}setprefix <new_prefix>

📌 *Note*: Replace \`"on/off"\` with the desired state to enable or disable a feature.
`;

    try {
        // First try to send with image attachment
        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/18il7k.jpg' },
            caption: cmdList
        }, { quoted: mek });
    } catch (e) {
        console.error('Error sending with image:', e);
        try {
            // Fallback to text only if image fails
            await conn.sendMessage(from, { 
                text: cmdList 
            }, { quoted: mek });
        } catch (error) {
            console.error('Error sending text:', error);
            // Final fallback to simple reply
            await reply(cmdList);
        }
    }
});

// SETTINGS OVER



// WELCOME
cmd({
    pattern: "welcome",
    alias: ["setwelcome"],
    react: "✅",
    desc: "Enable or disable welcome messages for new members",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.WELCOME = "true";
        return reply("✅ Welcome messages are now enabled.");
    } else if (status === "off") {
        config.WELCOME = "false";
        return reply("❌ Welcome messages are now disabled.");
    } else {
        return reply(`Example: .welcome on`);
    }
});




// ===========
/*
cmd({
    pattern: "mode",
    alias: ["setmode"],
    react: "🔐",
    desc: "Set bot mode to private or public.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    // Si aucun argument n'est fourni, afficher le mode actuel et l'usage
    if (!args[0]) {
        return reply(`📌 Current mode: *${config.MODE}*\n\nUsage: .mode private OR .mode public`);
    }

    const modeArg = args[0].toLowerCase();

    if (modeArg === "private") {
        config.MODE = "private";
        return reply("✅ Bot mode is now set to *PRIVATE*.");
    } else if (modeArg === "public") {
        config.MODE = "public";
        return reply("✅ Bot mode is now set to *PUBLIC*.");
    } else {
        return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
    }
});
*/


cmd({
    pattern: "mode",
    alias: ["setmode"],
    react: "🔐",
    desc: "Set bot mode to private or public.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const currentMode = getConfig("MODE") || "public";

    if (!args[0]) {
        return reply(`📌 Current mode: *${currentMode}*\n\nUsage: .mode private OR .mode public`);
    }

    const modeArg = args[0].toLowerCase();

    if (["private", "public"].includes(modeArg)) {
        setConfig("MODE", modeArg);
        await reply(`✅ Bot mode is now set to *${modeArg.toUpperCase()}*.\n\n♻ Restarting bot to apply changes...`);

        exec("pm2 restart all", (error, stdout, stderr) => {
            if (error) {
                console.error("Restart error:", error);
                return;
            }
            console.log("PM2 Restart:", stdout || stderr);
        });
    } else {
        return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
    }
});


cmd({
    pattern: "autotyping",
    alias: ["setautotyping"],
    react: "🫟",
    description: "Enable or disable auto-typing feature.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
        return reply("*🫟 ᴇxᴀᴍᴘʟᴇ:  .ᴀᴜᴛᴏᴛʏᴘɪɴɢ ᴏɴ*");
    }

    config.AUTOTYPING = status === "on" ? "true" : "false";
    return reply(`Auto typing has been turned ${status}.`);
});
//--------------------------------------------
// ALWAYS_ONLINE COMMANDS
//--------------------------------------------
cmd({
    pattern: "alwaysonline",
    react: "🫟",
    alias: ["setalwaysonline"],
    description: "Set bot status to always online or offline.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
        return reply("*🫟 ᴇxᴀᴍᴘʟᴇ:  .ᴀʟᴡᴀʏsᴏɴʟɪɴᴇ ᴏɴ*");
    }

    config.ALWAYSONLINE = status === "on" ? "true" : "false";
    await conn.sendPresenceUpdate(status === "on" ? "available" : "unavailable", from);
    return reply(`Bot is now ${status === "on" ? "online" : "offline"}.`);
});
//--------------------------------------------
//  AUTO_RECORDING COMMANDS
//--------------------------------------------
cmd({
    pattern: "autorecording",
    alias: ["autorecoding","setautorecording"],
    description: "Enable or disable auto-recording feature.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
        return reply("*🫟 ᴇxᴀᴍᴘʟᴇ: .ᴀᴜᴛᴏʀᴇᴄᴏʀᴅɪɴɢ ᴏɴ*");
    }

    config.AUTORECORDING = status === "on" ? "true" : "false";
    if (status === "on") {
        await conn.sendPresenceUpdate("recording", from);
        return reply("Auto recording is now enabled. Bot is recording...");
    } else {
        await conn.sendPresenceUpdate("available", from);
        return reply("Auto recording has been disabled.");
    }
});
//--------------------------------------------
// AUTO_VIEW_STATUS COMMANDS
//--------------------------------------------
cmd({
    pattern: "autostatusreact",
    alias: ["setautoreactstatus","autostatusreact"],
    react: "🫟",
    desc: "Enable or disable auto-viewing of statuses",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Default value for AUTO_VIEW_STATUS is "false"
    if (args[0] === "on") {
        config.AUTOSTATUSREACT = "true";
        return reply("Autoreact of statuses is now enabled.");
    } else if (args[0] === "off") {
        config.AUTOSTATUSREACT = "false";
        return reply("Autoreact of statuses is now disabled.");
    } else {
        return reply(`*🫟 ᴇxᴀᴍᴘʟᴇ:  .autustatusreact on*`);
    }
}); 
//--------------------------------------------
// AUTO_LIKE_STATUS COMMANDS
//--------------------------------------------

cmd({
    pattern: "autostatusview",
    alias: ["setautoviewstatus","autoviewstatus","setautostatusview"],
    desc: "Enable or disable autoview of statuses",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Default value for AUTO_LIKE_STATUS is "false"
    if (args[0] === "on") {
        config.AUTOSTATUSSEEN = "true";
        return reply("Autoview of statuses is now enabled.");
    } else if (args[0] === "off") {
        config.AUTOSTATUSSEEN= "false";
        return reply("Autoview of statuses is now disabled.");
    } else {
        return reply(`Example: .autoviewstatus on`);
    }
});

cmd({
    pattern: "anticall",
    react: "📞",
    alias: ["statusreaction"],
    desc: "Enable or disable anti-call",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Default value for AUTO_LIKE_STATUS is "false"
    if (args[0] === "on") {
        config.ANTICALL = "true";
        return reply("Anticall  is now enabled.");
    } else if (args[0] === "off") {
        config.ANTICALL = "false";
        return reply("Anticall  is now disabled.");
    } else {
        return reply(`⭕ Example: .anticall on/off`);
    }
});
/*
//--------------------------------------------
//  READ-MESSAGE COMMANDS
//--------------------------------------------
cmd({
    pattern: "read-message",
    alias: ["autoread"],
    desc: "enable or disable readmessage.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.AUTO_STICKER = "true";
        return reply("readmessage feature is now enabled.");
    } else if (args[0] === "off") {
        config.AUTO_STICKER = "false";
        return reply("readmessage feature is now disabled.");
    } else {
        return reply(`_example:  .readmessage on_`);
    }
});
*/
//--------------------------------------------
//  ANI-BAD COMMANDS
//--------------------------------------------
cmd({
    pattern: "antibad",
    alias: ["setantibad"],
    react: "🫟",
    alias: ["antibadword"],
    desc: "enable or disable antibad.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.ANTIBADWORD = "true";
        return reply("*anti bad word is now enabled.*");
    } else if (args[0] === "off") {
        config.ANTIBADWORD = "false";
        return reply("*anti bad word feature is now disabled*");
    } else {
        return reply(`_example:  .antibad on_`);
    }
});
//--------------------------------------------
//  AUTO-STICKER COMMANDS
//--------------------------------------------
cmd({
    pattern: "autosticker",
    alias: ["setautosticker"],
    react: "🫟",
    alias: ["autosticker"],
    desc: "enable or disable auto-sticker.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.AUTOSTICKER = "true";
        return reply("auto-sticker feature is now enabled.");
    } else if (args[0] === "off") {
        config.AUTOSTICKER = "false";
        return reply("auto-sticker feature is now disabled.");
    } else {
        return reply(`_example:  .autosticker on_`);
    }
});
//--------------------------------------------
//  AUTO-REPLY COMMANDS
//--------------------------------------------
cmd({
    pattern: "autoreply",
    alias: ["setautoreply"],
    react: "🫟",
    alias: ["autoreply"],
    desc: "enable or disable auto-reply.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.AUTOREPLY = "true";
        return reply("*auto-reply  is now enabled.*");
    } else if (args[0] === "off") {
        config.AUTOREPLY = "false";
        return reply("auto-reply feature is now disabled.");
    } else {
        return reply(`*🫟 ᴇxᴀᴍᴘʟᴇ: . ᴀᴜᴛᴏʀᴇᴘʟʏ ᴏɴ*`);
    }
});

//--------------------------------------------
//   AUTO-REACT COMMANDS
//--------------------------------------------
cmd({
    pattern: "autoreact",
    alias: ["setautoreact"],
    react: "🫟",
    alias: ["autoreact"],
    desc: "Enable or disable the autoreact feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.AUTOREACT = "true";
        await reply("autoreact feature is now enabled.");
    } else if (args[0] === "off") {
        config.AUTOREACT = "false";
        await reply("autoreact feature is now disabled.");
    } else {
        await reply(`*🔥 ᴇxᴀᴍᴘʟᴇ: .ᴀᴜᴛᴏʀᴇᴀᴄᴛ ᴏɴ*`);
    }
});
//--------------------------------------------
//  STATUS-REPLY COMMANDS
//--------------------------------------------

cmd({
    pattern: "setautostatusreply",
    react: "🫟",
    alias: ["autostatusreply"],
    desc: "enable or disable status-reply.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.AUTOSTATUSREPLY = "true";
        return reply("status-reply feature is now enabled.");
    } else if (args[0] === "off") {
        config.AUTOSTATUSREPLY = "false";
        return reply("status-reply feature is now disabled.");
    } else {
        return reply(`*🫟 ᴇxᴀᴍᴘʟᴇ:  .sᴛᴀᴛᴜsʀᴇᴘʟʏ ᴏɴ*`);
    }
});

//--------------------------------------------
//  ANTILINK1 COMMANDS
//--------------------------------------------
cmd({
    pattern: "antilink1",
    react: "🫟",
    desc: "Enable Antilink (warn/delete/kick) or turn off",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    if (!q) {
        return reply(`*Current Antilink Action:* ${antilinkAction.toUpperCase()}\n\nUse *antilink warn/delete/kick/off* to change it.`);
    }

    const action = q.toLowerCase();
    if (["warn", "delete", "kick", "off"].includes(action)) {
        antilinkAction = action;
        return reply(`*Antilink action set to:* ${action.toUpperCase()}`);
    } else {
        return reply("❌ *Invalid option!* Use *antilink warn/delete/kick/off*.");
    }
});
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup, sender, isBotAdmins, isAdmins, reply }) => {
    if (!isGroup || antilinkAction === "off") return;
    
    if (isUrl(body)) { // Using isUrl to detect links
        if (!isBotAdmins || isAdmins) return;

        return reply(`⚠️ *Warning! Links are not allowed here.*`);
        await conn.sendMessage(from, { delete: mek.key });

        switch (antilinkAction) {
            case "warn":
                warnCount[sender] = (warnCount[sender] || 0) + 1;
                if (warnCount[sender] >= 3) {
                    delete warnCount[sender];
                    await conn.groupParticipantsUpdate(from, [sender], "remove");
                }
                break;

            case "kick":
                await conn.groupParticipantsUpdate(from, [sender], "remove");
                break;
        }
    }
});


let antibotAction = "off"; // Default action is off
let warnings = {}; // Store warning counts per user

cmd({
    pattern: "antibot",
    react: "🫟",
    alias: ["antibot"],
    desc: "Enable Antibot and set action (off/warn/delete/kick)",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    if (!q) {
        return reply(`*Current Antibot Action:* ${antibotAction.toUpperCase()}\n\nUse *antibot off/warn/delete/kick* to change it.`);
    }

    const action = q.toLowerCase();
    if (["off", "warn", "delete", "kick"].includes(action)) {
        antibotAction = action;
        return reply(`*Antibot action set to:* ${action.toUpperCase()}`);
    } else {
        return reply("*🫟 ᴇxᴀᴍᴘʟᴇ: . ᴀɴᴛɪ-ʙᴏᴛ ᴏғғ/ᴡᴀʀɴ/ᴅᴇʟᴇᴛᴇ/ᴋɪᴄᴋ*");
    }
});

cmd({
    on: "body"
}, async (conn, mek, m, { from, isGroup, sender, isBotAdmins, isAdmins, reply }) => {
    if (!isGroup || antibotAction === "off") return; // Check if antibot is enabled

    const messageId = mek.key.id;
    if (!messageId || !messageId.startsWith("3EB")) return; // Detect bot-generated messages

    if (!isBotAdmins) return reply("*_I'm not an admin, so I can't take action!_*");
    if (isAdmins) return; // Ignore admins

    await conn.sendMessage(from, { delete: mek.key }); // Delete the detected bot message

    switch (antibotAction) {
        case "kick":
            await conn.groupParticipantsUpdate(from, [sender], "remove");
            break;

        case "warn":
            warnings[sender] = (warnings[sender] || 0) + 1;
            if (warnings[sender] >= 3) {
                delete warnings[sender]; // Reset warning count after kicking
                await conn.groupParticipantsUpdate(from, [sender], "remove");
            } else {
                return reply(`⚠️ @${sender.split("@")[0]}, warning ${warnings[sender]}/3! Bots are not allowed!`, { mentions: [sender] });
            }
            break;
    }
});

//--------------------------------------------
//  ANTILINK COMMANDS
//--------------------------------------------
cmd({
  pattern: "antilink",
  react: "🫟",
  alias: ["antilink"],
  desc: "Enable or disable anti-link feature in groups",
  category: "group",
  react: "🚫",
  filename: __filename
}, async (conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
  try {
    // Check for group, bot admin, and user admin permissions
    if (!isGroup) return reply('This command can only be used in a group.');
    if (!isBotAdmins) return reply('Bot must be an admin to use this command.');
    if (!isAdmins) return reply('You must be an admin to use this command.');

    // Enable or disable anti-link feature
    if (args[0] === "on") {
      config.ANTILINK = "true";
      await reply("Anti-link feature is now enabled in this group.");
    } else if (args[0] === "off") {
      config.ANTILINK = "false";
      await reply("Anti-link feature is now disabled in this group.");
    } else {
      await reply(`*Invalid input! Use either 'on' or 'off'. Example:antilink on*`);
    }
  } catch (error) {
    return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${error.message}`);
  }
});
//--------------------------------------------
//   POLL COMMANDS
//--------------------------------------------
cmd({
  pattern: "poll",
  react: "🫟",
  category: "group",
  desc: "Create a poll with a question and options in the group.",
  filename: __filename,
}, async (conn, mek, m, { from, isGroup, body, sender, groupMetadata, participants, prefix, pushname, reply }) => {
  try {
    let [question, optionsString] = body.split(";");
    
    if (!question || !optionsString) {
      return reply(`Usage: ${prefix}poll question;option1,option2,option3...`);
    }

    let options = [];
    for (let option of optionsString.split(",")) {
      if (option && option.trim() !== "") {
        options.push(option.trim());
      }
    }

    if (options.length < 2) {
      return reply("*Please provide at least two options for the poll.*");
    }

    await conn.sendMessage(from, {
      poll: {
        name: question,
        values: options,
        selectableCount: 1,
        toAnnouncementGroup: true,
      }
    }, { quoted: mek });
  } catch (e) {
    return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});
//--------------------------------------------
// RANDOM SHIP COMMANDS
//--------------------------------------------
cmd({
    pattern: "randomship",
    react: "🫟",
    desc: "Randomly ship two members in a group.",
    category: "group",
    react: "💞",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, participants, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups!");
        
        const members = participants.filter(p => !p.admin); // Exclude admins if needed
        if (members.length < 2) return reply("❌ Not enough members to ship!");

        const shuffled = members.sort(() => Math.random() - 0.5);
        const user1 = shuffled[0].id;
        const user2 = shuffled[1].id;

        reply(`💖 I randomly ship @${user1.split("@")[0]} & @${user2.split("@")[0]}! Cute couple! 💞`, {
            mentions: [user1, user2]
        });

    } catch (e) {
        console.error(e);
        reply("❌ Error processing command.");
    }
});
//--------------------------------------------
//  NEW_GC COMMANDS
//--------------------------------------------
cmd({
  pattern: "newgc",
      alias: ["creategc","creategroup"],
  react: "🫟",
  category: "group",
  desc: "Create a new group and add participants.",
  filename: __filename,
}, async (conn, mek, m, { from, isGroup, body, sender, groupMetadata, participants, reply }) => {
  try {
    if (!body) {
      return reply(`Usage: .newgc group_name;number1,number2,...`);
    }

    const [groupName, numbersString] = body.split(";");
    
    if (!groupName || !numbersString) {
      return reply(`Usage: !newgc group_name;number1,number2,...`);
    }

    const participantNumbers = numbersString.split(",").map(number => `${number.trim()}@s.whatsapp.net`);

    const group = await conn.groupCreate(groupName, participantNumbers);
    console.log('created group with id: ' + group.id); // Use group.id here

    const inviteLink = await conn.groupInviteCode(group.id); // Use group.id to get the invite link

    await conn.sendMessage(group.id, { text: '🫟 hello there' });

    reply(`Group created successfully with invite link: https://chat.whatsapp.com/${inviteLink}\nWelcome message sent.`);
  } catch (e) {
    return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});
//--------------------------------------------
//  EXIT COMMANDS
//--------------------------------------------
/*cmd({
  pattern: "exit",
  react: "🫟",
  desc: "Leaves the current group",
  category: "group",
}, async (conn, mek, m, { from, reply }) => {
  try {
    // `from` is the group chat ID
    await conn.groupLeave(from);
    reply("Subzero Successfully left the group🙂.");
  } catch (error) {
    console.error(error);
    reply("Failed to leave the group.🤦🏽‍♂️");
  }
});*/
//--------------------------------------------
//  AUTO_RECORDING COMMANDS
//--------------------------------------------
cmd({
    pattern: "invite2",
    react: "🫟",
    alias: ["glink"],
    desc: "Get group invite link.",
    category: "group", // Already group
    filename: __filename,
}, async (conn, mek, m, { from, quoted, body, args, q, isGroup, sender, reply }) => {
    try {
        // Ensure this is being used in a group
        if (!isGroup) return reply("𝐓𝐡𝐢𝐬 𝐅𝐞𝐚𝐭𝐮𝐫𝐞 𝐈𝐬 𝐎𝐧𝐥𝐲 𝐅𝐨𝐫 𝐆𝐫𝐨𝐮𝐩❗");

        // Get the sender's number
        const senderNumber = sender.split('@')[0];
        const botNumber = conn.user.id.split(':')[0];
        
        // Check if the bot is an admin
        const groupMetadata = isGroup ? await conn.groupMetadata(from) : '';
        const groupAdmins = groupMetadata ? groupMetadata.participants.filter(member => member.admin) : [];
        const isBotAdmins = isGroup ? groupAdmins.some(admin => admin.id === botNumber + '@s.whatsapp.net') : false;
        
        if (!isBotAdmins) return reply("𝐏𝐥𝐞𝐚𝐬𝐞 𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐌𝐞 𝐀𝐝𝐦𝐢𝐧 𝐑𝐨𝐥𝐞 ❗");

        // Check if the sender is an admin
        const isAdmins = isGroup ? groupAdmins.some(admin => admin.id === sender) : false;
        if (!isAdmins) return reply("𝐏𝐥𝐞𝐚𝐬𝐞 𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐌𝐞 𝐀𝐝𝐦𝐢𝐧 𝐑𝐨𝐥𝐞 ❗");

        // Get the invite code and generate the link
        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) return reply("Failed to retrieve the invite code.");

        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        // Reply with the invite link
        return reply(`*Here is your group invite link:*\n${inviteLink}`);
        
    } catch (error) {
        console.error("Error in invite command:", error);
        reply(`An error occurred: ${error.message || "Unknown error"}`);
    }
});

//--------------------------------------------
//           BROADCAST COMMANDS
//--------------------------------------------
cmd({
  pattern: "broadcast",
  alias: ["bcall","bc"],
  react: "🫟",
  category: "group",
  desc: "Bot makes a broadcast in all groups",
  filename: __filename,
  use: "<text for broadcast.>"
}, async (conn, mek, m, { q, isGroup, isAdmins, reply }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isAdmins) return reply("❌ You need to be an admin to broadcast in this group!");

    if (!q) return reply("❌ Provide text to broadcast in all groups!");

    let allGroups = await conn.groupFetchAllParticipating();
    let groupIds = Object.keys(allGroups); // Extract group IDs

    reply(`📢 Sending Broadcast To ${groupIds.length} Groups...\n⏳ Estimated Time: ${groupIds.length * 1.5} seconds`);

    for (let groupId of groupIds) {
      try {
        await sleep(1500); // Avoid rate limits
        await conn.sendMessage(groupId, { text: q }); // Sends only the provided text
      } catch (err) {
        console.log(`❌ Failed to send broadcast to ${groupId}:`, err);
      }
    }

    return reply(`✅ Successfully sent broadcast to ${groupIds.length} groups!`);
    
  } catch (err) {
    await m.error(`❌ Error: ${err}\n\nCommand: broadcast`, err);
  }
});
//--------------------------------------------
//  AUTO_RECORDING COMMANDS
//--------------------------------------------
cmd({
    pattern: "setgrouppp",
    react: "🫟",
    desc: "Set full-screen profile picture for groups.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { quoted, isGroup, isAdmins, isBotAdmins, reply }) => {
    if (!isGroup) return reply("⚠️ This command can only be used in a group.");
    if (!isAdmins) return reply("❌ You must be an admin to use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to change the group profile picture.");
    if (!quoted || !quoted.image) return reply("⚠️ Reply to an image to set as the group profile picture.");

    try {
        let media = await quoted.download();
        await conn.updateProfilePicture(m.chat, media);
        reply("✅ Group profile picture updated successfully.");
    } catch (e) {
        console.error(e);
        reply(`❌ Failed to update group profile picture: ${e.message}`);
    }
});
cmd({
    pattern: "heartreact",
    react: "🫟",
    alias: ["heart"],
    desc: "Enable or disable heart react.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const option = args[0]?.toLowerCase();
    
    if (option === "on" || option === "true") {
        config.HEARTREACT = "true"; // Set to "true" for enabling
        return reply("❤️ Heart react is now enabled.");
    } else if (option === "off" || option === "false") {
        config.HEARTREACT = "false"; // Set to "false" for disabling
        return reply("💔 Heart react is now disabled.");
    } else {
        return reply("*🔥 Example: .heartreact on* or *[.heartreact off]*");
    }
});
