const { cmd } = require('../command')

cmd({
  pattern: "testbtn",
  alias: ["btn", "buttonsample"],
  desc: "Sample command with buttons",
  category: "test",
  react: "🎛️",
  filename: __filename
}, async (sock, mek, m, { reply }) => {
  try {
    await sock.sendMessage(mek.chat, {
      text: "Hello World! 🚀",
      footer: "© Baileys Pro 2025",
      buttons: [
        {
          buttonId: '.tes',
          buttonText: { displayText: 'TESTING BOT' },
          type: 1,
        },
        {
          buttonId: '.private',
          buttonText: { displayText: 'PRIVATE SCRIPT' },
          type: 1,
        },
        {
          buttonId: 'action',
          buttonText: { displayText: 'Interactive Menu' },
          type: 4,
          nativeFlowInfo: {
            name: 'single_select',
            paramsJson: JSON.stringify({
              title: 'Sample Menu',
              sections: [
                {
                  title: 'Baileys - 2025',
                  highlight_label: '😜',
                  rows: [
                    {
                      header: 'HEADER 1',
                      title: 'TITLE 1',
                      description: 'DESCRIPTION 1',
                      id: 'row1_id',
                    },
                    {
                      header: 'HEADER 2',
                      title: 'TITLE 2',
                      description: 'DESCRIPTION 2',
                      id: 'row2_id',
                    },
                  ],
                },
              ],
            }),
          },
        },
      ],
      headerType: 1,
      viewOnce: true
    }, { quoted: mek })
  } catch (e) {
    console.error("Button test error:", e)
    reply("❌ Failed to send buttons")
  }
})
