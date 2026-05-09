import { getReadOnlyContract } from "./readOnlyContract";

const IPFS_GATEWAY =
  process.env.REACT_APP_IPFS_GATEWAY || "https://ipfs.io/ipfs/";

const TTL_MS = 60_000;
const issuerCache = new Map();
const studentCache = new Map();

const getCached = (cache, key) => {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (cache, key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
};

export const shortAddr = (addr) =>
  !addr ? "" : `${addr.slice(0, 6)}…${addr.slice(-4)}`;

export const ipfsUrl = (cid) =>
  cid ? `${IPFS_GATEWAY}${cid}` : null;

/**
 * Resolves an issuer wallet to a full institutional profile + accreditation list.
 * Returns a normalized object with `exists` and `accredited` flags so callers
 * can render fallback UI for unregistered issuers.
 */
export const resolveIssuer = async (address) => {
  if (!address) return null;
  const key = address.toLowerCase();
  const cached = getCached(issuerCache, key);
  if (cached) return cached;

  let profile = {
    address,
    exists: false,
    name: null,
    shortName: null,
    country: null,
    websiteUrl: null,
    logoCID: null,
    accredited: false,
    accreditations: [],
  };

  try {
    const ir = getReadOnlyContract("issuerRegistry");
    const data = await ir.getInstitution(address);
    const exists = data[7];
    if (exists) {
      profile = {
        ...profile,
        exists: true,
        name: data[0],
        shortName: data[1],
        country: data[2],
        websiteUrl: data[3],
        logoCID: data[4],
      };
    }
  } catch {
    // ignore — registry may not be configured
  }

  try {
    const ar = getReadOnlyContract("accreditationRegistry");
    const [accredited, labels] = await Promise.all([
      ar.isAccredited(address),
      ar.getAccreditations(address),
    ]);
    profile.accredited = accredited;
    profile.accreditations = labels;
  } catch {
    // ignore
  }

  setCached(issuerCache, key, profile);
  return profile;
};

/**
 * Resolves a student wallet to their public profile via the IPFS-anchored CID.
 * Returns address-only fallback if no profile is registered.
 */
export const resolveStudent = async (address) => {
  if (!address) return null;
  const key = address.toLowerCase();
  const cached = getCached(studentCache, key);
  if (cached) return cached;

  let profile = {
    address,
    cid: null,
    name: null,
    photoCID: null,
    email: null,
    bio: null,
    publicProfile: true,
    socials: {},
  };

  try {
    const spr = getReadOnlyContract("studentProfileRegistry");
    const cid = await spr.getProfileCID(address);
    if (cid && cid.length > 0) {
      profile.cid = cid;
      try {
        const res = await fetch(`${IPFS_GATEWAY}${cid}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const json = await res.json();
          profile.name = json.name || null;
          profile.photoCID = json.photoCID || null;
          profile.email = json.email || null;
          profile.bio = json.bio || null;
          profile.publicProfile = json.publicProfile !== false;
          profile.socials = json.socials || {};
        }
      } catch {
        // network failure — keep CID, name remains null
      }
    }
  } catch {
    // ignore
  }

  setCached(studentCache, key, profile);
  return profile;
};

export const invalidateIdentity = (address) => {
  if (!address) return;
  const key = address.toLowerCase();
  issuerCache.delete(key);
  studentCache.delete(key);
};
