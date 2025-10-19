const { cmd } = require('../command')
const axios = require('axios')

cmd({
  pattern: "picjumbo",
  desc: "📸 Search and download free images from Picjumbo.",
  category: "search",
  use: "<query> [--page <number>]",
  filename: __filename
}, async (conn, m, { q, args }) => {
  if (!q) return m.reply("❌ Provide a search term.\nExample: `.picjumbo dog --page 2`")

  let page = 1
  const pageIndex = args.indexOf("--page")
  if (pageIndex !== -1 && args[pageIndex + 1]) {
    page = parseInt(args[pageIndex + 1]) || 1
  }

  try {
    const { data } = await axios.get(`https://kaiz-apis.gleeze.com/api/picjumbo?search=${encodeURIComponent(q)}&page=${page}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`)

    if (!data.images || data.images.length === 0) return m.reply("❌ No images found.")

    const imgs = data.images.slice(0, 10) // Limit to 10

    for (const url of imgs) {
      await conn.sendMessage(m.chat, {
        image: { url },
        caption: `🔍 *Search:* ${q}\n📄 *Page:* ${page}`
      }, { quoted: m })
    }

    // ✅ React
    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (err) {
    console.error(err)
    m.reply("❌ Error fetching Picjumbo images.")
  }
})
