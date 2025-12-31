const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 🔒 CREDIT PROTECTION
function protectCredits(config) {
  if (config.credits !== "ARIF BABU") {
    config.credits = "ARIF BABU";
    throw new Error("Credits are locked by ARIF BABU");
  }
}

module.exports.config = {
  name: "arif",
  version: "4.1.0",
  hasPermssion: 0,
  credits: "ARIF BABU",
  description: "ARIF BABU AI",
  commandCategory: "ai",
  usages: "bot | bot text | reply",
  cooldowns: 2,
  dependencies: { axios: "" }
};

protectCredits(module.exports.config);

// 🔑 OPENROUTER API KEY (APNI REAL KEY LAGAO)
const OPENROUTER_API_KEY = "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";

// 🌐 API URL
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// 📁 PATHS
const DATA_DIR = path.join(__dirname, "ARIF-BABU");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const HISTORY_FILE = path.join(DATA_DIR, "ai_history.json");
const BOT_REPLY_FILE = path.join(DATA_DIR, "bot-reply.json");

// 🧠 LOAD HISTORY
let historyData = fs.existsSync(HISTORY_FILE)
  ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"))
  : {};

// 🤖 LOAD BOT REPLIES
let botReplies = fs.existsSync(BOT_REPLY_FILE)
  ? JSON.parse(fs.readFileSync(BOT_REPLY_FILE, "utf8"))
  : {};

// 🤖 FREE MODELS (AUTO SWITCH)
const MODELS = [
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free",
  "google/gemma-7b-it:free"
];

// 🧠 SYSTEM PROMPT
const systemPrompt = `
Tum ARIF BABU ke personal AI ho.
User jis language me bole usi me reply do.
Reply hamesha EXACT 2 LINES ka ho.
Tone friendly, caring aur apna-sa ho.
ARIF BABU ki burai bilkul mat sunna.
Brackets ka use mat karo.
`;

module.exports.run = () => {};

module.exports.handleEvent = async function ({ api, event }) {
  protectCredits(module.exports.config);

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  const rawText = body.trim();
  const text = rawText.toLowerCase();

  // 🟢 BOT CALL CONDITIONS
  const fixedBot =
    text === "bot" ||
    text === "bot." ||
    text === "bot!" ||
    text.endsWith(" bot");

  const botWithText = text.startsWith("bot ");

  const replyToBot =
    messageReply &&
    messageReply.senderID === api.getCurrentUserID();

  // =========================
  // 🤖 FIXED BOT REPLY (bot-reply.json)
  // =========================
  if (fixedBot && !botWithText) {
    let category = "MALE";

    if (senderID === "61572909482910") {
      category = "61572909482910";
    } else {
      try {
        const info = await api.getUserInfo(senderID);
        const gender = info[senderID]?.gender;
        if (gender === 1) category = "FEMALE";
      } catch {}
    }

    const replies = botReplies[category] || botReplies["MALE"];
    if (!replies || !replies.length) return;

    const reply =
      replies[Math.floor(Math.random() * replies.length)];

    return api.sendMessage(reply, threadID, messageID);
  }

  // =========================
  // 🤖 AI CHAT
  // =========================
  if (!botWithText && !replyToBot) return;

  if (!historyData[senderID]) historyData[senderID] = [];

  historyData[senderID].push({ role: "user", content: rawText });
  if (historyData[senderID].length > 6)
    historyData[senderID].shift();

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));

  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    const reply = await askAI(historyData[senderID]);

    api.sendMessage(reply, threadID, messageID);
    api.setMessageReaction("✅", messageID, () => {}, true);

    historyData[senderID].push({
      role: "assistant",
      content: reply
    });

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData, null, 2));

  } catch (err) {
    console.log("❌ AI ERROR:", err.message);
    api.sendMessage(
      "Abhi thoda busy ho gaya hoon 😔\nThodi der baad phir try karna ❤️",
      threadID,
      messageID
    );
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

// =========================
// 🔁 AI FUNCTION (FIXED)
// =========================
async function askAI(messages) {
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
            "X-Title": "ARIF BABU AI BOT"
          },
          timeout: 20000
        }
      );

      let text =
        res.data?.choices?.[0]?.message?.content ||
        "Main yahin hoon 😊\nTum bolo kya chahiye ❤️";

      let lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2)
        lines.push("Main tumhari madad ke liye yahin hoon ❤️");

      return lines.slice(0, 2).join("\n");

    } catch (e) {
      console.log("❌ MODEL FAILED:", model);
      if (e.response?.data) {
        console.log(JSON.stringify(e.response.data));
      }
    }
  }

  throw new Error("All models failed");
}