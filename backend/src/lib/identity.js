const { requireContract } = require("./contracts");
const config = require("../config");

// In-memory cache: maps addr -> { value, expiresAt }
const cache = new Map();
const TTL_MS = 60_000;

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
};

const fetchJson = async (url) => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`IPFS fetch ${res.status}`);
  return res.json();
};

const getIssuerProfile = async (address) => {
  const key = `issuer:${address.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const ir = requireContract("issuerRegistry");
  const ar = requireContract("accreditationRegistry");

  const [
    [name, shortName, country, websiteUrl, logoCID, , , exists],
    accreditations,
    accredited,
  ] = await Promise.all([
    ir.getInstitution(address),
    ar.getAccreditations(address).catch(() => []),
    ar.isAccredited(address).catch(() => false),
  ]);

  const profile = {
    address,
    exists,
    name: exists ? name : null,
    shortName: exists ? shortName : null,
    country: exists ? country : null,
    websiteUrl: exists ? websiteUrl : null,
    logoCID: exists ? logoCID : null,
    accredited,
    accreditations,
  };
  setCached(key, profile);
  return profile;
};

const getStudentProfile = async (address) => {
  const key = `student:${address.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const spr = requireContract("studentProfileRegistry");
  const cid = await spr.getProfileCID(address);

  let json = null;
  if (cid && cid.length > 0) {
    try {
      json = await fetchJson(`${config.ipfsGateway}${cid}`);
    } catch {
      json = null;
    }
  }

  const profile = {
    address,
    cid: cid || null,
    name: json?.name || null,
    photoCID: json?.photoCID || null,
    email: json?.email || null,
    bio: json?.bio || null,
    publicProfile: json?.publicProfile !== false,
    socials: json?.socials || {},
  };
  setCached(key, profile);
  return profile;
};

module.exports = { getIssuerProfile, getStudentProfile };
