
const config = require('../config')
const {cmd , commands} = require('../command')



cmd({
    pattern: "test2",
    desc: "Check bot online or no.",
    category: "main",
    react: "👋",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
 
const ice = {
  key: {
    remoteJid: '120363025036063173@g.us',
    fromMe: false,
    participant: '0@s.whatsapp.net'
  },
  message: {
    groupInviteMessage: {
      groupJid: '120363025036063173@g.us',
      inviteCode: 'ABCD1234',
      groupName: 'WhatsApp ✅ • Group',
      caption: 'DaviX Smart Project',
      jpegThumbnail: null
    }
  }
}
 
 const botname = "𝐒𝐔𝐁𝐙𝐄𝐑𝐎 𝐌𝐃"; //add your name
 const ownername = "𝐌𝐑 𝐅𝐑𝐀𝐍𝐊"; // add your name
 const subzero = { 
 key: { 
  remoteJid: 'status@broadcast', 
  participant: '0@s.whatsapp.net' 
   }, 
message:{ 
  newsletterAdminInviteMessage: { 
    newsletterJid: '120363270086174844@newsletter', //add your channel jid
    newsletterName: "𝐈𝐂𝐘 𝐁𝐎𝐓", //add your bot name
    caption: botname + ` 𝐁𝐘 ` + ownername, 
    inviteExpiration: 0
  }
 }
}



let des = `*👋 Hello ${pushname}*`
return await conn.sendMessage(from,{
    image: {url: `https://files.catbox.moe/703kuc.jpg`},
    caption: des
},{quoted: ice })

// {quoted: mek} ඔයාලගෙ ඔතන 👈 ඔහොම ඇත්තෙ එක උඩ විදිහට හදා ගන්න..👆

}catch(e){
console.log(e)
reply(`${e}`)
}
})
