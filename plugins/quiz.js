const questions = [
  { question: "What is the capital of Nigeria?", answer: "Abuja" },
  { question: "What is 2 + 2?", answer: "4" },
  { question: "Which planet is known as the Red Planet?", answer: "Mars" },
  { question: "Who sang 'Essence'?", answer: "Wizkid" },
  // Add more Q&A pairs as desired
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
  fromMe: false,           // allow any user to run
  desc: "Quiz elimination game",
  type: "game",

  async run(message, match) {
    const input = (match || "").trim().toLowerCase();
    const args = input.split(/\s+/).filter(Boolean);
    const cmd = args[0];
    const user = message.sender;

    // shorthand for sending a text reply
    const send = (txt) => message.sendMessage(message.jid, { text: txt });

    switch (cmd) {
      case "start":
        if (quizState.active) return send("⚠️ A quiz is already running.");
        quizState = { players: [], active: true, current: 0, question: null };
        return send(
          "🎉 *Quiz started!*\nPlayers: `.quiz join`\nAdmin: `.quiz begin`"
        );

      case "join":
        if (!quizState.active) return send("❗ No quiz is active.");
        if (quizState.players.includes(user)) return send("You already joined.");
        quizState.players.push(user);
        return send(`✅ ${message.pushName} joined the quiz.`);

      case "begin":
        if (!quizState.active) return send("❗ No quiz is active.");
        if (quizState.players.length < 2) return send("Need at least 2 players.");
        quizState.current = 0;
        quizState.question = getRandomQuestion();
        const current = quizState.players[quizState.current];
        return message.sendMessage(current, {
          text: `🧠 *Your Question:*\n${quizState.question.question}\nReply with: \`.quiz ans <your answer>\``
        });

      case "ans":
        if (!quizState.active) return;
        if (user !== quizState.players[quizState.current]) return;
        const response = args.slice(1).join(" ").trim().toLowerCase();
        const correct = quizState.question.answer.toLowerCase();

        if (response === correct) {
          await send("✅ Correct!");
          quizState.current = (quizState.current + 1) % quizState.players.length;
        } else {
          await send("❌ Wrong! You’re out.");
          quizState.players = quizState.players.filter(p => p !== user);
          if (quizState.current >= quizState.players.length) quizState.current = 0;
        }

        if (quizState.players.length === 1) {
          return send(`🏆 ${quizState.players[0]} wins the quiz!`);
        }

        quizState.question = getRandomQuestion();
        const next = quizState.players[quizState.current];
        return message.sendMessage(next, {
          text: `🧠 *Next Question:*\n${quizState.question.question}\nReply with: \`.quiz ans <your answer>\``
        });

      default:
        return send(
          "🧠 *Quiz Commands:*\n" +
            ".quiz start — Start quiz\n" +
            ".quiz join  — Join the game\n" +
            ".quiz begin — Ask first question\n" +
            ".quiz ans <answer> — Answer current question"
        );
    }
  },
};
