module.exports.config = {
  name: "uid3",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "SHAAN-KHAN",
  description: "Generate stylish Facebook info card with circular DP",
  commandCategory: "Tools",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {

  const fs = global.nodemodule["fs-extra"];
  const request = global.nodemodule["request"];
  const { createCanvas, loadImage } = require("canvas");

  let uid, name;

  if (Object.keys(event.mentions).length > 0) {
    uid = Object.keys(event.mentions)[0];
    name = event.mentions[uid].replace("@", "");
  } else {
    uid = event.senderID;
    name = "Facebook User";
  }

  const dpURL = `https://graph.facebook.com/${uid}/picture?height=600&width=600&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const filePath = __dirname + `/cache/circle_${uid}.png`;

  await new Promise(resolve =>
    request(dpURL)
      .pipe(fs.createWriteStream(filePath))
      .on("close", resolve)
  );

  const img = await loadImage(filePath);

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 512);

  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, 0, 0, 512, 512);

  const finalPath = __dirname + `/cache/finaldp_${uid}.png`;
  fs.writeFileSync(finalPath, canvas.toBuffer());

  const moment = require("moment-timezone");
  moment.tz.setDefault("Asia/Karachi");

  const date = moment().format("DD/MM/YYYY");
  const time = moment().format("hh:mm:ss A");
  const day = moment().format("dddd");

  let msg =
`━━━━━━━━━━━━━━━━━━
🤖 𝐁𝐎𝐓 𝐈𝐍𝐅𝐎 🎉
━━━━━━━━━━━━━━━━━━
📅 Date: ${date}
🕒 Time: ${time}
📆 Day: ${day}

👤 Name: ${name}
🆔 UID: ${uid}
━━━━━━━━━━━━━━━━━━`;

  api.sendMessage(
    {
      body: msg,
      attachment: fs.createReadStream(finalPath)
    },
    event.threadID,
    () => {
      fs.unlinkSync(filePath);
      fs.unlinkSync(finalPath);
    },
    event.messageID
  );
};