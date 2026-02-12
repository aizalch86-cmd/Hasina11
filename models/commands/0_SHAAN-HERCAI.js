const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "2.2.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Fast Dynamic AI - Default Roman Urdu, Native Script on Demand",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Bot ke message par reply karein]",
  cooldowns: 2,
};

let userMemory = {};
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  // Credits Protection
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("⚠️ Error: Credits changed. Creator: Shaan Khan", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;

  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  // Visual effects
  api.setMessageReaction("⌛", messageID, () => {}, true);
  api.sendTypingIndicator(threadID);

  const userQuery = body.trim();
  if (!userMemory[senderID]) userMemory[senderID] = [];

  const conversationHistory = userMemory[senderID].join("\n");
  
  // **Master Prompt Logic**
  const systemPrompt = `Creator: Shaan Khan. 
  Primary Rule: Speak in Roman Urdu/Hindi by default. 
  Secondary Rule: If the user requests a specific language or script (like Pashto, Hindi script, or Urdu script), switch to that native script immediately for that request and onwards until asked otherwise. 
  Context: ${conversationHistory}`;

  // Speed-optimized URL
  const apiURL = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\nUser: " + userQuery)}?model=mistral&seed=${Math.floor(Math.random() * 1000)}`;

  try {
    const response = await axios.get(apiURL, { timeout: 20000 });
    let botReply = response.data || "Maaf kijiyega, main abhi khamosh hoon.";

    // Memory balance for speed
    userMemory[senderID].push(`U: ${userQuery}`);
    userMemory[senderID].push(`B: ${botReply}`);
    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Connection slow hai, dobara try karein.", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") return;
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ AI Active (Shaan Khan). Ab aap kisi bhi language mein baat kar sakte hain!", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ AI Paused.", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    return api.sendMessage("🧹 History cleared!", threadID, messageID);
  }
};
