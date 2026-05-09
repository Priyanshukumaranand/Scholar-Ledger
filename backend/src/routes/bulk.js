const { ethers } = require("ethers");
const { parse } = require("csv-parse/sync");

const isValidAddress = (a) => typeof a === "string" && ethers.isAddress(a);

/**
 * Bulk issuance preparation.
 *
 * The admin uploads a CSV (already-uploaded files have their CIDs known).
 * The backend parses, validates, and returns a normalized payload that the
 * frontend then submits to the smart contract via a single
 * `issueCredentialBatch` transaction signed by the admin's wallet.
 *
 * The actual on-chain write does NOT happen on the server — keys never
 * leave the admin's wallet.
 */
module.exports = async function (fastify) {
  fastify.post("/bulk/parse-csv", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: "Expected a CSV file upload" });
    }
    const buffer = await data.toBuffer();
    let rows;
    try {
      rows = parse(buffer.toString("utf-8"), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      return reply
        .code(400)
        .send({ error: "CSV parse failed: " + err.message });
    }

    if (rows.length === 0) {
      return reply.code(400).send({ error: "CSV is empty" });
    }
    if (rows.length > 500) {
      return reply
        .code(400)
        .send({ error: "Max 500 rows per batch (got " + rows.length + ")" });
    }

    const required = ["student", "title", "cid"];
    const missing = required.filter((col) => !(col in rows[0]));
    if (missing.length) {
      return reply.code(400).send({
        error:
          "CSV header must contain: student, title, cid. Missing: " +
          missing.join(", "),
      });
    }

    const items = [];
    const errors = [];
    rows.forEach((row, i) => {
      const lineNo = i + 2; // header is line 1
      const student = (row.student || "").trim();
      const title = (row.title || "").trim();
      const cid = (row.cid || "").trim();
      if (!isValidAddress(student)) {
        errors.push({ line: lineNo, error: "Invalid student address" });
        return;
      }
      if (!title) {
        errors.push({ line: lineNo, error: "Empty title" });
        return;
      }
      if (!cid) {
        errors.push({ line: lineNo, error: "Empty CID" });
        return;
      }
      const cidHash = ethers.keccak256(ethers.toUtf8Bytes(cid));
      items.push({ line: lineNo, student, title, cid, cidHash });
    });

    return {
      total: rows.length,
      valid: items.length,
      invalid: errors.length,
      items,
      errors,
    };
  });
};
