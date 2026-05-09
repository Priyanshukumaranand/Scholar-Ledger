const { ethers } = require("ethers");
const { requireContract } = require("../lib/contracts");
const { getIssuerProfile, getStudentProfile } = require("../lib/identity");

const isValidAddress = (a) => typeof a === "string" && ethers.isAddress(a);

const loadCredential = async (address, indexNum) => {
  const sl = requireContract("scholarLedger");
  const count = Number(await sl.getCredentialCount(address));
  if (Number.isNaN(indexNum) || indexNum < 0 || indexNum >= count) {
    return null;
  }
  const [cidHash, cid, title, issuedOn, revoked, issuer] =
    await sl.getCredential(address, indexNum);
  return {
    student: address,
    index: indexNum,
    cidHash,
    cid,
    title,
    issuedOn: Number(issuedOn),
    revoked,
    issuer,
  };
};

module.exports = async function (fastify) {
  // Single credential verification (with full identity enrichment)
  fastify.get("/verify/:address/:index", async (request, reply) => {
    const { address, index } = request.params;
    if (!isValidAddress(address)) {
      return reply.code(400).send({ error: "Invalid address" });
    }
    const idx = Number(index);
    const cred = await loadCredential(address, idx);
    if (!cred) {
      return reply.code(404).send({
        error: "Credential not found",
        student: address,
        index: idx,
      });
    }
    const [issuerProfile, studentProfile] = await Promise.all([
      getIssuerProfile(cred.issuer),
      getStudentProfile(address),
    ]);
    return {
      ...cred,
      valid: !cred.revoked,
      issuerProfile,
      studentProfile,
    };
  });

  // Bulk verification — verifier posts a list of credentials to check
  fastify.post("/verify/bulk", async (request, reply) => {
    const { items } = request.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return reply
        .code(400)
        .send({ error: "Body must be { items: [{student, index|cidHash}, ...] }" });
    }
    if (items.length > 200) {
      return reply.code(400).send({ error: "Max 200 items per request" });
    }

    const sl = requireContract("scholarLedger");
    const results = await Promise.all(
      items.map(async (item, i) => {
        try {
          if (!isValidAddress(item.student)) {
            return { i, error: "Invalid student address" };
          }
          if (item.cidHash) {
            const valid = await sl.verifyCredential(item.student, item.cidHash);
            return {
              i,
              student: item.student,
              cidHash: item.cidHash,
              valid,
            };
          }
          if (typeof item.index === "number" || typeof item.index === "string") {
            const idx = Number(item.index);
            const cred = await loadCredential(item.student, idx);
            if (!cred) {
              return { i, student: item.student, index: idx, error: "Not found" };
            }
            return {
              i,
              student: item.student,
              index: idx,
              title: cred.title,
              issuer: cred.issuer,
              issuedOn: cred.issuedOn,
              revoked: cred.revoked,
              valid: !cred.revoked,
            };
          }
          return { i, error: "Each item needs either cidHash or index" };
        } catch (err) {
          return { i, error: err.message || "Lookup failed" };
        }
      })
    );

    return { count: results.length, results };
  });

  // Public credential listing (used by profile API)
  fastify.get("/credentials/:address", async (request, reply) => {
    const { address } = request.params;
    if (!isValidAddress(address)) {
      return reply.code(400).send({ error: "Invalid address" });
    }
    const sl = requireContract("scholarLedger");
    const count = Number(await sl.getCredentialCount(address));
    const records = [];
    for (let i = 0; i < count; i++) {
      const [cidHash, cid, title, issuedOn, revoked, issuer] =
        await sl.getCredential(address, i);
      records.push({
        index: i,
        cidHash,
        cid,
        title,
        issuedOn: Number(issuedOn),
        revoked,
        issuer,
      });
    }
    const studentProfile = await getStudentProfile(address);
    return { student: address, count, credentials: records, studentProfile };
  });
};
