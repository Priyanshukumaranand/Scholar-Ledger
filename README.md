# Scholar Ledger

Blockchain-anchored academic credential system. Universities issue tamper-proof
digital credentials; students share QR-coded PDFs; verifiers (recruiters,
institutions) confirm authenticity in seconds — no wallet, no signup.

📐 Full design: [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md)

---

## What's in the repo

```
scholar-ledger/
├── blockchain/         Solidity contracts + Truffle migrations
│   └── contracts/
│       ├── ScholarLedger.sol           # credentials + multi-admin roles
│       ├── IssuerRegistry.sol          # university self-registration
│       ├── StudentProfileRegistry.sol  # IPFS-anchored student profiles
│       └── AccreditationRegistry.sol   # accreditation body
├── backend/            Node/Fastify API: bulk verify, bulk issue prep, identity
├── client/             React 19 + Tailwind frontend
├── docs/               Architecture document
└── scripts/copy-abis.js   Helper: copy ABIs after redeploy
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Frontend & backend |
| Truffle | latest (`npm i -g truffle`) | Compile + deploy contracts |
| Ganache | desktop or CLI on `127.0.0.1:7545` | Local blockchain |
| MetaMask | browser extension | Sign transactions |
| Pinata | free account | IPFS pinning (API key + secret) |

---

## First-time setup

### 1. Install dependencies

```bash
# from repo root
cd blockchain && npm install     # if blockchain has its own deps; otherwise skip
cd ../backend && npm install
cd ../client && npm install
```

### 2. Start Ganache

Launch the Ganache desktop app → Quickstart → it should be on
`127.0.0.1:7545` with chain ID `1337`. Note: chain ID `1337` (frontend uses this
for MetaMask), network ID `5777` (Truffle uses this).

### 3. Deploy all four contracts

```bash
cd blockchain
truffle migrate --reset --network ganache
```

You'll see a deployment summary at the bottom listing 4 addresses:

```
=== Scholar Ledger Deployment Summary ===
ScholarLedger          : 0xAAA...
IssuerRegistry         : 0xBBB...
StudentProfileRegistry : 0xCCC...
AccreditationRegistry  : 0xDDD...
```

### 4. Copy ABIs to client + backend

From the repo root:

```bash
node scripts/copy-abis.js
```

This copies the four contract ABIs from `blockchain/build/contracts/` into both
`client/src/abi/` and `backend/abi/` and prints the deployed addresses.

### 5. Configure `client/.env`

Copy the four addresses from the previous step into `client/.env`:

```
REACT_APP_PINATA_API_KEY=<your Pinata key>
REACT_APP_PINATA_SECRET_KEY=<your Pinata secret>
REACT_APP_CONTRACT_ADDRESS=0xAAA...
REACT_APP_ISSUER_REGISTRY_ADDRESS=0xBBB...
REACT_APP_STUDENT_PROFILE_REGISTRY_ADDRESS=0xCCC...
REACT_APP_ACCREDITATION_REGISTRY_ADDRESS=0xDDD...
REACT_APP_RPC_URL=http://127.0.0.1:7545
REACT_APP_BACKEND_URL=http://localhost:4000
GENERATE_SOURCEMAP=false
```

Optional:

```
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### 6. Configure `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in:

```
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
RPC_URL=http://127.0.0.1:7545
SCHOLAR_LEDGER_ADDRESS=0xAAA...
ISSUER_REGISTRY_ADDRESS=0xBBB...
STUDENT_PROFILE_REGISTRY_ADDRESS=0xCCC...
ACCREDITATION_REGISTRY_ADDRESS=0xDDD...
IPFS_GATEWAY=https://ipfs.io/ipfs/

# Optional: enable email notifications
# RESEND_API_KEY=re_...
# RESEND_FROM=Scholar Ledger <noreply@yourdomain.com>
```

### 7. Import Ganache accounts into MetaMask

1. Open Ganache, click the key icon next to **two** accounts (admin + student)
2. Copy each private key
3. In MetaMask → Add account → Import → paste private key
4. Switch the network to "Localhost 7545" (or add custom RPC `http://127.0.0.1:7545`, chain ID `1337`)

The first account in Ganache is the **super admin** (deployer of all 4 contracts) by default.

### 8. Start the backend

```bash
cd backend
npm start
```

You'll see `Scholar Ledger backend listening on http://0.0.0.0:4000`.

### 9. Start the frontend

```bash
cd client
npm start
```

Opens `http://localhost:3000`.

---

## After every contract redeploy

Whenever you run `truffle migrate --reset` again, repeat:

```bash
node scripts/copy-abis.js   # refresh ABIs
# update the 4 contract addresses in client/.env and backend/.env
# restart npm start in both client and backend
```

---

## Demo walkthrough

### As **Super Admin** (Account #0 in Ganache)

1. Connect wallet (top right) — header shows **Super Admin**
2. Visit **Institution** → register your institution profile
   - Name: e.g. "Indian Institute of Technology Delhi"
   - Short name, country (`IN`), website, optional logo
3. Visit **Admin** → grant the **Issuer** role to another wallet
4. Visit **Accreditation** (since super admin == accreditation authority by default)
   - Add your institution wallet, label "UGC, AICTE"
5. Issue a credential to a student (Home page)
6. Visit **Bulk Issue** to test the multi-row flow with 3+ students

### As **Student** (Account #1)

1. Connect — header shows **Student**
2. Visit **My Profile** → set name, photo (uploaded to IPFS), bio
3. Home page now shows credentials with your name and the issuer's name
4. Click **Download PDF** — certificate now reads:
   > "This is to certify that **Prince Kumar Singh** has been awarded the credential of **BTech CSE**. Issued by **Indian Institute of Technology Delhi** — Accredited by UGC, AICTE."
5. Copy the verification link and paste in incognito to confirm public verification works

### As **Verifier** (no wallet, incognito browser)

- `/verify/<student>/<index>` — single credential page with full details + accreditation badge
- `/profile/<student>` — full credential profile
- `/bulk-verify` — upload a CSV; export results as CSV

---

## Project structure

### Smart contracts ([`blockchain/contracts/`](blockchain/contracts))

| Contract | Purpose | Roles |
|----------|---------|-------|
| `ScholarLedger.sol` | Credentials anchor; bulk issuance | super admin, ADMIN, ISSUER |
| `IssuerRegistry.sol` | Institution self-registration | self-owned per address |
| `StudentProfileRegistry.sol` | IPFS-anchored student profile | self-owned per address |
| `AccreditationRegistry.sol` | Accreditation flags + labels | accreditationAuthority |

### Backend ([`backend/src/`](backend/src))

```
src/
├── index.js                Fastify bootstrap (CORS, rate limit, multipart)
├── config.js               Env-driven config
├── lib/
│   ├── contracts.js        Read-only ethers contracts
│   └── identity.js         Cached issuer/student profile resolution
└── routes/
    ├── verify.js           GET /api/v1/verify/:address/:index, POST /verify/bulk, GET /credentials/:address
    ├── identity.js         GET /api/v1/issuer/:address, GET /api/v1/student/:address
    ├── bulk.js             POST /api/v1/bulk/parse-csv (CSV → validated batch payload)
    └── notify.js           POST /api/v1/notify/credential-issued, POST /notify/credential-revoked
```

### Frontend ([`client/src/`](client/src))

```
src/
├── App.js                  Routes + ThemeProvider + WalletProvider
├── index.css               Tailwind + design tokens
├── abi/                    Contract ABIs (regenerated by copy-abis.js)
├── context/
│   ├── ThemeContext.jsx    Dark/light mode
│   └── WalletContext.jsx   Account + role flags (isAdmin, canIssue, isSuperAdmin, isAccreditationAuthority)
├── components/
│   ├── ui/                 Button, Card, Input, Badge, Alert, ThemeToggle
│   ├── ConnectWallet.jsx
│   ├── CredentialCard.jsx  Per-credential display with QR + PDF + revoke
│   ├── IssuerBadge.jsx     Resolves issuer address → institution name + accreditation
│   ├── StudentBadge.jsx    Resolves student address → name + photo
│   ├── Navbar.jsx
│   ├── StudentDashboard.jsx
│   ├── UploadCredential.jsx
│   └── VerifyCredential.jsx
├── pages/
│   ├── Home.jsx            Connected dashboard
│   ├── VerifyManual.jsx    /verify
│   ├── PublicVerify.jsx    /verify/:address/:index — public, no wallet
│   ├── PublicProfile.jsx   /profile/:address — public, no wallet
│   ├── QrScanner.jsx       /scan
│   ├── IssuerSettings.jsx  /issuer-settings — admin manages institution
│   ├── StudentSettings.jsx /profile-settings — student manages profile
│   ├── BulkIssue.jsx       /bulk-issue — CSV-driven batch issuance
│   ├── BulkVerify.jsx      /bulk-verify — CSV-driven batch verification
│   ├── AdminPanel.jsx      /admin — role management
│   └── AccreditationPanel.jsx  /accreditation — accreditation authority
└── utils/
    ├── contract.js          Wallet-signed contract instances
    ├── readOnlyContract.js  Read-only RPC contract instances (no MetaMask)
    ├── identity.js          Cached issuer/student resolution
    ├── ipfs.js              Pinata uploader
    ├── pdfGenerator.js      Branded credential PDF with QR
    └── backend.js           Backend API client
```

---

## Roles cheat sheet

| Role | Granted by | Can do |
|------|-----------|--------|
| **Super Admin** | Deploys ScholarLedger; transferable via `transferSuperAdmin` | Everything an Admin can; transfer super admin |
| **Admin** | Granted by super admin or another Admin via `grantRole` | Issue, revoke, grant/revoke ISSUER & ADMIN roles |
| **Issuer** | Granted by an Admin | Issue credentials only (no revoke, no role mgmt) |
| **Student** | (anyone with no role) | Set their own profile; view their credentials |
| **Accreditation Authority** | Deploys AccreditationRegistry; transferable | Mark issuers as accredited; transfer authority |

---

## Common gotchas

- **MetaMask says "wrong network"** → switch to Ganache (chain ID 1337)
- **PDF shows "(Unregistered profile)"** → student or issuer hasn't filled out their profile yet
- **`Contract address not configured`** error in console → you missed updating `client/.env` after deploy
- **Backend returns 503** → contract addresses in `backend/.env` are missing
- **`23 source-map warnings`** at startup → harmless noise from `html5-qrcode`; silenced by `GENERATE_SOURCEMAP=false`
- **After Ganache restart** → all chain state is wiped. Run `truffle migrate --reset` + `node scripts/copy-abis.js` + update env files.

---

## License

ISC.
