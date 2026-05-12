# Scholar Ledger — Architecture & Dataflow Diagrams

This document contains comprehensive visual representations of the Scholar Ledger system architecture, data flows, and component interactions.

---

## 1. System Overview

### High-Level Architecture Layers

```
┌────────────────────────────────────────────────────────────────┐
│                   🎨 PRESENTATION LAYER                        │
│                    React 19 SPA Frontend                       │
│     Home │ Admin │ Student │ Verify │ Profile │ Settings       │
└────────────────────────────────────────────────────────────────┘
                              ↕
┌────────────────────────────────────────────────────────────────┐
│                   ⚙️ APPLICATION LAYER                         │
│                   Fastify Backend API                          │
│  Verify │ Bulk │ IPFS │ Identity │ Notify │ Analytics         │
└────────────────────────────────────────────────────────────────┘
                ↕              ↕              ↕
       ┌─────────────┐  ┌────────────┐  ┌─────────────┐
       │ Blockchain  │  │   Storage  │  │  Indexing   │
       │  Layer      │  │   Layer    │  │   Layer     │
       │             │  │            │  │             │
       │ Polygon L2  │  │ IPFS       │  │ The Graph   │
       │ Contracts   │  │ PostgreSQL │  │ Subgraph    │
       └─────────────┘  └────────────┘  └─────────────┘
```

---

## 2. Component Interaction Diagram

### Full System Communication Map

```
        ┌─────────────────────────────────────┐
        │    Frontend (React 19)              │
        │  • Home Dashboard                   │
        │  • Admin Panel                      │
        │  • Student View                     │
        │  • Public Verify                    │
        │  • Public Profile                   │
        └──────────────┬──────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    ┌─────────────┐         ┌──────────────────┐
    │  MetaMask   │         │  Backend API     │
    │  Wallet     │         │  (Fastify)       │
    │             │         │                  │
    │ • Sign Tx   │         │ • Verify Routes  │
    │ • Auth      │         │ • Bulk Routes    │
    │             │         │ • IPFS Routes    │
    └────────┬────┘         │ • Identity API   │
             │               │ • Notify Routes  │
             │               │ • Rate Limiting  │
             │               │ • CORS           │
             │               └────┬─────────────┘
             │                    │
             ▼                    │
    ┌────────────────┐           │
    │  Blockchain    │           │
    │  (Polygon L2)  │           │
    │                │           │
    │ • ScholarLedger│           │
    │ • IssuerReg    │           │
    │ • StudentReg   │           │
    │ • Accrediitation│           │
    └───────┬────────┘           │
            │                    │
            ▼                    │
    ┌──────────────┐             │
    │  Events      │             │
    │  Emission    │             │
    │              │             │
    │ • Issued     │             │
    │ • Revoked    │             │
    │ • Transferred│             │
    └──────┬───────┘             │
           │                     │
           ▼                     ▼
    ┌──────────────────────────────────┐
    │   The Graph Subgraph             │
    │   • Event Listener               │
    │   • GraphQL Index                │
    │   • Query Resolution             │
    └──────────────┬───────────────────┘
                   │
           ┌───────┴───────┐
           ▼               ▼
    ┌────────────┐  ┌──────────────┐
    │ PostgreSQL │  │ IPFS/Pinata  │
    │  Database  │  │   Storage    │
    │            │  │              │
    │ • Hashes   │  │ • PDFs       │
    │ • Metadata │  │ • Profiles   │
    │ • Cache    │  │ • Documents  │
    └────┬───────┘  └──────┬───────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
           Return to API
           & Frontend
```

---

## 3. Credential Lifecycle Dataflow

### Detailed Issuance Flow

```
STEP 1: Admin Initiation
┌─────────────────────┐
│ Admin logs in       │
│ MetaMask connects   │
│ Wallet: 0xDEF...   │
└────────────┬────────┘
             │
STEP 2: Document Upload
┌─────────────────────────────────┐
│ Frontend: Select PDF            │
│ File: "BS_Computer_Science.pdf" │
│ Size: 2.5 MB                    │
└────────────┬────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Backend: /api/v1/ipfs/upload     │
│ Receives multipart file          │
│ Generates SHA-256 hash           │
│ Returns IPFS hash (Qm...)        │
└────────────┬─────────────────────┘
             │
STEP 3: Metadata Entry
┌──────────────────────────────────┐
│ Admin fills form:                │
│ • Student Address: 0xGHI...      │
│ • Credential Type: BSc           │
│ • Issued Date: 2026-05-12        │
│ • GPA: 3.85                      │
│ • IPFS Hash: QmABC123...         │
└────────────┬─────────────────────┘
             │
STEP 4: Hash Generation
┌────────────────────────────────┐
│ Frontend computes hash:        │
│ keccak256(                     │
│   studentAddr +                │
│   ipfsHash +                   │
│   metadata                     │
│ )                              │
│ Result: 0xABC123...            │
└────────────┬───────────────────┘
             │
STEP 5: Transaction Preparation
┌──────────────────────────────────┐
│ Frontend prepares transaction:   │
│                                 │
│ ScholarLedger.issueCredential(   │
│   to: 0xGHI789...,              │
│   hash: 0xABC123...,            │
│   credType: "BSc CS",           │
│   expiration: 0                 │
│ )                               │
└────────────┬─────────────────────┘
             │
STEP 6: MetaMask Signing
┌──────────────────────────────────┐
│ MetaMask pop-up appears          │
│ Admin reviews + signs            │
│ Signature: 0x123DEF...           │
│ Nonce: 42                        │
│ Gas estimate: 150,000 gas        │
└────────────┬─────────────────────┘
             │
STEP 7: Blockchain Submission
┌──────────────────────────────────┐
│ ethers.js sends signed tx        │
│ to Polygon RPC endpoint          │
│ TX Hash: 0xXYZ789...             │
│ Status: Pending                  │
└────────────┬─────────────────────┘
             │
STEP 8: Smart Contract Processing
┌──────────────────────────────────┐
│ ScholarLedger.sol processes:     │
│                                 │
│ 1. Verify caller is issuer       │
│ 2. Verify student address valid  │
│ 3. Check not already issued      │
│ 4. Store credential anchor:      │
│    credentials[hash] = {         │
│      issuer: 0xDEF...,          │
│      student: 0xGHI...,         │
│      timestamp: block.timestamp, │
│      revoked: false              │
│    }                             │
│ 5. Emit CredentialIssued event   │
└────────────┬─────────────────────┘
             │
STEP 9: Event Emission
┌────────────────────────────────┐
│ Contract emits:                │
│                                │
│ event CredentialIssued(        │
│   indexed issuer: 0xDEF...,   │
│   indexed student: 0xGHI...,  │
│   hash: 0xABC123...,           │
│   timestamp: 1715784900        │
│ )                              │
└────────────┬───────────────────┘
             │
STEP 10: Event Indexing
┌────────────────────────────────┐
│ The Graph subgraph listener:   │
│                                │
│ 1. Detects CredentialIssued    │
│ 2. Parses event data           │
│ 3. Updates entity store:       │
│    credential: {               │
│      id: hash,                 │
│      issuer: 0xDEF...,        │
│      student: 0xGHI...,       │
│      createdAt: 1715784900,   │
│      revoked: false            │
│    }                           │
│ 4. GraphQL index regenerates   │
└────────────┬───────────────────┘
             │
STEP 11: Cache Update
┌────────────────────────────────┐
│ Backend subscribes to Graph:   │
│                                │
│ query {                        │
│   credentials(first: 1000) {   │
│     id                         │
│     issuer { id }              │
│     student { id }             │
│     createdAt                  │
│   }                            │
│ }                              │
│                                │
│ Results cached in PostgreSQL   │
└────────────┬───────────────────┘
             │
STEP 12: Email Notification
┌────────────────────────────────┐
│ Backend detects new credential │
│                                │
│ POST /api/v1/notify/email      │
│ {                              │
│   to: student@example.com,     │
│   type: "credential_issued",   │
│   data: {                      │
│     credType: "BSc CS",        │
│     issuerName: "University",  │
│     credHash: 0xABC123...      │
│   }                            │
│ }                              │
│                                │
│ Resend sends email             │
└────────────┬───────────────────┘
             │
STEP 13: Student Dashboard Update
┌────────────────────────────────┐
│ Student logs in                │
│ Frontend fetches credentials   │
│ via Backend API                │
│                                │
│ GET /api/v1/verify?            │
│     student=0xGHI...           │
│                                │
│ Backend queries The Graph      │
│ Returns credential record      │
│ Frontend displays:             │
│ ✅ Bachelor of Science (CS)    │
│    Issued: May 12, 2026        │
│    Verify Link: [QR Code]      │
└────────────┬───────────────────┘
             │
STEP 14: QR Generation
┌────────────────────────────────┐
│ Student clicks "Share"         │
│                                │
│ Frontend generates QR:         │
│ qrcode.react.encode(           │
│   url: verifyPageURL +         │
│     ?hash=0xABC123...&         │
│     issuer=0xDEF...&           │
│     student=0xGHI...           │
│ )                              │
│                                │
│ QR embeddable in PDF           │
└────────────┬───────────────────┘
             │
FINAL: Credential Complete
┌────────────────────────────────┐
│ ✅ Credential is now:          │
│ • Anchored on blockchain       │
│ • Indexed for fast queries     │
│ • Cached for performance       │
│ • Shareable via QR             │
│ • Verifiable by anyone         │
│ • Revocable by issuer          │
└────────────────────────────────┘
```

---

## 4. Verification Dataflow (Public Verifier)

### How Employers/Anyone Verify

```
┌──────────────────────────────────────┐
│ Verifier (Employer) receives QR      │
│ Embedded in PDF or email             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Scans QR with phone camera           │
│ OR clicks email link                 │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Browser opens URL:                   │
│ schema.scholar-ledger.io/verify?     │
│   hash=0xABC123...&                  │
│   issuer=0xDEF...&                   │
│   student=0xGHI...                   │
│                                      │
│ ⚠️ NO WALLET REQUIRED               │
│ ⚠️ NO ACCOUNT NEEDED                │
│ ⚠️ NO SIGNUP                        │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend: PublicVerify.jsx loads     │
│ Parses URL parameters                │
│ • credentialHash: 0xABC123...        │
│ • issuerAddress: 0xDEF...            │
│ • studentAddress: 0xGHI...           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Simultaneous queries:                │
│                                      │
│ Query 1: The Graph Subgraph          │
│ ─────────────────────────────────    │
│ query {                              │
│   credential(id: "0xABC123...") {    │
│     id                               │
│     issuer { id, name }              │
│     student { id }                   │
│     createdAt                        │
│     revoked                          │
│     document { ipfsHash }            │
│   }                                  │
│ }                                    │
│                                      │
│ Query 2: IPFS Gateway                │
│ ─────────────────────────────────    │
│ GET https://gateway.pinata.cloud/    │
│     ipfs/QmXxxx...                   │
│ Returns PDF binary                   │
└────────────┬─────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌────────────┐    ┌────────────┐
│ Graph Data │    │ PDF File   │
│            │    │            │
│ Status:    │    │ SHA-256:   │
│ Active     │    │ 0xABC123.. │
│ Not Revoked│    │ Size: 2.5MB│
│ Issued: Y1 │    │ Type: PDF  │
└────────────┘    └────────────┘
    │                 │
    └────────┬────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Frontend Verification Logic:         │
│                                      │
│ 1. Check credential status on chain  │
│    ✅ Exists: Yes                    │
│    ✅ Revoked: No                    │
│    ✅ Valid issuer: Yes              │
│                                      │
│ 2. Download PDF & compute hash       │
│    ✅ File retrieved                 │
│    ✅ SHA-256 computed               │
│                                      │
│ 3. Compare hashes                    │
│    Chain hash:     0xABC123...       │
│    Computed hash:  0xABC123...       │
│    ✅ MATCH!                         │
│                                      │
│ 4. Verify issuer:                    │
│    Issuer: 0xDEF789...               │
│    Registered: Yes                   │
│    Accredited: Yes                   │
│                                      │
│ 5. Display result                    │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Display Verification Result          │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ ✅ AUTHENTIC                   │  │
│ ├────────────────────────────────┤  │
│ │ Credential: BSc Computer Sci   │  │
│ │ Student: Alice Smith           │  │
│ │ Issuer: University of Example  │  │
│ │ Issued: May 12, 2026           │  │
│ │ Status: Active (not revoked)   │  │
│ │                                │  │
│ │ [🔗 View Full Credential]      │  │
│ │ [📥 Download Proof]            │  │
│ │ [🔄 Share Result]              │  │
│ └────────────────────────────────┘  │
│                                      │
│ Verifier can now:                   │
│ • Screenshot/PDF for records        │
│ • Share link with third parties     │
│ • Proceed with hiring/admissions    │
└──────────────────────────────────────┘
```

---

## 5. Database & Storage Schema

### PostgreSQL Cache Structure

```
credentials
├── id (UUID, PK)
├── credential_hash (VARCHAR 66, UNIQUE, INDEX)
├── issuer_address (VARCHAR 42, INDEX)
├── student_address (VARCHAR 42, INDEX)
├── credential_type (VARCHAR 100)
├── issued_date (TIMESTAMP, INDEX)
├── expiration_date (TIMESTAMP, NULL)
├── is_revoked (BOOLEAN, DEFAULT false)
├── revoked_at (TIMESTAMP, NULL)
├── block_number (BIGINT, INDEX)
├── transaction_hash (VARCHAR 66)
├── created_at (TIMESTAMP, DEFAULT now())
├── updated_at (TIMESTAMP, DEFAULT now())

credentials_metadata
├── id (UUID, PK, FK credentials.id)
├── ipfs_hash (VARCHAR 59)
├── document_filename (VARCHAR 255)
├── document_size (BIGINT)
├── gpa (DECIMAL(3,2), NULL)
├── field_of_study (VARCHAR 100, NULL)
├── honors (VARCHAR 100, NULL)
├── additional_data (JSONB, NULL)

student_profiles
├── id (UUID, PK)
├── student_address (VARCHAR 42, UNIQUE, INDEX)
├── display_name (VARCHAR 255)
├── bio (TEXT, NULL)
├── email (VARCHAR 255, UNIQUE, INDEX)
├── profile_image_ipfs (VARCHAR 59, NULL)
├── social_links (JSONB)
├── is_public (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)

issuers
├── id (UUID, PK)
├── issuer_address (VARCHAR 42, UNIQUE, INDEX)
├── university_name (VARCHAR 255)
├── country (VARCHAR 2)
├── is_verified (BOOLEAN, INDEX)
├── verification_date (TIMESTAMP, NULL)
├── created_at (TIMESTAMP)

email_logs
├── id (UUID, PK)
├── recipient_email (VARCHAR 255, INDEX)
├── recipient_address (VARCHAR 42, INDEX)
├── email_type (VARCHAR 50)
├── subject (VARCHAR 255)
├── status (VARCHAR 20) // sent, failed, bounced
├── resend_message_id (VARCHAR 100)
├── created_at (TIMESTAMP, INDEX)
├── sent_at (TIMESTAMP, NULL)
```

### IPFS Storage Structure

```
IPFS
├── QmXxxx... (Degree PDF)
│   ├── Type: application/pdf
│   ├── Size: 2.5 MB
│   ├── Date Added: 2026-05-12T10:30:00Z
│   ├── Pinned By: Pinata
│   └── Retrievable: ✅ Yes
│
├── QmYyyy... (Student Profile JSON)
│   ├── Content:
│   │  {
│   │    "name": "Alice Smith",
│   │    "bio": "CS Student",
│   │    "credentials": [...],
│   │    "email": "alice@example.com"
│   │  }
│   └── Size: 5 KB
│
└── QmZzzz... (Profile Avatar)
    ├── Type: image/jpeg
    └── Size: 150 KB
```

---

## 6. Smart Contract State Diagram

### ScholarLedger.sol State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    CONTRACT DEPLOYMENT                  │
│  • Constructor runs                                      │
│  • Owner set to deployer                                │
│  • Issuers initialized (empty)                          │
│  • Credentials storage created (empty)                  │
│  • Events logging ready                                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         ISSUER REGISTRATION (onlyOwner)                 │
│                                                         │
│  registerIssuer(address issuerAddr)                     │
│  • Verify caller is owner                               │
│  • Add issuerAddr to authorizedIssuers[]                │
│  • Emit IssuuerRegistered event                         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         READY FOR CREDENTIAL OPERATIONS                 │
│                                                         │
│  Now issuer can:                                        │
│  • Issue credentials                                    │
│  • Revoke credentials                                   │
│  • Check status                                         │
└────────┬──────────────┬──────────────┬─────────────────┘
         │              │              │
         ▼              ▼              ▼
    ISSUE       REVOKE         VERIFY
    ┌──────┐  ┌────────┐    ┌─────────┐
    │      │  │        │    │         │
    └───┬──┘  └────┬───┘    └────┬────┘
        │          │             │
        ▼          ▼             ▼
    ISSUED    REVOKED       VERIFIED
    STATE     STATE         (read-only)
    
┌─────────────────────────────────────────────────────────┐
│              CREDENTIAL LIFECYCLE                       │
│                                                         │
│ 1. UNISSUED (default)                                   │
│    • No entry in credentials mapping                    │
│    • Verify returns (false, 0x0, 0, false)             │
│                                                         │
│ 2. ACTIVE (after issueCredential)                       │
│    • credentials[hash] = {                              │
│        issuer: address,                                 │
│        student: address,                                │
│        timestamp: uint256,                              │
│        revoked: false                                   │
│      }                                                  │
│    • Verify returns (true, issuer, timestamp, false)   │
│    • CredentialIssued event emitted                     │
│                                                         │
│ 3. REVOKED (after revokeCredential)                     │
│    • credentials[hash].revoked = true                   │
│    • Verify returns (true, issuer, timestamp, true)    │
│    • CredentialRevoked event emitted                    │
│    • ⚠️ Cannot be reissued                             │
│                                                         │
│ 4. PERMANENT                                            │
│    • State is immutable on blockchain                   │
│    • History visible forever                           │
│    • Transparent audit trail                           │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Authorization & Access Control

### Role-Based Access Matrix

```
┌─────────────────────────────────────────────────────────┐
│                   ACCESS CONTROL                        │
├─────────────────────────────────────────────────────────┤
│ Resource           │ Admin │ Student │ Verifier │ Public│
├────────────────────┼───────┼─────────┼──────────┼───────┤
│ Issue Credential   │  ✅   │    ❌   │    ❌    │  ❌   │
│ Revoke Credential  │  ✅   │    ❌   │    ❌    │  ❌   │
│ View Own Creds     │  ✅*  │   ✅    │    ❌    │  ❌   │
│ View All Creds     │  ✅   │    ❌   │    ❌    │  ❌   │
│ Download PDF       │  ✅   │   ✅    │   ⚠️1   │  ❌   │
│ Share QR           │  ✅   │   ✅    │    N/A   │  ❌   │
│ Verify (by hash)   │  ✅   │   ✅    │   ✅     │  ✅   │
│ View Public Prof   │  ✅   │   ✅    │   ✅     │  ✅2  │
│ Update Profile     │  ❌3  │   ✅    │    ❌    │  ❌   │
│ Register as Issuer │  ✅   │    ❌   │    ❌    │  ❌   │
│ See Analytics      │  ✅   │    ❌   │    ❌    │  ❌   │
│                    │       │         │          │       │
└────────────────────┴───────┴─────────┴──────────┴───────┘

¹ If owner = student (via signature verification)
² If student profile set to public
³ Admin can't edit student profile; only issuer admin

Auth Methods:
┌──────────────────────────────────────────┐
│ Role         │ Auth Method              │
├──────────────┼──────────────────────────┤
│ Admin        │ MetaMask wallet signature│
│ Student      │ MetaMask signature       │
│              │ (future: Account Abst.)  │
│ Verifier     │ No auth; public read     │
│ Public       │ No auth; read-only       │
└──────────────┴──────────────────────────┘
```

---

## 8. Error Handling & Recovery

### System Failure Scenarios

```
┌─────────────────────────────────────────────────────────┐
│ FAILURE SCENARIO 1: IPFS Upload Fails                   │
├─────────────────────────────────────────────────────────┤
│ Condition: Pinata API returns error                     │
│                                                         │
│ Flow:                                                   │
│ Admin uploads PDF → Backend calls Pinata               │
│ Pinata returns 403 Unauthorized                         │
│                                                         │
│ Response to Frontend:                                  │
│ {                                                       │
│   "error": "IPFS_UPLOAD_FAILED",                        │
│   "message": "Pinata API key invalid",                  │
│   "action": "Check .env PINATA_API_KEY"                │
│ }                                                       │
│                                                         │
│ Recovery:                                              │
│ 1. Check Pinata credentials                            │
│ 2. Verify API key has pin permissions                  │
│ 3. Try upload again                                    │
│ 4. Fallback: Use Web3.Storage                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FAILURE SCENARIO 2: Transaction Rejected                │
├─────────────────────────────────────────────────────────┤
│ Condition: MetaMask denies signature / tx fails         │
│                                                         │
│ Causes:                                                │
│ • User cancels MetaMask pop-up                         │
│ • Insufficient gas                                     │
│ • Student address not valid                            │
│ • Issuer not registered                                │
│                                                         │
│ Frontend handles:                                      │
│ try {                                                  │
│   const tx = await contract.issueCredential(...)       │
│ } catch (error) {                                       │
│   if (error.code === "ACTION_REJECTED")                │
│     toast.error("You rejected the transaction")        │
│   else if (error.reason.includes("not issuer"))        │
│     toast.error("Your address is not registered")      │
│   else                                                 │
│     toast.error(error.reason)                          │
│ }                                                       │
│                                                         │
│ Recovery:                                              │
│ 1. Check MetaMask network & chain ID                   │
│ 2. Ensure account has > 0.01 ETH                       │
│ 3. Verify student address (0x...)                      │
│ 4. Retry transaction                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FAILURE SCENARIO 3: Backend Timeout                     │
├─────────────────────────────────────────────────────────┤
│ Condition: The Graph query takes >30s                   │
│                                                         │
│ Symptoms:                                              │
│ Frontend hangs on verify page                          │
│ No credentials load                                    │
│                                                         │
│ Backend mitigation:                                    │
│ 1. Cache credentials in PostgreSQL                     │
│ 2. Return cached data if Graph unavailable            │
│ 3. Set query timeout: 10s                              │
│ 4. Log slow queries to monitoring                      │
│                                                         │
│ Recovery:                                              │
│ 1. Check The Graph service status                      │
│ 2. Verify database connection                          │
│ 3. Restart backend service                             │
│ 4. Rebuild subgraph if corrupted                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FAILURE SCENARIO 4: RPC Endpoint Down                   │
├─────────────────────────────────────────────────────────┤
│ Condition: Polygon RPC unreachable                      │
│                                                         │
│ Symptoms:                                              │
│ MetaMask error: "Network request failed"               │
│ Backend can't connect to blockchain                    │
│                                                         │
│ Mitigation:                                            │
│ 1. Multi-RPC fallback in ethers.js                     │
│    FallbackProvider([                                  │
│      { provider: rpc1, priority: 1, weight: 2 },       │
│      { provider: rpc2, priority: 2, weight: 1 }        │
│    ])                                                  │
│                                                         │
│ 2. Use multiple RPC providers:                         │
│    • Alchemy                                           │
│    • Infura                                            │
│    • Polygon public                                    │
│                                                         │
│ Recovery:                                              │
│ 1. Switch network in MetaMask settings                 │
│ 2. Update RPC_URL env var                              │
│ 3. Restart backend                                     │
│ 4. Reload frontend                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Performance & Scalability

### Query Optimization & Caching

```
┌─────────────────────────────────────────────────────────┐
│               READ PERFORMANCE LAYERS                   │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Frontend Cache (React Context)                 │
│ • In-memory credential data                            │
│ • TTL: 5 minutes                                       │
│ • Hit rate: ~80% for repeat users                      │
│                                                         │
│ Layer 2: API Rate Cache (Fastify)                      │
│ • HTTP caching headers (ETag, Cache-Control)          │
│ • Browser/CDN cache                                    │
│ • TTL: 10 minutes                                      │
│                                                         │
│ Layer 3: Database Cache (PostgreSQL)                   │
│ • Indexed queries on credential_hash, issuer, student │
│ • Query: SELECT * FROM credentials WHERE hash = $1    │
│ • Time: <50ms avg for 100K records                     │
│                                                         │
│ Layer 4: The Graph Indexing                            │
│ • Subgraph pre-indexes all events                      │
│ • GraphQL queries on indexed fields <100ms             │
│ • Supports complex filters: issuer + student + date    │
│                                                         │
│ Layer 5: Blockchain (slowest)                          │
│ • Only used if absolutely necessary                    │
│ • Direct RPC read for real-time verification           │
│ • Time: 500ms-2s depending on RPC load                 │
│                                                         │
│ Query Flow for Verification:                           │
│ Client Query                                           │
│   ↓                                                    │
│   ├─→ Frontend Cache?     [Cache Hit → Return 5ms]    │
│   │                                                    │
│   ├─→ API Cache?          [Hit → Return 50ms]         │
│   │                                                    │
│   ├─→ PostgreSQL Query?   [Hit → Return 100ms]        │
│   │                                                    │
│   ├─→ The Graph Query?    [Hit → Return 200ms]        │
│   │                                                    │
│   └─→ Direct RPC Call     [Last resort → 1000ms]      │
│                                                         │
│ Result: P99 latency = 200ms for most queries          │
└─────────────────────────────────────────────────────────┘

Batch Verification Optimization:
┌─────────────────────────────────────────┐
│ Verify 1000 credentials                 │
│ • Without batching: 1000 × 100ms = 100s │
│ • With batching:                        │
│   - Batch size 50                       │
│   - 20 parallel batches                 │
│   - Time: ~5s total                     │
│   - Speedup: 20x                        │
└─────────────────────────────────────────┘
```

---

## 10. Security Data Flow

### How Private Data is Protected

```
┌─────────────────────────────────────────────────────────┐
│                  DATA CLASSIFICATION                    │
├─────────────────────────────────────────────────────────┤
│ Category        │ Storage      │ Visibility             │
├─────────────────┼──────────────┼────────────────────────┤
│ Public:         │              │                        │
│ • Hash          │ Blockchain   │ Public (verified by   │
│ • Issuer addr   │ The Graph    │ anyone)               │
│ • Student addr  │ PostgreSQL   │                        │
│                 │              │                        │
│ Semi-Private:   │              │                        │
│ • Credential    │ PostgreSQL   │ Issuer + Student only │
│   type          │ The Graph    │ (via auth)            │
│ • Issued date   │              │                        │
│                 │              │                        │
│ Private:        │              │                        │
│ • Full name     │ PostgreSQL   │ Student + Admin only  │
│ • Email         │ Backend app  │ (encrypted)           │
│ • GPA           │              │                        │
│ • Additional    │              │                        │
│   metadata      │              │                        │
│                 │              │                        │
│ Encrypted:      │              │                        │
│ • Student PII   │ Database     │ Always encrypted at   │
│ • Signatures    │              │ rest & in transit     │
└─────────────────┴──────────────┴────────────────────────┘

Data Flow for Private Information:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│ Private Data Entry (Admin/Student)                     │
│   ↓ (HTTPS only, TLS 1.3)                              │
│ Frontend (React)                                       │
│   ↓ (Encrypted in memory)                              │
│ Backend API (Fastify)                                  │
│   ↓ (Decrypt, validate, re-encrypt)                    │
│ Database (PostgreSQL)                                  │
│   ├─ Column-level encryption: pgcrypto               │
│   ├─ Key stored: Hardware Security Module              │
│   └─ Backups: Encrypted snapshots only                 │
│                                                         │
│ Private Data Retrieval (Owner only)                    │
│ ├─ Student: Must sign with wallet (proves ownership)  │
│ ├─ Backend: Verifies signature                        │
│ ├─ Backend: Decrypts data                             │
│ ├─ Backend: Returns via HTTPS                         │
│ ├─ Frontend: Decrypts in memory                       │
│ └─ Display: Only in secured component                │
│                                                         │
│ Private Data NOT on Blockchain                        │
│ • Hashes allow verification without exposing PII      │
│ • IPFS links don't contain student data               │
│ • Only anonymized metrics indexed                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Deployment Architecture

### Production Topology

```
┌─────────────────────────────────────────────────────────┐
│                   USERS / INTERNET                      │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌──────────┐
   │Admins   │  │Students │  │Verifiers │
   │+        │  │+        │  │(Public)  │
   │Employees│  │Employers│  │          │
   └────┬────┘  └────┬────┘  └─────┬────┘
        │            │             │
        └────────────┼─────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  CloudFlare CDN        │
        │  • DDoS Protection     │
        │  • Edge Caching        │
        │  • Global Distribution │
        └────────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │Frontend│  │Backend  │  │ Static   │
    │App     │  │API      │  │ Site     │
    │(React) │  │(Fastify)│  │          │
    └────┬───┘  └────┬────┘  └──────────┘
         │           │
         │           ▼
         │      ┌──────────────────┐
         │      │  Load Balancer   │
         │      │  (Nginx/HAProxy) │
         │      └────────┬─────────┘
         │               │
         │        ┌──────┴──────┐
         │        ▼             ▼
         │    ┌────────┐   ┌────────┐
         │    │Backend │   │Backend │
         │    │Pod 1   │   │Pod 2   │
         │    └────┬───┘   └────┬───┘
         │         │            │
         │         ▼            ▼
         │    ┌────────────────────┐
         │    │  PostgreSQL        │
         │    │  Replica Set       │
         │    │  (Primary + 2x     │
         │    │   Standby)         │
         │    └────────────────────┘
         │
         ▼
    ┌──────────────┐
    │ Polygon L2   │
    │ (Public RPC) │
    │ • Alchemy    │
    │ • Infura     │
    │ • Backup RPC │
    └──────────────┘
         ▲
         │
    ┌────────────────────────────────┐
    │  Smart Contracts               │
    │ • ScholarLedger.sol            │
    │ • IssuerRegistry.sol           │
    │ • StudentProfileRegistry.sol   │
    │ • AccreditationRegistry.sol    │
    └────────────────────────────────┘

Storage Layer:
┌─────────────────────────────────────┐
│  IPFS via Pinata (Production)       │
│  • Redundant pinning nodes          │
│  • Geographic distribution          │
│  • Automatic replication            │
│  • Backup: Web3.Storage              │
└─────────────────────────────────────┘

Monitoring & Observability:
┌─────────────────────────────────────┐
│  Prometheus + Grafana               │
│  • API latency metrics              │
│  • Database query times             │
│  • Blockchain RPC health            │
│  • Error rates & traces             │
└─────────────────────────────────────┘

Logging:
┌─────────────────────────────────────┐
│  ELK Stack / Datadog                │
│  • Application logs                 │
│  • Smart contract events            │
│  • User activity audit trail        │
└─────────────────────────────────────┘
```

---

## 12. Event-Driven Architecture

### Blockchain Events & Processing

```
Blockchain Events Flow:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│ Smart Contract emits:                                  │
│                                                         │
│ event CredentialIssued(                                │
│   indexed issuer,                                      │
│   indexed student,                                     │
│   bytes32 hash,                                        │
│   uint256 timestamp                                    │
│ )                                                       │
│                                                         │
│ event CredentialRevoked(                               │
│   bytes32 indexed hash,                                │
│   uint256 timestamp                                    │
│ )                                                       │
│                                                         │
│ event IssuerRegistered(                                │
│   indexed issuer,                                      │
│   string name                                          │
│ )                                                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │  The Graph Subgraph  │
        │  • Listens for events│
        │  • Parses data       │
        │  • Updates entities  │
        │  • Regenerates index │
        └──────────┬───────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
  ┌─────────┐ ┌────────┐ ┌──────────┐
  │ Create  │ │ Update │ │ Rollback │
  │ Record  │ │ Entity │ │ on Error │
  └────┬────┘ └────┬───┘ └──────────┘
       │           │
       └─────┬─────┘
             │
             ▼
       ┌──────────────┐
       │  GraphQL DB  │
       │  (Apollo)    │
       └──────┬───────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────────┐  ┌────────────────┐
│ Cache in    │  │ Query endpoint │
│ PostgreSQL  │  │ for clients    │
│             │  │                │
│ Async sync  │  │ Real-time      │
│ every 10min │  │ GraphQL API    │
└─────────────┘  └────────┬───────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
                ▼         ▼         ▼
            ┌───────┐ ┌───────┐ ┌───────┐
            │ Client│ │Backend│ │ Indexer
            │ Query │ │ API   │ │ Service
            └───────┘ └───────┘ └───────┘

Backend Event Listeners:
┌─────────────────────────────────────────────────────────┐
│ Backend subscribes to:                                  │
│                                                         │
│ 1. CredentialIssued events                             │
│    → Trigger email notification                        │
│    → Update student dashboard                          │
│    → Log analytics                                     │
│                                                         │
│ 2. CredentialRevoked events                            │
│    → Send revocation email                             │
│    → Remove from dashboards                            │
│    → Alert issuer                                      │
│                                                         │
│ 3. IssuerRegistered events                             │
│    → Cache issuer info                                 │
│    → Verify signatures                                 │
│    → Update UI lists                                   │
│                                                         │
│ Implementation:                                        │
│ const contract = new ethers.Contract(addr, abi, rpc)  │
│ contract.on('CredentialIssued', async (issuer, ...) {  │
│   await sendEmail(student, ...)                        │
│   await updateDatabase(...)                            │
│   await publishNotification(...)                       │
│ })                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**End of Architecture & Dataflow Diagrams Document**

This document provides comprehensive visual representations of Scholar Ledger's system design, data flows, and operational patterns for developers, stakeholders, and maintenance teams.
