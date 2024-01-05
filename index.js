const fs = require("fs");
const { config } = require("dotenv");
const { LocalAuth, Client } = require("whatsapp-web.js");
const { quota } = require("./constants");

const {
  handleSave2Redis,
  handleCheckQuota,
  handleUpdateOnRedis,
  handleCheckExists,
  handleDecrementQuota,
} = require("./utils/redis");
const { handleQRDisplay } = require("./utils/qrgen");
const {
  handleSpeech2Blob,
  handleConvertText,
  handleTanslateSpeech,
} = require("./utils/speech");

const SESSION_FILE_PATH = "./session.json";

let sessionData;
config();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
  },
});

if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

client.on("qr", async (qr) => {
  await handleQRDisplay(qr);
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  if (handleCheckExists(message.from) || message.body === "/start") {
    if (message.hasMedia && message.type === "ptt") {
      try {
        // React to the received message
        const quotaLeft = await handleCheckQuota(message.from);
        if (quotaLeft > -20) {
          console.log("Quota left ", quotaLeft);
          await message.react("👍"); // You can use any emoji as a reaction
          console.log("Received an audio file !");
          const blob = await handleSpeech2Blob(message);
          const STT = await handleConvertText(blob, "en");
          //   await handleTanslateSpeech("My name is Raj");
          console.log("Speech to Text OUTPUT", STT);
          await handleDecrementQuota(message.from);
        }
        // const audiodata = `voice_${message.from}_${Date.now()}`;
      } catch (error) {
        console.error("Error responding to media: ", error);
      }
    } else if (typeof message.body === "string") {
      try {
        let srclang = "en";
        switch (message.body) {
          case "/start":
            await client.sendMessage(
              message.from,
              "What is your input language ?\n \n 1) For English type /setsrcen\n 2) For Hindi type /setsrchi\n 3) For Marathi type /setsrcmr"
            );
            await handleSave2Redis(message.from, "en", "hi", quota);
            break;

          case "/setsrcen":
            await message.react("👍");
            await handleUpdateOnRedis(message.from, "en", null);
            await client.sendMessage(
              message.from,
              "Select an output language ?\n \n 1) For Hindi type /gethi\n 2) For Marathi type /getmr"
            );
            break;
          case "/setsrchi":
            await message.react("👍");
            await handleUpdateOnRedis(message.from, "hi", null);
            await client.sendMessage(
              message.from,
              "Select an output language ?\n \n 1) For Marathi type /getmr"
            );
            break;
          case "/setsrcmr":
            await message.react("👍");
            await handleUpdateOnRedis(message.from, "mr", null);
            await client.sendMessage(
              message.from,
              "Select an output language ?\n \n 1) For Hindi type /gethi"
            );
            break;
          case "/gethi":
            await message.react("👍");
            srclang = await handleUpdateOnRedis(message.from, null, "hi");
            await client.sendMessage(
              message.from,
              `Great! Now send a voice note in ${srclang} to get it translated to Hindi`
            );
            break;
          case "/getmr":
            await message.react("👍");
            srclang = await handleUpdateOnRedis(message.from, null, "mr");
            await client.sendMessage(
              message.from,
              `Great! Now send a voice note in ${srclang} to get it translated to Marathi`
            );
            break;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
});

client.initialize();
