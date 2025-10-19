const { cmd } = require('../command');
const axios = require('axios');
const Config = require('../config');

cmd(
    {
        pattern: 'imdb',
        alias: ['movie'],
        desc: 'Get movie information from IMDb',
        category: 'information',
        react: '🎬',
        use: '<movie name>',
        filename: __filename,
    },
    async (conn, mek, m, { text, reply }) => {
        try {
            if (!text) return reply('🎬 *Please provide a movie name*\nExample: .imdb Sonic the Hedgehog\n.imdb The Dark Knight');

            // Send processing reaction
            await conn.sendMessage(mek.chat, { react: { text: "⏳", key: mek.key } });

            // Call IMDb API
            const apiUrl = `https://apis.davidcyriltech.my.id/imdb?query=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, { timeout: 10000 });
            
            if (!response.data?.status || !response.data.movie) {
                return reply('🎬 *Movie not found* - Please check the name and try again');
            }

            const movie = response.data.movie;

            // Format ratings
            const ratings = movie.ratings.map(r => `• *${r.source}:* ${r.value}`).join('\n');

            // Create the message
            const message = `
🎥 *${movie.title}* (${movie.year})

📊 *Ratings:*
${ratings}

📅 *Released:* ${new Date(movie.released).toLocaleDateString()}
⏱ *Runtime:* ${movie.runtime}
🎭 *Genres:* ${movie.genres}
🎬 *Director:* ${movie.director}
✍️ *Writers:* ${movie.writer}
🌟 *Stars:* ${movie.actors}

📝 *Plot:*
${movie.plot}

🌎 *Country:* ${movie.country}
🗣️ *Languages:* ${movie.languages}
🏆 *Awards:* ${movie.awards}
💰 *Box Office:* ${movie.boxoffice}

🔗 *IMDb Link:* ${movie.imdbUrl}
            `;

            // Get poster image
            let posterBuffer;
            try {
                const posterResponse = await axios.get(movie.poster, { 
                    responseType: 'arraybuffer',
                    timeout: 5000
                });
                posterBuffer = Buffer.from(posterResponse.data, 'binary');
            } catch {
                posterBuffer = null;
            }

            // Send the movie info with poster
            await conn.sendMessage(mek.chat, {
                image: posterBuffer,
                caption: message,
                contextInfo: {
                    externalAdReply: {
                        title: movie.title,
                        body: `IMDb Rating: ${movie.imdbRating}/10`,
                        thumbnail: posterBuffer,
                        mediaType: 1,
                        mediaUrl: movie.imdbUrl,
                        sourceUrl: movie.imdbUrl
                    }
                }
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(mek.chat, { react: { text: "✅", key: mek.key } });

        } catch (error) {
            console.error('IMDb error:', error);
            await conn.sendMessage(mek.chat, { react: { text: "❌", key: mek.key } });
            reply('🎬 *Error fetching movie info* - Please try again later');
        }
    }
);
