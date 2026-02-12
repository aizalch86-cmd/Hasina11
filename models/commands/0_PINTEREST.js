const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
    name: "pinterest",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SHANKAR",
    description: "Fetches images from Pinterest based on keywords",
    commandCategory: "utility",
    usages: "pic <keyword>, image <keyword>, pinterest <keyword>, photo <keyword>, pin <keyword>",
    dependencies: {
        "axios": "",
        "fs-extra": ""
    },
    cooldowns: 5,
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, senderID, body } = event;

    if (!body) return;

    const triggerWords = ["pic", "image", "pinterest", "photo", "pin"];
    const command = body.split(" ")[0].toLowerCase();
    const keyword = body.split(" ").slice(1).join(" ");

    if (triggerWords.includes(command) && keyword) {
        const url = `https://shankar-sir-api.onrender.com/api/pinterest?text=${encodeURIComponent(keyword)}`;
        try {
            const response = await axios.get(url);
            const images = response.data.result; 

            if (!Array.isArray(images)) {
                const errorMessage = `Error: Expected an array of images but received ${typeof images}`;
                console.error(errorMessage);
                return api.sendMessage(errorMessage, threadID);
            }

            if (images.length === 0) {
                const errorMessage = `No images found for keyword: ${keyword}`;
                console.error(errorMessage);
                return api.sendMessage(errorMessage, threadID);
            }

            const imagePromises = images.slice(0, 4).map(async (imageUrl, index) => {
                const imagePath = `${__dirname}/cache/${keyword}_${index}.jpg`;
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, 'utf-8'));
                return imagePath;
            });

            const imagePaths = await Promise.all(imagePromises);

            const attachments = imagePaths.map(path => fs.createReadStream(path));

            api.sendMessage({
                body: `Here are some images for keyword: ${keyword}`,
                attachment: attachments
            }, threadID, () => {
                imagePaths.forEach(path => fs.unlinkSync(path));
            });
        } catch (error) {
            console.error(error);
            return api.sendMessage(`An error occurred while fetching images: ${error.message}`, threadID);
        }
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID } = event;

    const keyword = args.join(" ");
    if (!keyword) {
        return api.sendMessage("Please provide a keyword to search for images.", threadID);
    }

    const url = `https://shankar-sir-api.onrender.com/api/pinterest?text=${encodeURIComponent(keyword)}`;
    try {
        const response = await axios.get(url);
        const images = response.data.result; 

        if (!Array.isArray(images)) {
            const errorMessage = `Error: Expected an array of images but received ${typeof images}`;
            console.error(errorMessage);
            return api.sendMessage(errorMessage, threadID);
        }

        if (images.length === 0) {
            const errorMessage = `No images found for keyword: ${keyword}`;
            console.error(errorMessage);
            return api.sendMessage(errorMessage, threadID);
        }

        const imagePromises = images.slice(0, 4).map(async (imageUrl, index) => {
            const imagePath = `${__dirname}/cache/${keyword}_${index}.jpg`;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, 'utf-8'));
            return imagePath;
        });

        const imagePaths = await Promise.all(imagePromises);

        const attachments = imagePaths.map(path => fs.createReadStream(path));

        api.sendMessage({
            body: `ये लो अपनी पसंद का: ${keyword} वाला फोटो 😇`,
            attachment: attachments
        }, threadID, () => {
            imagePaths.forEach(path => fs.unlinkSync(path));
        });
    } catch (error) {
        console.error(error);
        return api.sendMessage(`An error occurred while fetching images: ${error.message}`, threadID);
    }