# 🎓 Scholar Ledger — Blockchain-Anchored Academic Credentials

> **Tamper-proof digital degrees. Instant verification. No intermediaries.**

Scholar Ledger is a decentralized academic credential system that empowers universities to issue cryptographically-secure digital credentials, enables students to own and share their achievements, and allows employers and institutions to verify authenticity in seconds—*without requiring any blockchain experience or account setup*.

---

## Table of Contents

- [Why Scholar Ledger?](#-why-scholar-ledger)
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Project](#running-the-project)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Smart Contracts](#-smart-contracts)
- [Data Models](#-data-models)
- [User Roles & Workflows](#-user-roles--workflows)
- [Security Model](#-security-model)
- [Deployment Guide](#-deployment-guide)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Why Scholar Ledger?

### The Problem

Academic fraud affects **20% of job applications globally**. Traditional verification is slow, expensive, and easily forged:
- Manual processes (calling registrars, mailing transcripts) take weeks
- Centralized systems are single points of failure
- Physical certificates are easy to counterfeit
- Data silos prevent interoperability

### The Solution

Scholar Ledger applies **blockchain anchoring** (proven by MIT Blockcerts, EU EBSI, and India's IGNOU) to create:

✅ **Tamper-Proof** — Once issued, credentials cannot be silently altered  
✅ **Instantly Verifiable** — Anyone can confirm authenticity in seconds  
✅ **Privacy-Preserving** — Only hashes are public; personal data stays private  
✅ **No Account Required** — Verifiers don't need MetaMask, wallets, or signups  
✅ **Document Portable** — Students can email, print, or QR-share anywhere  
✅ **Issuer-Controlled** — Universities can revoke fraudulent credentials  

---

## 🏗️ Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React 19)                       │
│          Home │ Admin │ Student │ Verify │ Profile          │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│              Backend (Fastify/Node.js)                      │
│    Verify │ Bulk Ops │ IPFS │ Identity │ Notifications     │
└─────────────────────────────────────────────────────────────┘
         ↕                    ↕                  ↕
    ┌─────────┐      ┌──────────────┐    ┌────────────┐
    │ Polygon │      │ IPFS/Pinata  │    │ PostgreSQL │
    │ L2 / RPC│      │ (Documents)  │    │(Indexing)  │
    └─────────┘      └──────────────┘    └────────────┘
         ↕
    ┌─────────────────────────────────────────┐
    │     4 Smart Contracts                   │
    │ • ScholarLedger (core credentials)     │
    │ • IssuerRegistry (universities)         │
    │ • StudentProfileRegistry (metadata)     │
    │ • AccreditationRegistry (governance)    │
    └─────────────────────────────────────────┘
```

### Data Flow (Credential Issuance)

```
1. Admin logs in              → MetaMask wallet connects
2. Admin uploads degree PDF   → Backend uploads to IPFS
3. Backend returns IPFS hash  → PDF now distributed & pinned
4. Admin enters student data  → Form submission (wallet + student address + hash)
5. MetaMask signs tx          → Transaction sent to blockchain
6. Contract receives tx       → Stores (issuer, student, hash, timestamp)
7. Contract emits event       → "CredentialIssued"
8. Event indexed              → The Graph subgraph processes it
9. Index cached               → PostgreSQL stores searchable record
10. Student notified          → Email alert with credential details
11. Student logs in           → Views credential in dashboard
12. Student generates QR      → Encodes (student address, hash, issuer) → shares
13. Verifier scans QR         → Redirects to public verify page
14. Verify page loads data    → Queries The Graph, displays PDF from IPFS
15. Verifier confirms hash    → "✅ Authentic" badge appears
```

---

## ✨ Key Features

### For Universities (Admins)

| Feature | Description |
|---------|-------------|
| **Batch Issue** | Upload CSV + PDFs → issue 1000s in one transaction |
| **Revoke** | Mark credentials as invalid (fraud, retraction) |
| **Multi-Admin** | Delegated signing authority within university |
| **Audit Trail** | Blockchain ledger is permanent audit log |
| **Gas Sponsorship** | Backend pays gas (optional Paymaster integration) |

### For Students

| Feature | Description |
|---------|-------------|
| **Own Credentials** | Private wallet stores key; credentials belong to student |
| **Download PDF** | Get original document + QR code embedded |
| **Public Profile** | Share `yourschool.scholar-ledger.io/profile/<address>` |
| **Per-Credential QR** | Generate unique QR per credential → scannable |
| **Notifications** | Email alerts when credentials are issued/revoked |

### For Verifiers (Employers/Anyone)

| Feature | Description |
|---------|-------------|
| **No Account** | Verify without signup, wallet, or app install |
| **Multiple Routes** | QR scan, public URL, or manual form |
| **Instant Confirmation** | Blockchain + IPFS hash matching in <1s |
| **Shareable Links** | Employer can verify & share proof with others |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — Component-based UI
- **Tailwind CSS** — Utility-first styling
- **ethers.js** — Blockchain interaction (contract reads/writes)
- **axios** — HTTP client for backend API
- **qrcode.react** — QR code generation
- **jspdf** — PDF generation & manipulation
- **html5-qrcode** — QR code scanning
- **lucide-react** — Icon library

### Backend
- **Fastify** — High-performance HTTP server
- **ethers.js** — Contract interaction & event listening
- **csv-parse** — CSV parsing for bulk operations
- **Resend** — Transactional email service
- **dotenv** — Environment variable management
- **CORS & Rate Limiting** — Security middleware

### Blockchain
- **Solidity 0.8.x** — Smart contract language
- **Truffle** — Compile, deploy, test contracts
- **Ganache** — Local blockchain for development
- **Polygon** — Production L2 (gas-efficient)
- **ethers.js** — Blockchain RPC client

### Storage & Indexing
- **IPFS** — Decentralized document storage
- **Pinata** — IPFS pinning service
- **The Graph** — Event indexing & querying
- **PostgreSQL** — Relational DB for caching/analytics

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 18 | Runtime for frontend, backend, scripts |
| **npm** | ≥ 10 | Package manager |
| **Truffle** | latest | Solidity compilation & deployment |
| **Ganache** | desktop or CLI | Local blockchain |
| **MetaMask** | browser extension | Wallet for signing transactions |
| **Pinata Account** | free tier | IPFS pinning (get API key + secret) |

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/Priyanshukumaranand/Scholar-Ledger.git
cd Scholar-Ledger
```

#### 2. Install dependencies

```bash
# Root (if needed)
npm install

# Backend
cd backend
npm install
cd ..

# Client
cd client
npm install
cd ..

# Blockchain (if separate)
cd blockchain
npm install
cd ..
```

#### 3. Start Ganache

**Option A: Desktop App**
- Open Ganache → Click "Quickstart"
- Confirm it's running on `127.0.0.1:7545` with chain ID `1337`

**Option B: CLI**
```bash
ganache-cli --chainId 1337 --accounts 10 --mnemonic "test test test..."
```

#### 4. Deploy Smart Contracts

```bash
cd blockchain
truffle migrate --reset --network ganache
```

Expected output:
```
=== Scholar Ledger Deployment Summary ===
ScholarLedger          : 0xAAA...
IssuerRegistry         : 0xBBB...
StudentProfileRegistry : 0xCCC...
AccreditationRegistry  : 0xDDD...
```

**Copy these addresses — you'll need them next.**

#### 5. Copy Contract ABIs

```bash
cd ..
node scripts/copy-abis.js
```

This copies ABIs to `client/src/abi/` and `backend/abi/`.

#### 6. Configure Environment

**Create `client/.env`:**

```env
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key
REACT_APP_CONTRACT_ADDRESS=0xAAA...
REACT_APP_ISSUER_REGISTRY_ADDRESS=0xBBB...
REACT_APP_STUDENT_PROFILE_REGISTRY_ADDRESS=0xCCC...
REACT_APP_ACCREDITATION_REGISTRY_ADDRESS=0xDDD...
REACT_APP_RPC_URL=http://127.0.0.1:7545
REACT_APP_BACKEND_URL=http://localhost:4000
GENERATE_SOURCEMAP=false
```

**Create `backend/.env`:**

```env
PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RPC_URL=http://127.0.0.1:7545
SCHOLAR_LEDGER_ADDRESS=0xAAA...
ISSUER_REGISTRY_ADDRESS=0xBBB...
STUDENT_PROFILE_REGISTRY_ADDRESS=0xCCC...
ACCREDITATION_REGISTRY_ADDRESS=0xDDD...
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
RESEND_API_KEY=your_resend_key
DATABASE_URL=postgresql://localhost:5432/scholar_ledger
```

### Running the Project

#### Terminal 1: Backend

```bash
cd backend
npm run dev  # or `npm start` for production
```

Expected output:
```
{"level":30,"msg":"Server listening at http://0.0.0.0:4000"}
Scholar Ledger backend listening on http://0.0.0.0:4000
```

#### Terminal 2: Frontend

```bash
cd client
npm start
```

Expected output:
```
Compiled successfully!
You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

#### Terminal 3: Watch Contracts (Optional)

```bash
cd blockchain
truffle watch
```

---

## 📁 Project Structure

```
Scholar-Ledger/
├── blockchain/
│   ├── contracts/
│   │   ├── ScholarLedger.sol           # Core credential contract
│   │   ├── IssuerRegistry.sol          # University registry
│   │   ├── StudentProfileRegistry.sol  # Student metadata
│   │   └── AccreditationRegistry.sol   # Accreditation bodies
│   ├── migrations/
│   │   └── 2_deploy_scholar_ledger.js
│   ├── test/
│   │   └── (test files)
│   ├── truffle-config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.js                    # Server entry point
│   │   ├── config.js                   # Config loader
│   │   ├── lib/
│   │   │   ├── contracts.js            # Contract instances
│   │   │   ├── identity.js             # ENS + identity resolution
│   │   │   └── (utilities)
│   │   └── routes/
│   │       ├── verify.js               # Verify credentials
│   │       ├── bulk.js                 # Bulk operations
│   │       ├── ipfs.js                 # IPFS operations
│   │       ├── identity.js             # Identity resolution
│   │       └── notify.js               # Email notifications
│   ├── abi/
│   │   ├── ScholarLedger.json
│   │   ├── IssuerRegistry.json
│   │   ├── StudentProfileRegistry.json
│   │   └── AccreditationRegistry.json
│   ├── package.json
│   └── .env (not in repo; create it)
│
├── client/
│   ├── src/
│   │   ├── App.js                      # Main app component
│   │   ├── index.js                    # React entry point
│   │   ├── abi/                        # Contract ABIs
│   │   ├── components/
│   │   │   ├── ConnectWallet.jsx
│   │   │   ├── CredentialCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadCredential.jsx
│   │   │   ├── VerifyCredential.jsx
│   │   │   ├── ShareCredentialModal.jsx
│   │   │   ├── ui/                     # Reusable UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Alert.jsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── WalletContext.jsx       # Wallet state management
│   │   │   ├── ThemeContext.jsx        # Dark/light mode
│   │   │   └── ToastContext.jsx        # Toast notifications
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── StudentSettings.jsx
│   │   │   ├── BulkIssue.jsx
│   │   │   ├── PublicVerify.jsx
│   │   │   ├── PublicProfile.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── contract.js             # ethers.js helpers
│   │   │   ├── backend.js              # API client
│   │   │   ├── ipfs.js                 # IPFS integration
│   │   │   ├── pdfGenerator.js         # PDF generation
│   │   │   ├── credentialPresets.js    # Data templates
│   │   │   ├── network.js              # Network config
│   │   │   ├── useDocumentTitle.js     # Custom hooks
│   │   │   └── ...
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env (not in repo; create it)
│
├── docs/
│   └── SYSTEM_ARCHITECTURE.md          # Detailed architecture doc
│
├── scripts/
│   └── copy-abis.js                    # Copy ABIs after deployment
│
├── package.json                        # Root package.json
└── README.md                           # This file
```

---

## 📡 API Documentation

All endpoints are served at `http://localhost:4000/api/v1`.

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "ok": true,
  "service": "scholar-ledger-backend",
  "time": "2026-05-12T...",
  "contracts": {
    "scholarLedger": true,
    "issuerRegistry": true,
    "studentProfileRegistry": true,
    "accreditationRegistry": true
  },
  "emailEnabled": true
}
```

### Verify Credential

```bash
POST /verify
Content-Type: application/json

{
  "credentialHash": "0xabc123...",
  "issuerAddress": "0xdef456...",
  "studentAddress": "0xghi789...",
  "contractAddress": "0xjkl012..."
}
```

**Response:**
```json
{
  "isValid": true,
  "credentialHash": "0xabc123...",
  "issuer": "0xdef456...",
  "student": "0xghi789...",
  "timestamp": 1234567890,
  "isRevoked": false,
  "credentialData": { ... }
}
```

### Bulk Verify

```bash
POST /verify/batch
Content-Type: application/json

{
  "credentials": [
    { "hash": "0xabc...", "issuer": "0xdef...", "student": "0xghi..." },
    { "hash": "0x123...", "issuer": "0x456...", "student": "0x789..." }
  ]
}
```

**Response:**
```json
{
  "results": [
    { "isValid": true, "credentialHash": "0xabc..." },
    { "isValid": false, "credentialHash": "0x123..." }
  ]
}
```

### Upload Document to IPFS

```bash
POST /ipfs/upload
Content-Type: multipart/form-data

file=@degree.pdf
```

**Response:**
```json
{
  "hash": "QmXxxx...",
  "url": "https://gateway.pinata.cloud/ipfs/QmXxxx...",
  "size": 524288,
  "status": "pinned"
}
```

### Resolve Identity

```bash
GET /identity/resolve?address=0xabc123...
```

**Response:**
```json
{
  "address": "0xabc123...",
  "ens": "alice.eth",
  "displayName": "Alice Smith"
}
```

### Send Notification Email

```bash
POST /notify/email
Content-Type: application/json

{
  "to": "student@example.com",
  "subject": "Your degree has been issued",
  "type": "credential_issued",
  "data": {
    "studentName": "Alice",
    "credentialType": "Bachelor of Science",
    "issuerName": "University of Example"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123..."
}
```

---

## 📋 Smart Contracts

### ScholarLedger.sol (Core Contract)

Stores credential anchors and manages issuance/revocation.

**Key Functions:**

```solidity
// Issue a new credential
function issueCredential(
    address student,
    bytes32 credentialHash,
    string memory credentialType,
    uint256 expirationTime
) external onlyIssuer

// Revoke a credential
function revokeCredential(bytes32 credentialHash) external onlyIssuer

// Verify a credential
function verifyCredential(bytes32 credentialHash) 
    external view returns (bool, address, uint256, bool)

// Emit events on blockchain for indexing
event CredentialIssued(
    address indexed issuer,
    address indexed student,
    bytes32 credentialHash,
    uint256 timestamp
);
```

### IssuerRegistry.sol

Maintains list of authorized universities and admins.

```solidity
// Register as issuer
function registerIssuer(
    string memory universityName,
    string memory country
) external

// Check if address is authorized issuer
function isAuthorizedIssuer(address _address) 
    external view returns (bool)
```

### StudentProfileRegistry.sol

Stores student profile metadata (IPFS links, bio, etc.).

```solidity
// Update student profile
function updateProfile(
    bytes32 profileHash,
    string memory ipfsLink
) external

// Get student profile
function getProfile(address student) 
    external view returns (bytes32, string memory)
```

### AccreditationRegistry.sol

Governance layer for accreditation bodies.

```solidity
// Register accreditation body
function registerAccreditationBody(string memory name) external

// Approve/deny issuer
function setIssuerAccreditation(
    address issuer,
    bool approved
) external onlyAccreditation
```

---

## 📊 Data Models

### Credential Data Structure

```json
{
  "id": "uuid-v4",
  "credentialHash": "0xabc123...",
  "issuer": {
    "address": "0xdef456...",
    "name": "University of Example",
    "country": "US"
  },
  "student": {
    "address": "0xghi789...",
    "name": "Alice Smith",
    "email": "alice@example.com"
  },
  "credential": {
    "type": "Bachelor of Science",
    "field": "Computer Science",
    "issuedDate": "2024-05-15",
    "expirationDate": null,
    "gpa": "3.8"
  },
  "document": {
    "ipfsHash": "QmXxxx...",
    "mimeType": "application/pdf",
    "size": 524288,
    "filename": "BS_CS_Alice_Smith.pdf"
  },
  "metadata": {
    "issuedAtBlockNumber": 12345678,
    "issuedAtTimestamp": 1715784900,
    "issuedAtTxHash": "0x123abc...",
    "isRevoked": false,
    "revokedAtTimestamp": null,
    "revokedAtTxHash": null
  }
}
```

### Student Profile

```json
{
  "address": "0xghi789...",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "bio": "Computer Science student interested in blockchain",
  "profileImageIpfs": "QmXxxx...",
  "credentials": [
    { "hash": "0xabc123...", "type": "Bachelor of Science" },
    { "hash": "0x456def...", "type": "AWS Certification" }
  ],
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/alice",
    "github": "https://github.com/alice"
  },
  "createdAt": "2024-01-15",
  "updatedAt": "2026-05-12"
}
```

---

## 👥 User Roles & Workflows

### Admin Workflow (Issuance)

```
1. Login with MetaMask              [Frontend]
2. Navigate to Admin Panel          [Frontend]
3. Upload degree PDF                [Frontend → IPFS via Pinata]
4. Enter student wallet + metadata  [Frontend Form]
5. Review + confirm                 [Frontend]
6. Sign with MetaMask               [MetaMask Pop-up]
7. Transaction sent to blockchain   [Ethereum RPC]
8. Smart contract validates         [ScholarLedger.sol]
9. Event emitted                    [ScholarLedger.sol]
10. Event indexed                   [The Graph Subgraph]
11. Student notified                [Backend Email Service]
12. Credential appears in student dashboard [Frontend]
```

### Student Workflow (Sharing)

```
1. Login with MetaMask              [Frontend]
2. View credentials                 [Frontend]
3. Download credential PDF          [Frontend generates with QR]
4. Share profile link               [Copy-paste: scholar-ledger.io/profile/<address>]
5. Generate per-credential QR       [Frontend]
6. Email, print, or embed QR        [Student's choice]
```

### Verifier Workflow (Verification)

```
1. Scan QR code (no login needed)   [QR → URL]
2. Public verify page loads         [Frontend]
3. Page queries blockchain          [Ethers.js read-only RPC]
4. Page queries IPFS                [Fetch document from gateway]
5. Hash comparison                  [Frontend compares hashes]
6. Result displayed                 [✅ Authentic or ❌ Invalid]
7. Optional: Download proof         [Screenshot or PDF]
```

---

## 🔒 Security Model

### On-Chain Security

| Component | Protection |
|-----------|-----------|
| **Credential Hash** | SHA-256 of full document; immutable once stored |
| **Issuer Authority** | Only registered, approved addresses can issue |
| **Revocation Flag** | Only issuer can set; transparent on-chain |
| **Event Log** | All transactions immutable & auditable |

### Off-Chain Security

| Component | Protection |
|-----------|-----------|
| **IPFS Documents** | Content-addressed; hash = fingerprint; cannot be replaced silently |
| **Private Keys** | MetaMask custodies (student/admin responsibility) |
| **Email Notifications** | Signed with Resend; link verification tokens expire in 15 min |
| **Backend API** | Rate limiting (120 req/min); CORS restrictions |

### Frontend Security

| Component | Protection |
|-----------|-----------|
| **Wallet Connection** | MetaMask pop-ups for every transaction (user consent) |
| **Private Data** | Student PII stays in browser & backend DB (not on-chain) |
| **QR Codes** | No sensitive data in QR; just (issuer, hash, student address) |

---

## 🚢 Deployment Guide

### Production Checklist

- [ ] Use **Polygon Mumbai** (testnet) or **Polygon Mainnet** (production)
- [ ] Configure **RPC provider** (Alchemy, Infura, or Polygon public RPC)
- [ ] Deploy contracts with **Truffle migrations**
- [ ] Set up **The Graph Subgraph** (event indexing)
- [ ] Configure **PostgreSQL database** (production deployment)
- [ ] Use **Pinata Pro** or **Web3.Storage** (IPFS pinning)
- [ ] Set up **Resend** (email service)
- [ ] Configure **CORS** for frontend origin
- [ ] Enable **Rate Limiting** on API
- [ ] Use **HTTPS** and **SSL certificates**
- [ ] Set up **logging & monitoring** (Sentry, LogRocket)
- [ ] Document **incident response** procedures

### Docker Deployment (Optional)

```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
EXPOSE 4000
CMD ["node", "src/index.js"]
```

```bash
docker build -t scholar-ledger-backend .
docker run -e PORT=4000 -e RPC_URL=... scholar-ledger-backend
```

### Environment Variables (Production)

```env
# Blockchain
RPC_URL=https://polygon-rpc.com/
SCHOLAR_LEDGER_ADDRESS=0x...
ISSUER_REGISTRY_ADDRESS=0x...
STUDENT_PROFILE_REGISTRY_ADDRESS=0x...
ACCREDITATION_REGISTRY_ADDRESS=0x...

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
IPFS_GATEWAY=https://gateway.pinata.cloud

# Email
RESEND_API_KEY=...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/scholar_ledger

# Frontend
REACT_APP_RPC_URL=https://polygon-rpc.com/
REACT_APP_BACKEND_URL=https://api.scholar-ledger.io
REACT_APP_CONTRACT_ADDRESS=0x...
```

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Smart contract tests
cd blockchain
truffle test

# Frontend tests
cd client
npm test
```

### Adding a New Feature

1. **Create a branch** — `git checkout -b feature/your-feature`
2. **Update backend** — Add routes, validation, event listeners
3. **Update frontend** — Add pages, components, context
4. **Update contracts** (if needed) — Add functions, events
5. **Test** — Unit tests + manual QA
6. **Open PR** — Link to GitHub issues
7. **Merge** — After review

### Code Style

- **Frontend** — ESLint + Prettier (`.prettierrc` in root)
- **Backend** — Standard Node.js conventions
- **Contracts** — Solidity style guide (80-char lines)

---

## 🐛 Troubleshooting

### MetaMask Won't Connect

**Problem:** MetaMask prompts to switch network or won't sign.

**Solution:**
1. Open MetaMask → Network → Add Custom RPC
   - Network: `Scholar Ledger`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency: `ETH`
2. Switch to the new network
3. Reload page

### IPFS Upload Fails

**Problem:** `Error: Pinata API key invalid`

**Solution:**
1. Check Pinata credentials in `.env`
2. Verify API key on Pinata dashboard
3. Ensure key has "pinning" permissions
4. Try uploading file directly to Pinata to test

### Backend Won't Start

**Problem:** `Port 4000 already in use`

**Solution:**
```bash
# macOS/Linux
lsof -i :4000
kill -9 <PID>

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Contract Not Found at Address

**Problem:** Frontend errors about contract at `0x...` being invalid.

**Solution:**
1. Run migrations again: `truffle migrate --reset --network ganache`
2. Copy new addresses: `node scripts/copy-abis.js`
3. Update `.env` with new addresses
4. Restart frontend/backend

---

## 📚 Additional Resources

- **[System Architecture Doc](docs/SYSTEM_ARCHITECTURE.md)** — Full technical design
- **[W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)** — Industry standard
- **[Solidity Docs](https://docs.soliditylang.org/)** — Smart contract language
- **[ethers.js](https://docs.ethers.org/)** — Blockchain library
- **[IPFS Docs](https://docs.ipfs.io/)** — Decentralized storage
- **[Polygon Docs](https://polygon.technology/developers/)** — L2 blockchain

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please ensure:
- Code follows project style guide
- Tests pass: `npm test`
- Commit messages are descriptive
- No hardcoded secrets in code

---

## 📄 License

This project is licensed under the **ISC License** — see [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Issues** — [GitHub Issues](https://github.com/Priyanshukumaranand/Scholar-Ledger/issues)
- **Discussions** — [GitHub Discussions](https://github.com/Priyanshukumaranand/Scholar-Ledger/discussions)
- **Email** — [contact@scholar-ledger.io](mailto:contact@scholar-ledger.io)

---

## 🎯 Roadmap

### Phase 2 (Q3 2026)

- [ ] Account Abstraction (gasless signups for students)
- [ ] Mobile app (React Native)
- [ ] The Graph subgraph deployment
- [ ] Polygon mainnet deployment
- [ ] Multi-language support

### Phase 3 (Q4 2026)

- [ ] W3C Verifiable Credentials integration
- [ ] OpenBadges 3.0 compatibility
- [ ] Government KYC verification layer
- [ ] Enterprise employer dashboard

### Phase 4 (2027+)

- [ ] Interoperability with other universities
- [ ] Federated trust network
- [ ] Advanced analytics & reporting
- [ ] AI-powered fraud detection

---

## ✨ Acknowledgments

- MIT Blockcerts for the foundational blockchain-credential pattern
- EU EBSI for governance best practices
- Polygon for scalable L2 infrastructure
- The Graph for efficient event indexing
- All contributors and beta testers

---

**Made with ❤️ by the Scholar Ledger team**

**Star us on GitHub!** ⭐
