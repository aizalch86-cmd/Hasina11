const axios = require("axios");

module.exports.config = {
  name: "hercai",
  version: "8.0.0",
  hasPermission: 0,
  credits: "Shaan Khan", 
  description: "Llama-3 Stable Connection Fix",
  commandCategory: "AI",
  usePrefix: false,
  usages: "[Reply to bot]",
  cooldowns: 2,
};

let userMemory = {};
let lastScript = {}; 
let isActive = true;

module.exports.handleEvent = async function ({ api, event }) {
  if (this.config.credits !== "Shaan Khan") return;

  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!isActive || !body || !messageReply || messageReply.senderID !== api.getCurrentUserID()) return;

  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  if (!userMemory[senderID]) userMemory[senderID] = [];
  if (!lastScript[senderID]) lastScript[senderID] = "Roman Urdu";

  // Quick Language Toggle
  const q = body.toLowerCase();
  if (q.includes("pashto")) lastScript[senderID] = "Pashto";
  else if (q.includes("urdu")) lastScript[senderID] = "Urdu";
  else if (q.includes("hindi")) lastScript[senderID] = "Hindi";

  const systemPrompt = `You are a helpful AI by Shaan Khan. Respond in ${lastScript[senderID]} with emojis. User says: ${body}`;

  // NEW STABLE LLAMA API
  const apiURL = `https://api.aggelos-007.xyz/llama3?prompt=${encodeURIComponent(systemPrompt)}`;

  try {
    const response = await axios.get(apiURL, { timeout: 10000 });
    
    // Check if response is valid string or object
    let botReply = typeof response.data === 'string' ? response.data : response.data.response || response.data.message;

    if (!botReply) throw new Error("Empty");

    api.setMessageReaction("✅", messageID, (err) => {}, true);
    return api.sendMessage(botReply + " ✨", threadID, messageID);

  } catch (error) {
    // SECOND TRY: Another fast free API
    try {
      const retry = await axios.get(`https://api.simsimi.vn/v1/simtalker.php?lc=en&key=me_123&text=${encodeURIComponent(body)}`);
      return api.sendMessage(retry.data.message + " 🥀", threadID, messageID);
    } catch (e) {
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      return api.sendMessage("⚠️ API Limit reached. Shaan Khan se rabta karein. 🥀", threadID, messageID);
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const cmd = args[0]?.toLowerCase();
  if (cmd === "on") isActive = true;
  if (cmd === "off") isActive = false;
  if (cmd === "clear") userMemory = {};
  return api.sendMessage(`✨ Status: ${isActive ? "Active" : "Paused"}`, threadID, messageID);
};
