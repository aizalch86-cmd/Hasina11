const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "2.8.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Strict Script Forcer with Emoji Moods",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Reply to bot]",
  cooldowns: 2,
};

let userMemory = {};
let lastScript = {}; 
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  if (global.client.commands.get("hercai").config.credits !== "Shaan Khan") {
    return api.sendMessage("⚠️ Error: Credits changed. Creator: Shaan Khan", event.threadID, event.messageID);
  }

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body) return;
  if (!messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  api.setMessageReaction("⌛", messageID, () => {}, true);
  
  const userQuery = body.toLowerCase();
  if (!userMemory[senderID]) userMemory[senderID] = [];
  
  // Script memory check
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Strict Language Detection
  if (userQuery.includes("pashto") || userQuery.includes("پښتو")) {
    lastScript[senderID] = "NATIVE PASHTO SCRIPT (پښتو)";
  } else if (userQuery.includes("urdu") && (userQuery.includes("script") || userQuery.includes("mein"))) {
    lastScript[senderID] = "NATIVE URDU SCRIPT (اردو)";
  } else if (userQuery.includes("hindi") || userQuery.includes("हिंदी")) {
    lastScript[senderID] = "NATIVE HINDI SCRIPT (हिंदी)";
  } else if (userQuery.includes("roman")) {
    lastScript[senderID] = "Roman Urdu";
  }

  const conversationHistory = userMemory[senderID].join("\n");
  
  // Aggressive Script + Emoji Prompt
  const systemPrompt = `You are an AI by Shaan Khan. 
  CURRENT SCRIPT: ${lastScript[senderID]}.
  
  RULES:
  1. If script is NATIVE (Urdu/Pashto/Hindi), NEVER use Roman English letters (a, b, c). Use ONLY their respective native alphabets.
  2. Use relevant EMOJIS (😊, ✨, 🔥, 🥀, etc.) in every response to make it expressive.
  3. If user speaks in Roman Urdu, you must still respond in ${lastScript[senderID]} unless they say "Roman mein baat karo".
  4. Keep the tone friendly but stay locked in the script.
  Context: ${conversationHistory}`;

  const apiURL = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt + "\nUser: " + body)}?model=mistral&seed=${Math.random()}`;

  try {
    const response = await axios.get(apiURL, { timeout: 25000 });
    let botReply = response.data;

    if (!botReply) throw new Error("Empty response");

    userMemory[senderID].push(`U: ${body}`);
    userMemory[senderID].push(`B: ${botReply}`);
    if (userMemory[senderID].length > 6) userMemory[senderID].splice(0, 2);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(botReply, threadID, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ Error! Script ya connection ka masla hai. ✨", threadID, messageID);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "on") {
    isActive = true;
    return api.sendMessage("✅ AI Active. Emojis and Script Lock enabled! 🎭", threadID, messageID);
  } else if (command === "off") {
    isActive = false;
    return api.sendMessage("⚠️ AI Paused. 👋", threadID, messageID);
  } else if (command === "clear") {
    userMemory = {};
    lastScript = {};
    return api.sendMessage("🧹 History and Language reset! ✨", threadID, messageID);
  }
};
