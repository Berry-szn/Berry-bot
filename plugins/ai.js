// === FILE: plugins/ai.js ===
const axios = require('axios');
const BOT_NAME = 'berry bot';

bot({ on: 'text' }, async (msg) => {
  const lower = msg.body.toLowerCase();
  if (!lower.includes(BOT_NAME)) return;

  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: `You are ${BOT_NAME}, a friendly bot.` },
          { role: 'user', content: msg.body }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    msg.reply(res.data.choices[0].message.content);
  } catch (err) {
    console.error('AI error:', err);
    msg.reply('🤖 AI error. Please try again later.');
  }
});

// === Step 3: Start the Bot ===
// Run in terminal:
//    npm start  (or whatever script is defined in package.json)

// Let me know if you'd like leaderboard tracking, multiple topics, or timed rounds next.
