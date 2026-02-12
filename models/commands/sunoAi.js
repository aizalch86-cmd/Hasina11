const axios = require("axios");

module.exports.config = {
  name: "sona",
  version: "1.0.4",
  hasPermssion: 0,
  credits: "Shaan",
  description: "A friendly and playful chatbot named Sona.",
  commandCategory: "fun",
  usages: ".sona [text] or reply to a message with .sona",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const userInfo = await api.getUserInfo(senderID);
  const userName = userInfo[senderID]?.name || "jaan";

  let promptText = "";

  // Case 1: अगर सिर्फ +sona लिखा गया है और कोई रिप्लाई नहीं है
  if (args.length === 0 && !event.messageReply) {
    return api.sendMessage(
      `Hy main Sona hu our Shaan ne banaya hai our Han 💕\nAap kaise ho ${userName} 😘`,
      threadID,
      messageID
    );
  }

  // Case 2: अगर किसी मैसेज का जवाब दिया गया है
  if (event.messageReply) {
    const repliedMessage = event.messageReply;
    const repliedBody = repliedMessage.body || "";
    const attachments = repliedMessage.attachments;

    // अगर रिप्लाई में कोई अटैचमेंट (फोटो/वीडियो/ऑडियो) है
    if (attachments && attachments.length > 0) {
      const attachmentType = attachments[0].type;
      promptText = `{${attachmentType}}`; // AI को अटैचमेंट का प्रकार बताएं

      // अगर रिप्लाई के साथ कोई टेक्स्ट भी है
      if (args.length > 0) {
        promptText += ` ${args.join(" ")}`;
      }
    } else {
      // अगर रिप्लाई में सिर्फ टेक्स्ट है
      if (args.length > 0) {
        // "रिप्लाई वाला मैसेज" और "आपका नया टेक्स्ट"
        promptText = `"${repliedBody}" ${args.join(" ")}`;
      } else {
        // सिर्फ रिप्लाई वाला मैसेज
        promptText = `"${repliedBody}"`;
      }
    }
  } else {
    // Case 3: अगर सीधे +sona के साथ टेक्स्ट दिया गया है
    promptText = args.join(" ");
  }

  try {
    const encodedPrompt = encodeURIComponent(promptText);
    const url = `https://text.pollinations.ai/${encodedPrompt}`;

    const res = await axios.get(url);
    const sonaReply = res.data || "😅 Mujhe samajh nahi aaya baby...";

    api.sendMessage(
      `Hi ${userName} Shaan ❤️\n${sonaReply}`,
      threadID,
      messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage(
      "⚠️ Oops baby, Pollinations API se reply nahi mila 😢",
      threadID,
      messageID
    );
  }
};