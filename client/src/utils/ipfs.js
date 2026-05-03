import axios from "axios";

// BUG-16: keys moved to .env — never hardcode secrets in client source
// BUG-17: maxContentLength must be the number Infinity, not the string "Infinity"
export const uploadToIPFS = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      maxContentLength: Infinity,
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
        pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_KEY,
      },
    }
  );

  return res.data.IpfsHash;
};
