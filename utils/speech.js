const axios = require("axios").default;

const handleSpeech2Blob = async (message) => {
  try {
    // Fetch audio data from the message
    const audioData = await message.downloadMedia();

    // Create a blob from the Uint8Array
    const audioBlob = new Blob([audioData], {
      type: message._data.mimetype, // Ensure the correct MIME type is used
    });

    console.log("Audio Blob:", audioBlob);
    return audioBlob;
  } catch (error) {
    console.error("Error fetching or converting audio:", error);
    throw error; // Propagate the error for handling higher up in the code
  }
};
const handleConvertText = async (recordedBlob, source) => {
  var api_url = "https://www.cfilt.iitb.ac.in/en-hi/text";

  const params = JSON.stringify({ sourceLanguage: source });

  var formData = new FormData();
  formData.append("files", recordedBlob, "whatsappvoicenote");
  formData.append("data", params);

  await axios({
    method: "post",
    url: api_url,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => {
    const text_output = res.data.text;

    console.log(text_output);
    // handle_source_text(text_output);

    // translate_speech(text_output);
  });
};

const handleTanslateSpeech = async (current_text) => {
  const api_url = "https://www.cfilt.iitb.ac.in/en-hi/speech";
  const params = JSON.stringify({
    language: { sourceLanguage: "en", targetLanguage: "hi" },
    text: current_text,
  });

  try {
    var formData = new FormData();
    formData.append("data", params);

    axios({
      method: "post",
      url: api_url,
      data: formData,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      resposeType: "blob",
    }).then((res) => {
      console.log("text to speech", res.data);
    });
  } catch (e) {
    console.log("Text to Speech Backend Failed !");
  }
};

module.exports = { handleSpeech2Blob, handleConvertText, handleTanslateSpeech };
