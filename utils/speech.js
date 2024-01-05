const axios = require("axios").default;
const FormData = require("form-data");

const handleSpeech2Blob = async (message, sliceSize = 512) => {
  try {
    // Fetch audio data from the message
    const audioData = await message.downloadMedia();
    const binaryData = atob(audioData.data);
    const byteArrays = [];

    for (let offset = 0; offset < binaryData.length; offset += sliceSize) {
      const slice = binaryData.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    console.log(byteArrays.length);

    const blob = new Blob(byteArrays, { type: "audio/ogg" });
    console.log("Generated blob", blob);
    return audioData;
  } catch (error) {
    console.error("Error fetching or converting audio:", error);
    throw error; // Propagate the error for handling higher up in the code
  }
};

const handleConvertText = async (recordedBlob) => {
  var api_url = "https://www.cfilt.iitb.ac.in/en-hi/text";

  const params = JSON.stringify({ sourceLanguage: "en" });

  console.log("recorded blob", recordedBlob);

  const translationFormData = new FormData();
  translationFormData.append("files", recordedBlob.data, "wsvoicenote.ogg");
  translationFormData.append("data", params);

  try {
    const response = await axios({
      method: "POST",
      url: api_url,
      data: translationFormData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log(response);
    return response; // If you want to return the text for further use
  } catch (e) {
    console.log("Converting to text error", e);
  }
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
