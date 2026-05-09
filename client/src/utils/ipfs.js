import { apiFetch } from "./backend";

/**
 * Upload a file to IPFS via the backend proxy. Pinata API keys live on the
 * server only — they are never bundled into the client.
 */
export const uploadToIPFS = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch("/api/v1/ipfs/upload", {
    method: "POST",
    body: formData,
  });
  if (!res?.cid) throw new Error("IPFS upload failed: no CID returned");
  return res.cid;
};
