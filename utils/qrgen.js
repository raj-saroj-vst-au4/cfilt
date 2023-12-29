const qrcode = require("qrcode-terminal");

const handleQRDisplay = async (qr) => {
  await qrcode.generate(qr, { small: true });
};

module.exports = { handleQRDisplay };
