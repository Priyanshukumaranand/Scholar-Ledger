const { ethers } = require("ethers");
const { getIssuerProfile, getStudentProfile } = require("../lib/identity");

const isValidAddress = (a) => typeof a === "string" && ethers.isAddress(a);

module.exports = async function (fastify) {
  fastify.get("/issuer/:address", async (request, reply) => {
    const { address } = request.params;
    if (!isValidAddress(address)) {
      return reply.code(400).send({ error: "Invalid address" });
    }
    return getIssuerProfile(address);
  });

  fastify.get("/student/:address", async (request, reply) => {
    const { address } = request.params;
    if (!isValidAddress(address)) {
      return reply.code(400).send({ error: "Invalid address" });
    }
    return getStudentProfile(address);
  });
};
