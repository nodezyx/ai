const axios = require("axios");
const { cmd } = require("../command");
const Config = require('../config');

cmd({
  pattern: "fbdl",
  alias: ["facebook", "fbvideo","fb"],
  react: '📥',
  desc: "Download videos from Facebook.",
  category: "download",
  use: ".fbdl <Facebook video URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    // Check if the user provided a Facebook video URL
    const fbUrl = args[0];
    if (!fbUrl || !fbUrl.includes("facebook.com")) {
      return reply('Please provide a valid Facebook video URL. Example: `.fbdl https://facebook.com/...`');
    }

    // Add a reaction to indicate processing
    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Prepare the primary API URL
    const primaryApiUrl = `https://apis.davidcyriltech.my.id/facebook2?url=${encodeURIComponent(fbUrl)}`;
    
    // Prepare fallback APIs
    const fallbackApis = [
      `https://kaiz-apis.gleeze.com/api/fbdl?url=${encodeURIComponent(fbUrl)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`,
      `https://api.giftedtech.web.id/api/download/facebook?apikey=gifted&url=${encodeURIComponent(fbUrl)}`
    ];

    let videoData = null;
    let apiIndex = 0;
    const apis = [primaryApiUrl, ...fallbackApis];

    // Try each API until we get a successful response
    while (apiIndex < apis.length && !videoData) {
      try {
        const response = await axios.get(apis[apiIndex]);
        
        // Parse response based on which API responded
        if (apiIndex === 0) {
          // Primary API response format
          if (response.data && response.data.status && response.data.video) {
            const { title, thumbnail, downloads } = response.data.video;
            videoData = {
              title: title || "Facebook Video",
              thumbnail,
              downloadUrl: downloads.find(d => d.quality === "HD")?.downloadUrl || downloads[0].downloadUrl,
              quality: downloads.find(d => d.quality === "HD") ? "HD" : "SD"
            };
          }
        } else if (apiIndex === 1) {
          // Kaiz API response format
          if (response.data && response.data.videoUrl) {
            videoData = {
              title: response.data.title || "Facebook Video",
              thumbnail: response.data.thumbnail,
              downloadUrl: response.data.videoUrl,
              quality: response.data.quality || "HD"
            };
          }
        } else if (apiIndex === 2) {
          // GiftedTech API response format
          if (response.data && response.data.success && response.data.result) {
            const result = response.data.result;
            videoData = {
              title: result.title || "Facebook Video",
              thumbnail: result.thumbnail,
              downloadUrl: result.hd_video || result.sd_video,
              quality: result.hd_video ? "HD" : "SD"
            };
          }
        }
      } catch (error) {
        console.error(`Error with API ${apiIndex}:`, error.message);
      }
      apiIndex++;
    }

    if (!videoData) {
      return reply('❌ All download services failed. Please try again later.');
    }

    // Check if button interface should be used
    const useButtons = Config.BUTTON === true || Config.BUTTON === "true";

    if (useButtons) {
      // Button-based interface
      try {
        // Download thumbnail
        let thumbnailBuffer = null;
        if (videoData.thumbnail) {
          try {
            const thumbnailResponse = await axios.get(videoData.thumbnail, { 
              responseType: 'arraybuffer', 
              timeout: 5000 
            });
            thumbnailBuffer = Buffer.from(thumbnailResponse.data, 'binary');
          } catch (thumbError) {
            console.error('Thumbnail download failed:', thumbError);
          }
        }

        // Generate unique session ID
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Prepare caption
        const caption = `📥 *Facebook Video Downloader*\n\n` +
          `🔖 *Title*: ${videoData.title}\n` +
          `📏 *Quality*: ${videoData.quality}\n\n` +
          `> © Powered by Mr Frank`;

        // Create buttons message
        const buttonsMessage = {
          image: thumbnailBuffer,
          caption,
          footer: Config.FOOTER || 'Select download option',
          buttons: [
            {
              buttonId: `fbdl-video-${sessionId}-${fbUrl}`,
              buttonText: { displayText: '🎥 Video' },
              type: 1
            },
            {
              buttonId: `fbdl-document-${sessionId}-${fbUrl}`,
              buttonText: { displayText: '📁 Document' },
              type: 1
            }
          ],
          headerType: 1,
          contextInfo: {
            externalAdReply: {
              title: videoData.title || "Facebook Video",
              body: `Quality: ${videoData.quality}`,
              thumbnail: thumbnailBuffer,
              mediaType: 1,
              mediaUrl: fbUrl,
              sourceUrl: fbUrl
            }
          }
        };

        // Send message with buttons
        const finalMsg = await conn.sendMessage(from, buttonsMessage, { quoted: mek });
        const messageId = finalMsg.key.id;

        // Button handler
        const buttonHandler = async (msgData) => {
          const receivedMsg = msgData.messages[0];
          if (!receivedMsg.message?.buttonsResponseMessage) return;

          const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
          const senderId = receivedMsg.key.remoteJid;
          const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

          if (isReplyToBot && senderId === from && buttonId.includes(sessionId)) {
            conn.ev.off('messages.upsert', buttonHandler); // Remove listener

            await conn.sendMessage(from, { react: { text: '⏳', key: receivedMsg.key } });

            try {
              const isDocument = buttonId.startsWith(`fbdl-document-${sessionId}`);
              
              // Download the video
              await reply('```Downloading video... Please wait.📥```');
              const videoResponse = await axios.get(videoData.downloadUrl, { 
                responseType: 'arraybuffer',
                timeout: 30000
              });
              
              if (!videoResponse.data) {
                throw new Error('Failed to download video');
              }

              const videoBuffer = Buffer.from(videoResponse.data, 'binary');
              const fileName = `${videoData.title.replace(/[<>:"\/\\|?*]+/g, '')}.mp4`;

              // Send video based on selection
              if (isDocument) {
                await conn.sendMessage(from, {
                  document: videoBuffer,
                  mimetype: 'video/mp4',
                  fileName: fileName
                }, { quoted: receivedMsg });
              } else {
                await conn.sendMessage(from, {
                  video: videoBuffer,
                  caption: caption
                }, { quoted: receivedMsg });
              }

              await conn.sendMessage(from, { react: { text: '✅', key: receivedMsg.key } });
            } catch (error) {
              console.error('Video Download Error:', error);
              await conn.sendMessage(from, { react: { text: '❌', key: receivedMsg.key } });
              reply(`❌ Error: ${error.message || 'Download failed'}`);
            }
          }
        };

        // Add listener
        conn.ev.on('messages.upsert', buttonHandler);

        // Remove listener after 1 minute
        setTimeout(() => {
          conn.ev.off('messages.upsert', buttonHandler);
        }, 60000);

      } catch (error) {
        console.error('Button interface error:', error);
        // Fall back to text interface if button interface fails
        await sendVideoDirectly();
      }
    } else {
      // Text-based interface (original code)
      await sendVideoDirectly();
    }

    async function sendVideoDirectly() {
      // Inform the user that the video is being downloaded
      await reply('```Downloading video... Please wait.📥```');

      // Download the video
      const videoResponse = await axios.get(videoData.downloadUrl, { responseType: 'arraybuffer' });
      if (!videoResponse.data) {
        return reply('❌ Failed to download the video. Please try again later.');
      }

      // Prepare the video buffer
      const videoBuffer = Buffer.from(videoResponse.data, 'binary');

      // Send the video with details
      await conn.sendMessage(from, {
        video: videoBuffer,
        caption: `📥 *Video Details*\n\n` +
          `🔖 *Title*: ${videoData.title}\n` +
          `📏 *Quality*: ${videoData.quality}\n\n` +
          `> © ᴘɪᴡᴇʀᴇᴅ ʙʏ ᴍʀ ғʀᴀɴᴋ`,
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

      // Add a reaction to indicate success
      await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
    }

  } catch (error) {
    console.error('Error downloading video:', error);
    reply('❌ Unable to download the video. Please try again later.');

    // Add a reaction to indicate failure
    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
