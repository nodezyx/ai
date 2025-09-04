const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

// Optimized axios instance
const axiosInstance = axios.create({
    timeout: 15000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

// Pinterest API configuration
const PINTEREST_API_URL = 'https://supun-md-api-xmjh.vercel.app/api/pinterest-search';

// Utility function to fetch images from Pinterest
async function fetchPinterestImages(query, limit = 10) {
    try {
        const apiUrl = `${PINTEREST_API_URL}?q=${encodeURIComponent(query)}`;
        const response = await axiosInstance.get(apiUrl);
        
        if (!response.data?.success || !response.data?.results?.data?.length) {
            throw new Error('No images found or invalid API response');
        }
        
        const images = response.data.results.data;
        return images.slice(0, limit); // Return limited number of images
    } catch (error) {
        console.error('Pinterest API Error:', error);
        throw new Error('Failed to fetch images from Pinterest');
    }
}

// Utility function to download image
async function downloadImage(url) {
    try {
        const response = await axiosInstance.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Image Download Error:', error);
        throw new Error('Failed to download image');
    }
}

// Utility function to send image with caption
async function sendImage(conn, chat, imageBuffer, caption, quoted) {
    await conn.sendMessage(chat, {
        image: imageBuffer,
        caption: caption,
        contextInfo: {
            externalAdReply: {
                title: 'Pinterest Image Search',
                body: 'Powered by Supun API',
                thumbnail: imageBuffer,
                mediaType: 1,
                sourceUrl: 'https://pinterest.com'
            }
        }
    }, { quoted });
}

// Main img command
cmd({
    pattern: 'img',
    alias: ['image', 'pinterest', 'pin'],
    desc: 'Search and download images from Pinterest',
    category: 'search',
    react: '🖼️',
    use: '<search query>',
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('🖼️ *Pinterest Image Search*\n\n' +
                        'Search and download high-quality images from Pinterest\n\n' +
                        '*Usage:* .img <search query>\n' +
                        'Examples:\n' +
                        `• ${Config.PREFIX}img nature wallpaper\n` +
                        `• ${Config.PREFIX}img anime art\n` +
                        `• ${Config.PREFIX}img car photos`);
        }

        // Send processing reaction
        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        // Fetch images from Pinterest
        const images = await fetchPinterestImages(text, 10);
        
        if (images.length === 0) {
            await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
            return reply('❌ No images found for your search query. Try a different keyword.');
        }

        // Check if button interface should be used
        const useButtons = Config.BUTTON === true || Config.BUTTON === "true";

        if (useButtons) {
            // Button-based interface
            const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Prepare caption
            const caption = `🖼️ *Pinterest Image Search*\n\n` +
                          `🔍 *Search Query:* "${text}"\n` +
                          `📊 *Found:* ${images.length} images\n\n` +
                          `💡 *Select an image to download:*\n\n` +
                          `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;

            // Create buttons for image selection
            const buttons = [];
            const maxButtons = Math.min(images.length, 5); // Show up to 5 buttons

            for (let i = 0; i < maxButtons; i++) {
                buttons.push({
                    buttonId: `img-select-${sessionId}-${i}`,
                    buttonText: { displayText: `🖼️ Image ${i + 1}` },
                    type: 1
                });
            }

            // Add "More Images" button if there are more than 5
            if (images.length > 5) {
                buttons.push({
                    buttonId: `img-more-${sessionId}`,
                    buttonText: { displayText: '📖 More Images' },
                    type: 1
                });
            }

            // Get first image for preview
            const previewImageBuffer = await downloadImage(images[0]);

            // Create buttons message
            const buttonsMessage = {
                image: previewImageBuffer,
                caption: caption,
                footer: Config.FOOTER || 'Select an image to download • Mr Frank',
                buttons: buttons,
                headerType: 1,
                contextInfo: {
                    externalAdReply: {
                        title: `Search: ${text}`,
                        body: `Found ${images.length} images on Pinterest`,
                        thumbnail: previewImageBuffer,
                        mediaType: 1,
                        mediaUrl: 'https://pinterest.com',
                        sourceUrl: 'https://pinterest.com'
                    }
                }
            };

            // Send message with buttons
            const finalMsg = await conn.sendMessage(mek.chat, buttonsMessage, { quoted: mek });
            const messageId = finalMsg.key.id;

            // Store session data
            const sessionData = {
                images,
                query: text,
                timestamp: Date.now()
            };

            // Button handler
            const buttonHandler = async (msgData) => {
                try {
                    const receivedMsg = msgData.messages[0];
                    if (!receivedMsg.message?.buttonsResponseMessage) return;

                    const buttonId = receivedMsg.message.buttonsResponseMessage.selectedButtonId;
                    const senderId = receivedMsg.key.remoteJid;
                    const isReplyToBot = receivedMsg.message.buttonsResponseMessage.contextInfo?.stanzaId === messageId;

                    if (isReplyToBot && senderId === mek.chat && buttonId.includes(sessionId)) {
                        // Remove listener to prevent multiple triggers
                        conn.ev.off('messages.upsert', buttonHandler);

                        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: receivedMsg.key } });

                        try {
                            if (buttonId.startsWith(`img-select-${sessionId}`)) {
                                // Image selection
                                const imageIndex = parseInt(buttonId.split('-').pop());
                                if (imageIndex >= 0 && imageIndex < sessionData.images.length) {
                                    const imageUrl = sessionData.images[imageIndex];
                                    
                                    await reply(`📥 Downloading image ${imageIndex + 1}...`);
                                    
                                    const imageBuffer = await downloadImage(imageUrl);
                                    
                                    const imageCaption = `🖼️ *Pinterest Image*\n\n` +
                                                       `🔍 *Search:* "${sessionData.query}"\n` +
                                                       `📷 *Image:* ${imageIndex + 1}/${sessionData.images.length}\n\n` +
                                                       `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;
                                    
                                    await sendImage(conn, mek.chat, imageBuffer, imageCaption, receivedMsg);
                                    await conn.sendMessage(mek.chat, { react: { text: '✅', key: receivedMsg.key } });
                                }
                            } else if (buttonId.startsWith(`img-more-${sessionId}`)) {
                                // Show more images
                                await reply(`📖 Showing all ${sessionData.images.length} images...\n\n` +
                                           `*Available Images:*\n` +
                                           sessionData.images.map((img, index) => 
                                               `${index + 1}. Image ${index + 1}`
                                           ).join('\n') +
                                           `\n\n💡 *Reply with the image number to download*`);
                            }
                        } catch (error) {
                            console.error('Image Download Error:', error);
                            await conn.sendMessage(mek.chat, { react: { text: '❌', key: receivedMsg.key } });
                            reply(`❌ Error: ${error.message || 'Failed to download image'}`);
                        }
                    }
                } catch (error) {
                    console.error('Button handler error:', error);
                }
            };

            // Add listener
            conn.ev.on('messages.upsert', buttonHandler);

            // Remove listener after 3 minutes
            setTimeout(() => {
                conn.ev.off('messages.upsert', buttonHandler);
            }, 180000);

        } else {
            // Text-based interface
            const caption = `🖼️ *Pinterest Image Search Results*\n\n` +
                          `🔍 *Search Query:* "${text}"\n` +
                          `📊 *Found:* ${images.length} images\n\n` +
                          `*Available Images:*\n` +
                          images.map((img, index) => 
                              `${index + 1}. Image ${index + 1}`
                          ).join('\n') +
                          `\n\n💡 *Reply with the image number to download*\n\n` +
                          `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;

            // Send results message
            const sentMsg = await conn.sendMessage(mek.chat, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: `Search: ${text}`,
                        body: `Found ${images.length} images on Pinterest`,
                        mediaType: 1,
                        sourceUrl: 'https://pinterest.com'
                    }
                }
            }, { quoted: mek });

            // Response listener for text interface
            const messageListener = async (messageUpdate) => {
                try {
                    const mekInfo = messageUpdate?.messages[0];
                    if (!mekInfo?.message) return;

                    const message = mekInfo.message;
                    const messageText = message.conversation || message.extendedTextMessage?.text;
                    const isReplyToSentMsg = message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
                    const imageNumber = parseInt(messageText);
                    const isValidNumber = !isNaN(imageNumber) && imageNumber >= 1 && imageNumber <= images.length;

                    if (!isReplyToSentMsg || !isValidNumber) return;

                    // Remove listener
                    conn.ev.off('messages.upsert', messageListener);

                    await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mekInfo.key } });

                    const imageIndex = imageNumber - 1;
                    const imageUrl = images[imageIndex];
                    
                    await reply(`📥 Downloading image ${imageNumber}...`);
                    
                    const imageBuffer = await downloadImage(imageUrl);
                    
                    const imageCaption = `🖼️ *Pinterest Image*\n\n` +
                                       `🔍 *Search:* "${text}"\n` +
                                       `📷 *Image:* ${imageNumber}/${images.length}\n\n` +
                                       `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;
                    
                    await sendImage(conn, mek.chat, imageBuffer, imageCaption, mekInfo);
                    await conn.sendMessage(mek.chat, { react: { text: '✅', key: mekInfo.key } });

                } catch (error) {
                    console.error('Image Download Error:', error);
                    await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
                    reply(`❌ Error: ${error.message || 'Failed to download image'}`);
                }
            };

            // Add listener
            conn.ev.on('messages.upsert', messageListener);

            // Remove listener after 3 minutes
            setTimeout(() => {
                conn.ev.off('messages.upsert', messageListener);
            }, 180000);
        }

    } catch (error) {
        console.error('Img Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error: ${error.message || 'Failed to search images'}`);
    }
});

// Pingimg command - quick image search without buttons
cmd({
    pattern: 'pingimg',
    alias: ['pimg', 'quickimg'],
    desc: 'Quick image search from Pinterest (sends first result)',
    category: 'search',
    react: '⚡',
    use: '<search query>',
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            await conn.sendMessage(mek.chat, { react: { text: '⚠️', key: mek.key } });
            return reply('⚡ *Quick Image Search*\n\n' +
                        'Quickly search and download the first image from Pinterest\n\n' +
                        '*Usage:* .pingimg <search query>\n' +
                        'Example: .pingimg cat pictures');
        }

        // Send processing reaction
        await conn.sendMessage(mek.chat, { react: { text: '⏳', key: mek.key } });

        // Fetch images from Pinterest (only first result)
        const images = await fetchPinterestImages(text, 1);
        
        if (images.length === 0) {
            await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
            return reply('❌ No images found for your search query. Try a different keyword.');
        }

        // Download and send the first image
        const imageUrl = images[0];
        await reply(`📥 Downloading image...`);
        
        const imageBuffer = await downloadImage(imageUrl);
        
        const caption = `⚡ *Quick Pinterest Image*\n\n` +
                       `🔍 *Search:* "${text}"\n\n` +
                       `> © 𝘾𝙧𝙚𝙖𝙩𝙚𝙙  𝘽𝙮 𝙈𝙧 𝙁𝙧𝙖𝙣𝙠 𝙊𝙁𝘾 ッ`;
        
        await sendImage(conn, mek.chat, imageBuffer, caption, mek);
        await conn.sendMessage(mek.chat, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('Pingimg Command Error:', error);
        await conn.sendMessage(mek.chat, { react: { text: '❌', key: mek.key } });
        reply(`❌ Error: ${error.message || 'Failed to search image'}`);
    }
});
