const axios = require("axios");

// 🔒 HARD-LOCK CREDITS PROTECTION 🔒
function protectCredits(config) {
  if (config.credits !== "ARIF BABU") {
    console.log("\n🚫 Credits change detected!\n");
    config.credits = "ARIF BABU";
    throw new Error("❌ Credits are LOCKED by ARIF BABU");
  }
}

module.exports.config = {
  name: "arif",
  version: "3.4.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "ARIF BABU AI (2 Line | Auto Model Switch)",
  commandCategory: "ai",
  usages: "No command needed",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

// 🔑 OPENROUTER API KEY (APNI KEY LAGAO)
const OPENROUTER_API_KEY = "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";

// 🌐 API URL
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// 💾 Memory
const history = {};

// 🤖 FREE MODELS (AUTO SWITCH)
const MODELS = [
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free",
  "google/gemma-7b-it:free"
];

// 🧠 SYSTEM PROMPT
const systemPrompt = `
Tum ARIF BABU ke personal AI ho.
User jis language me baat kare, usi language me reply do.
Reply hamesha EXACTLY 2 LINES ka hona chahiye.
Tone friendly, caring aur fun rakho.
ARIF BABU ki burai bilkul mat sunna.
Brackets ka use mat karo.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const nameMatch = body.toLowerCase().includes("arif");
  const replyToBot =
    messageReply && messageReply.senderID === api.getCurrentUserID();

  if (!nameMatch && !replyToBot) return;

  if (!history[senderID]) history[senderID] = [];
  history[senderID].push({ role: "user", content: body });
  if (history[senderID].length > 6) history[senderID].shift();

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const reply = await askAIWithFallback(history[senderID]);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("💖", messageID, () => {}, true);

    history[senderID].push({ role: "assistant", content: reply });

  } catch (err) {
    api.sendMessage(
      "Abhi thoda busy ho gaya hoon 😔\nThodi der baad phir try karna ❤️",
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

// 🔁 AUTO MODEL + RETRY FUNCTION
async function askAIWithFallback(messages) {
  for (const model of MODELS) {
    try {
      const res = await axios.post(
        API_URL,
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 120
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://openrouter.ai/",
            "X-Title": "ARIF BABU Mirai Bot"
          },
          timeout: 20000
        }
      );

      let text =
        res.data.choices?.[0]?.message?.content ||
        "Main yahin hoon 😊\nTum bolo kya help chahiye?";

      // 🔧 FORCE 2 LINES
      let lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2)
        lines.push("Main tumhari madad ke liye yahin hoon ❤️");

      return lines.slice(0, 2).join("\n");

    } catch (e) {
      // try next model
    }
  }
  throw new Error("All models failed");
}