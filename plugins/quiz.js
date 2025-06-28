const questions = [
  { question: "What is the capital of Nigeria?", answer: "Abuja" },
  { question: "What is 2 + 2?", answer: "4" },
  { question: "Which planet is known as the Red Planet?", answer: "Mars" },
  { question: "Who sang 'Essence'?", answer: "Wizkid" },
  // Add more questions as needed
];

let quizState = {
  players: [],
  active: false,
  current: 0,
  question: null,
};

function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}

module.exports = {
  pattern: "quiz ?(.*)",
  fromMe: false, // Respond to user messages
  desc: "Quiz elimination game",
  type: "game",

  async run(message, match) {
    const input = (match || "").trim().toLowerCase();
    const args = input.split(/\s+/).filter(Boolean);
    const cmd = args[0];
    const sender = message.sender;
    const send = async (text) => {
      return await message.sendMessage(message.jid, { text });
    };

    switch (cmd) {
      case "start":
        if (quizState.active) return await send("⚠️ A quiz is already running.");
        quizState = { players: [], active: true, current: 0, question: null };
        return await send(
          "🎉 Quiz started! Players, type `.quiz join` to enter. Admin, type `.quiz begin` to start."
        );

      case "join":
        if (!quizState.active) return await send("❗ No quiz is active.");
        if (quizState.players.includes(sender)) return await send("You're already joined.");
        quizState.players.push(sender);
        return await send(`✅ ${message.pushName} joined the quiz.`);

      case "begin":
        if (!quizState.active) return await send("❗ No quiz is active.");
        if (quizState.players.length < 2) return await send("Need at least 2 players.");
        quizState.current = 0;
        quizState.question = getRandomQuestion();
        const currentPlayer = quizState.players[quizState.current];
        return await message.sendMessage(currentPlayer, {
          text: `🧠 *Your Question:*
${quizState.question.question}
Reply with \`.quiz ans <your answer>\``
        });

      case "ans":
        if (!quizState.active) return;
        if (sender !== quizState.players[quizState.current]) return;
        const answer = args.slice(1).join(" ").trim().toLowerCase();
        const correct = quizState.question.answer.toLowerCase();

        if (answer === correct) {
          await send("✅ Correct!");
          quizState.current = (quizState.current + 1) % quizState.players.length;
        } else {
          await send("❌ Wrong! You're out.");
          quizState.players = quizState.players.filter((p) => p !== sender);
          if (quizState.current >= quizState.players.length) quizState.current = 0;
        }

        if (quizState.players.length === 1) {
          await send(`🏆 ${quizState.players[0]} wins the quiz!`);
          quizState.active = false;
          return;
        }

        quizState.question = getRandomQuestion();
        const nextPlayer = quizState.players[quizState.current];
        return await message.sendMessage(nextPlayer, {
          text: `🧠 *Next Question:*
${quizState.question.question}
Reply with \`.quiz ans <your answer>\``
        });

      default:
        return await send(
          "🧠 *Quiz Commands:*\n" +
            ".quiz start - Start quiz\n" +
            ".quiz join - Join game\n" +
            ".quiz begin - Begin rounds\n" +
            ".quiz ans <answer> - Answer question"
        );
    }
  },
};
