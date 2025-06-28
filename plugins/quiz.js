const questions = [
  { question: "What is the capital of Nigeria?", answer: "Abuja" },
  { question: "What is 2 + 2?", answer: "4" },
  { question: "Which planet is known as the Red Planet?", answer: "Mars" },
  { question: "Who sang 'Essence'?", answer: "Wizkid" },
];

let quizState = {
  players: [],      // array of JIDs
  active: false,
  current: 0,
  question: null,
};

function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}

module.exports = {
  pattern: "quiz ?(.*)",
  fromMe: false,
  desc: "Quiz elimination game",
  type: "game",

  async run(message, match) {
    const chatId = message.jid;           // the group or chat
    const text = (match || "").trim().toLowerCase();
    const args = text.split(/\s+/).filter(Boolean);
    const cmd = args[0];
    const senderJid = message.sender;     // who sent the command
    const senderName = message.pushName;  

    // helper to send into the chat
    const send = async (txt, mentions = []) =>
      await message.sendMessage(chatId, { text: txt, mentions });

    switch (cmd) {
      case "start":
        if (quizState.active) return send("⚠️ A quiz is already running.");
        quizState = { players: [], active: true, current: 0, question: null };
        return send(
          "🎉 *Quiz started!*\nPlayers, type `.quiz join` to enter.\n" +
          "When ready, type `.quiz begin`."
        );

      case "join":
        if (!quizState.active) return send("❗ No quiz is active right now.");
        if (quizState.players.includes(senderJid))
          return send("You’ve already joined.");
        quizState.players.push(senderJid);
        return send(`✅ @${senderName} joined.`, [senderJid]);

      case "begin":
        if (!quizState.active) return send("❗ No quiz is active.");
        if (quizState.players.length < 2)
          return send("Need at least 2 players to begin.");
        quizState.current = 0;
        quizState.question = getRandomQuestion();
        const firstPlayer = quizState.players[0];
        return send(
          `🧠 Question for @${firstPlayer.split("@")[0]}:\n` +
          `${quizState.question.question}\n` +
          "Answer with `.quiz ans <your answer>`",
          [firstPlayer]
        );

      case "ans":
        if (!quizState.active) return;
        // only the current player can answer
        if (senderJid !== quizState.players[quizState.current]) return;

        const answerText = args.slice(1).join(" ").trim().toLowerCase();
        const correct = quizState.question.answer.toLowerCase();
        const playerTag = quizState.players[quizState.current];

        if (answerText === correct) {
          await send(`✅ Correct, @${senderName}!`, [senderJid]);
          quizState.current = (quizState.current + 1) % quizState.players.length;
        } else {
          await send(`❌ Wrong, @${senderName}! You’re eliminated.`, [senderJid]);
          quizState.players = quizState.players.filter(p => p !== senderJid);
          if (quizState.current >= quizState.players.length) quizState.current = 0;
        }

        // check for winner
        if (quizState.players.length === 1) {
          return send(
            `🏆 Congratulations, @${quizState.players[0].split("@")[0]}—you win!`,
            [quizState.players[0]]
          );
        }

        // next question
        quizState.question = getRandomQuestion();
        const nextPlayer = quizState.players[quizState.current];
        return send(
          `🧠 Question for @${nextPlayer.split("@")[0]}:\n` +
          `${quizState.question.question}\n` +
          "Answer with `.quiz ans <your answer>`",
          [nextPlayer]
        );

      default:
        return send(
          "🧠 *Quiz Commands:*\n" +
            ".quiz start — Start a new quiz\n" +
            ".quiz join  — Join the ongoing quiz\n" +
            ".quiz begin — Ask first question\n" +
            ".quiz ans <answer> — Answer current question"
        );
    }
  },
};
