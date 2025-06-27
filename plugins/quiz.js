// ✅ Step-by-step setup for integrating a smart WhatsApp bot with:
// 1. Multiplayer Quiz Feature (.quiz, .join, etc.)
// 2. Smart AI Chat using OpenRouter

// === STEP 1: Basic Setup Instructions ===
// 1. Unzip `levanter-master.zip` and install the dependencies
//    - Open terminal in the project directory
//    - Run: npm install

// 2. Rename `config.env.example` to `config.env` and update it with:
//    - Your OpenRouter API key
//    - Your bot name (e.g., berry bot)
//    - Your preferred model (e.g., meta-llama/llama-3-8b-instruct)
//      Example:
//      OPENROUTER_API_KEY=your_openrouter_key_here
//      OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct

// === STEP 2: Add Plugin Files ===
// Inside the `plugins/` directory, create two new files:
//   1. plugins/quiz.js  (Multiplayer quiz game)
//   2. plugins/ai.js    (Berry bot AI chat)

// === FILE: plugins/quiz.js ===
const { bot } = require('../lib');
const quizQuestions = [
  { question: "Capital of France?", answer: "paris" },
  { question: "5 + 7 = ?", answer: "12" },
  { question: "Color of the sun?", answer: "yellow" },
];

const games = new Map();

bot({ pattern: 'quiz', type: 'game', desc: 'Start a quiz game' }, async (msg) => {
  if (games.has(msg.jid)) return msg.reply('⚠ A game is already running. Type `.join` to participate.');

  const game = {
    players: new Map([[msg.sender, { name: msg.pushName || 'Player', score: 0 }]]),
    started: false,
    turnOrder: [msg.sender],
    currentTurn: 0,
    question: null
  };

  games.set(msg.jid, game);
  msg.reply(`🎮 Quiz starting in 60 seconds. Type .join to enter!`);

  setTimeout(() => beginGame(msg.jid, msg), 60000);
});

bot({ pattern: 'join', type: 'game', desc: 'Join the quiz' }, async (msg) => {
  const game = games.get(msg.jid);
  if (!game || game.started) return msg.reply('❌ No active quiz or already started.');
  if (game.players.has(msg.sender)) return msg.reply('⚠ Already joined!');

  game.players.set(msg.sender, { name: msg.pushName || 'Player', score: 0 });
  game.turnOrder.push(msg.sender);
  msg.reply(`✅ ${msg.pushName || 'Player'} joined! Total: ${game.players.size}`);
});

async function beginGame(jid, msg) {
  const game = games.get(jid);
  if (!game || game.started || game.players.size < 2) {
    games.delete(jid);
    return msg.reply('🚫 Not enough players. Game cancelled.');
  }
  game.started = true;
  askQuestion(jid, msg);
}

async function askQuestion(jid, msg) {
  const game = games.get(jid);
  if (!game) return;
  const playerId = game.turnOrder[game.currentTurn];
  const player = game.players.get(playerId);
  const q = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  game.question = q;

  msg.reply(`🎯 It's ${player.name}'s turn!
❓ ${q.question}
⏱ 30 seconds to answer...`);

  setTimeout(() => {
    const updated = games.get(jid);
    if (updated && updated.turnOrder[updated.currentTurn] === playerId) {
      msg.reply(`⏰ Time's up! ${player.name} eliminated.`);
      updated.players.delete(playerId);
      updated.turnOrder = updated.turnOrder.filter(p => p !== playerId);
      if (updated.turnOrder.length <= 1) return endGame(jid, msg);
      if (updated.currentTurn >= updated.turnOrder.length) updated.currentTurn = 0;
      askQuestion(jid, msg);
    }
  }, 30000);
}

bot({ on: 'text' }, async (msg) => {
  const game = games.get(msg.jid);
  if (!game || !game.started || game.turnOrder[game.currentTurn] !== msg.sender) return;
  if (msg.body.toLowerCase() === game.question.answer.toLowerCase()) {
    game.players.get(msg.sender).score++;
    msg.reply(`✅ Correct! Score: ${game.players.get(msg.sender).score}`);
    game.currentTurn = (game.currentTurn + 1) % game.turnOrder.length;
    askQuestion(msg.jid, msg);
  } else {
    msg.reply(`❌ Wrong! Eliminated.`);
    game.players.delete(msg.sender);
    game.turnOrder = game.turnOrder.filter(p => p !== msg.sender);
    if (game.turnOrder.length <= 1) return endGame(msg.jid, msg);
    if (game.currentTurn >= game.turnOrder.length) game.currentTurn = 0;
    askQuestion(msg.jid, msg);
  }
});

async function endGame(jid, msg) {
  const game = games.get(jid);
  const winner = game.players.get(game.turnOrder[0]);
  msg.reply(`🏆 Winner: ${winner.name} with ${winner.score} point(s)!`);
  games.delete(jid);
}