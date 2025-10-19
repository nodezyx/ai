const axios = require("axios");
const cheerio = require("cheerio");
const { cmd } = require("../command"); // Adjust the path if needed

// 🔍 ZOOM.LK SEARCH
cmd({
  pattern: "zoom",
  desc: "Search content on zoom.lk",
  category: "download",
  react: "🔍",
  filename: __filename
}, async (bot, message, utils, { from, args, reply }) => {
  try {
    if (!args[0]) return reply("⚠️ *Please provide a search term!*");

    const searchTerm = args.join(" ");
    const searchUrl = `https://zoom.lk/?s=${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    const results = [];

    $("div.td_module_wrap").each((_, el) => {
      const title = $(el).find("h3.entry-title > a").text().trim();
      const link = $(el).find("h3.entry-title > a").attr("href");
      const image = $(el).find("div.td-module-thumb img").attr("src");
      const author = $(el).find(".td-post-author-name").text().trim();
      const time = $(el).find("time").text().trim();
      const desc = $(el).find(".td-excerpt").text().trim();
      const comments = $(el).find(".td-module-comments a").text().trim();

      if (title && link) {
        results.push({ title, link, image, author, time, desc, comments });
      }
    });

    if (!results.length) return reply("📭 *No results found!*");

    let messageText = "📰 *ZOOM.LK SEARCH RESULTS*\n\n";
    results.slice(0, 5).forEach((res, i) => {
      messageText += `*${i + 1}. ${res.title}*\n`;
      if (res.time) messageText += `🕓 ${res.time}\n`;
      if (res.author) messageText += `👤 ${res.author}\n`;
      if (res.desc) messageText += `💬 ${res.desc}\n`;
      messageText += `🔗 ${res.link}\n\n`;
    });

    messageText += "_Forwarded by SUBZERO MD_";
    await reply(messageText);
  } catch (error) {
    console.error("Zoom Error:", error);
    reply("❌ An error occurred while searching Zoom.lk.");
  }
});

// 🎬 CINESUBZ SEARCH
cmd({
  pattern: "cinesubz",
  desc: "Search on Cinesubz",
  category: "movie",
  react: "🎬",
  filename: __filename
}, async (bot, message, utils, { from, args, reply }) => {
  try {
    if (!args[0]) return reply("⚠️ *Please provide a search term!*");

    const searchTerm = args.join(" ");
    const searchUrl = `https://cinesubz.co/?s=${encodeURIComponent(searchTerm)}`;
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    const results = [];

    $(".result-item").each((_, el) => {
      const title = $(el).find(".title a").text().trim();
      const link = $(el).find(".title a").attr("href");
      const image = $(el).find(".thumbnail img").attr("src");
      const type = $(el).find(".thumbnail span").first().text().trim();
      const rating = $(el).find(".meta .rating").text().trim();
      const year = $(el).find(".meta .year").text().trim();
      const description = $(el).find(".contenido p").text().trim();

      if (title && link) {
        results.push({ title, link, image, type, rating, year, description });
      }
    });

    if (!results.length) return reply("📭 *No results found!*");

    let messageText = "🎞️ *CINESUBZ SEARCH RESULTS*\n\n";
    results.slice(0, 5).forEach((res, i) => {
      messageText += `*${i + 1}. ${res.title}*\n`;
      if (res.type) messageText += `📺 Type: ${res.type}\n`;
      if (res.rating) messageText += `⭐ Rating: ${res.rating}\n`;
      if (res.year) messageText += `📅 Year: ${res.year}\n`;
      messageText += `🔗 ${res.link}\n\n`;
    });

    messageText += "_Forwarded by SUBZERO MD_";
    await reply(messageText);
  } catch (error) {
    console.error("Cinesubz Error:", error);
    reply("❌ An error occurred while searching Cinesubz.");
  }
});
