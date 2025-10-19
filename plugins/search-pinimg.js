const { cmd } = require('../command')
const axios = require('axios')

cmd({
  pattern: "pinimg",
  desc: "🔎 Download 5 Pinterest images based on a search term",
  category: "search",
  use: "<query>",
  filename: __filename
}, async (conn, m, { q }) => {
  if (!q) return m.reply("❌ Please provide a search term.\nExample: `.pinterest dog`")

  try {
    const { data } = await axios.get(`https://kaiz-apis.gleeze.com/api/pinterest?search=${encodeURIComponent(q)}&apikey=cf2ca612-296f-45ba-abbc-473f18f991eb`)

    if (!data.data || data.data.length === 0) return m.reply("❌ No results found.")

    const images = data.data.slice(0, 5) // send only 5

    for (const url of images) {
      await conn.sendMessage(m.chat, {
        image: { url },
        caption: `🔍 *Search:* ${q}`
      }, { quoted: m })
    }

    // ✅ React
    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (err) {
    console.error(err)
    m.reply("❌ Failed to fetch images from Pinterest API.")
  }
})
