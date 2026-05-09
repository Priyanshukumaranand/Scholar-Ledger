const Fastify = require("fastify");
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
const rateLimit = require("@fastify/rate-limit");
const config = require("./config");

const start = async () => {
  const fastify = Fastify({
    logger: { level: "info" },
    bodyLimit: 10 * 1024 * 1024, // 10 MB for CSVs
  });

  await fastify.register(cors, {
    origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(","),
    methods: ["GET", "POST", "OPTIONS"],
  });

  await fastify.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });

  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // Health
  fastify.get("/health", async () => ({
    ok: true,
    service: "scholar-ledger-backend",
    time: new Date().toISOString(),
    contracts: {
      scholarLedger: Boolean(config.contracts.scholarLedger),
      issuerRegistry: Boolean(config.contracts.issuerRegistry),
      studentProfileRegistry: Boolean(config.contracts.studentProfileRegistry),
      accreditationRegistry: Boolean(config.contracts.accreditationRegistry),
    },
    emailEnabled: config.email.enabled,
  }));

  // API v1
  await fastify.register(require("./routes/verify"), { prefix: "/api/v1" });
  await fastify.register(require("./routes/identity"), { prefix: "/api/v1" });
  await fastify.register(require("./routes/bulk"), { prefix: "/api/v1" });
  await fastify.register(require("./routes/notify"), { prefix: "/api/v1" });
  await fastify.register(require("./routes/ipfs"), { prefix: "/api/v1" });

  // Friendly default error mapping
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const status = error.statusCode || 500;
    reply.code(status).send({ error: error.message || "Server error" });
  });

  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(
      `\n  Scholar Ledger backend listening on http://${config.host}:${config.port}\n`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
