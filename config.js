const fs = require('fs');
const path = require('path');
const { getConfig } = require("./lib/configdb");
const settings = require('./settings');

// Load environment variables from config.env if it exists
if (fs.existsSync('config.env')) {
    require('dotenv').config({ path: './config.env' });
}

// Helper function to convert text to boolean
function convertToBool(text, fault = 'true') {
    return text === fault;
}

module.exports = {
    // ===== BOT CORE SETTINGS =====
    CHATBOT: getConfig("CHATBOT") || "on",
    SESSION_ID: settings.SESSION_ID || process.env.SESSION_ID || "",
    PREFIX: getConfig("PREFIX") || settings.PREFIX || ".",
    BOTNAME: process.env.BOTNAME || getConfig("BOTNAME") || "SUBZERO-MD",
    MODE: getConfig("MODE") || process.env.MODE || "public",
    REPO: process.env.REPO || "https://github.com/mrfrankofcc/SUBZERO-MD",
    BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys",
    TOKEN: process.env.TOKEN || "xJ6QYrPDaRnMG2y5mcvT8tatbsABMg15Gxp1",
    BUTTON: getConfig("BUTTON") || false,

    // ===== OWNER & DEVELOPER INFO =====
    OWNERNUMBER: settings.OWNERNUMBER || process.env.OWNERNUMBER || "263719647303",
    OWNERNAME: process.env.OWNERNAME || getConfig("OWNERNAME") || "Mr Frank",
    DEV: process.env.DEV || "263719647303",
    DEVELOPER_NUMBER: '263719647303@s.whatsapp.net',

    // ===== AUTO-RESPONSE SETTINGS =====
    AUTOREPLY: process.env.AUTOREPLY || "false",
    AUTOSTATUSREPLY: process.env.AUTOSTATUSREPLY || "false",
    AUTOSTATUSMSG: process.env.AUTOSTATUSMSG || "*SUBZERO BOT VIEWED YOUR STATUS 🤖*",
    AUTOREADMESSAGE: process.env.AUTOREADMESSAGE || "false",

    // ===== REACTION & STICKER SETTINGS =====
    AUTOREACT: getConfig("AUTOREACT") || process.env.AUTOREACT || "false",
    CUSTOMREACT: process.env.CUSTOMREACT || "false",
    CUSTOMREACTEMOJIS: process.env.CUSTOMREACTEMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
    STICKER_NAME: process.env.STICKERNAME || "SUBZERO-MD",
    AUTOSTICKER: process.env.AUTOSTICKER || "false",
    HEARTREACT: process.env.HEARTREACT || "false",
    OWNERREACT: getConfig("OWNERREACT") || process.env.OWNERREACT || "false",

    // ===== MEDIA & AUTOMATION =====
    AUTOVOICE: process.env.AUTOVOICE || "false",
    AUTORECORDING: getConfig("AUTORECORDING") || process.env.AUTORECORDING || "false",
    AUTOTYPING: getConfig("AUTOTYPING") || process.env.AUTOTYPING || "false",
    BOTIMAGE: getConfig("BOTIMAGE") || "https://mrfrankk-cdn.hf.space/mrfrank/menu.png",

    // ===== SECURITY & ANTI-FEATURES =====
    ANTIDELETE: process.env.ANTIDELETE || "true",
    ANTICALL: getConfig("ANTICALL") || process.env.ANTICALL || "false",
    ANTIBAD: process.env.ANTIBAD || "false",
    ANTILINK: getConfig("ANTILINK") || process.env.ANTILINK || "true",
    ANTIVV: process.env.ANTIVV || "true",
    ANTIBOT: process.env.ANTIBOT || "true",
    DELETELINKS: process.env.DELETELINKS || "false",
    ANTIDELPATH: process.env.ANTIDELPATH || "inbox",
    PMBLOCKER: process.env.PMBLOCKER || "true",

    // ===== BOT BEHAVIOR & APPEARANCE =====
    FOOTER: process.env.FOOTER || "© 𝘾𝙧𝙚𝙖𝙩𝙚𝙙 𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ",
    ALWAYSONLINE: getConfig("ALWAYSONLINE") || process.env.ALWAYSONLINE || "false",
    AUTOSTATUSREACT: getConfig("AUTOSTATUSREACT") || process.env.AUTOSTATUSREACT || "true",
    AUTOSTATUSSEEN: getConfig("AUTOSTATUSSEEN") || process.env.AUTOSTATUSSEEN || "true",
    AUTOBIO: getConfig("AUTOBIO") || process.env.AUTO_BIO || "false",
    WELCOME_GOODBYE: getConfig("WELCOME_GOODBYE") || process.env.WELCOME_GOODBYE || "false",
    AMDINEVENTS: process.env.ADMINEVENTS || "true"
};
