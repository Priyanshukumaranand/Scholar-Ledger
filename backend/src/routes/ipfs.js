const config = require("../config");

/**
 * IPFS upload proxy. The Pinata API keys live server-side only — the
 * frontend never sees them. Accepts a single multipart "file" part.
 */
module.exports = async function (fastify) {
  fastify.post("/ipfs/upload", async (request, reply) => {
    const apiKey = process.env.PINATA_API_KEY;
    const secret = process.env.PINATA_SECRET_KEY;
    const jwt = process.env.PINATA_JWT;

    if (!jwt && !(apiKey && secret)) {
      return reply
        .code(503)
        .send({ error: "IPFS service not configured on server" });
    }

    const part = await request.file();
    if (!part) {
      return reply.code(400).send({ error: "No file part provided" });
    }

    try {
      const buffer = await part.toBuffer();
      const blob = new Blob([buffer], {
        type: part.mimetype || "application/octet-stream",
      });
      const form = new FormData();
      form.append("file", blob, part.filename || "upload");

      const headers = jwt
        ? { Authorization: `Bearer ${jwt}` }
        : { pinata_api_key: apiKey, pinata_secret_api_key: secret };

      const res = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        { method: "POST", headers, body: form }
      );

      if (!res.ok) {
        const text = await res.text();
        return reply
          .code(502)
          .send({ error: `Pinata error (${res.status}): ${text.slice(0, 200)}` });
      }

      const data = await res.json();
      return {
        cid: data.IpfsHash,
        size: data.PinSize,
        gateway: config.ipfsGateway,
      };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: err.message || "Upload failed" });
    }
  });
};
