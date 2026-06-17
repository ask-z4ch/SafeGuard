# Safeguard — Decentralized Digital Identity & Emergency Response Platform

> Full-stack traveller identity & SOS platform with blockchain-anchored W3C Verifiable Credentials, AES-256-GCM encrypted documents, real-time emergency alerts via Socket.IO, and a native Android APK (Capacitor). Built with React, Express, MongoDB, Solidity, and Veramo.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20MongoDB%20%7C%20Ethereum-purple)

A full-stack platform that empowers travellers with a self-sovereign digital identity anchored on blockchain and a real-time emergency (SOS) alert system for command-and-control centers. Built with **W3C Verifiable Credentials**, **Ethereum smart contracts**, and **real-time WebSocket communication**.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [User Journey](#user-journey)
  - [Admin Journey](#admin-journey)
  - [Blockchain Anchoring Flow](#blockchain-anchoring-flow)
  - [Real-time SOS Flow](#real-time-sos-flow)
- [Smart Contract](#smart-contract)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Police Training Module](#police-training-module)
- [Security Considerations](#security-considerations)
- [Roadmap](#roadmap)

---

## The Problem

Travellers in unfamiliar regions face two critical challenges:

1. **Identity verification is fragmented and insecure** — Physical documents can be lost, forged, or tampered with. There is no standardized, tamper-proof way for authorities to verify a traveller's identity across jurisdictions.

2. **Emergency response is slow and uncoordinated** — When a traveller faces danger (medical emergency, robbery, lost in an unfamiliar area), there is no streamlined channel to alert authorities with their identity, location context, or supporting evidence like voice notes or ID documents.

Existing solutions are centralized, creating single points of failure, data privacy risks, and cross-border interoperability issues.

---

## The Solution

**Safeguard** addresses both challenges through a unified platform that combines:

- **Self-Sovereign Identity (SSI)** — Travellers register, verify their email, upload encrypted government IDs, and receive **W3C Verifiable Credentials** that are cryptographically signed and anchored on the Ethereum blockchain for tamper-evident verification.
- **Real-Time Emergency Alerting** — Travellers can send SOS alerts with preset or custom messages and optional voice recordings. These alerts are instantly broadcast to an admin command center via Socket.IO, along with the traveller's profile, uploaded documents, and issued credentials.
- **Blockchain-Verified Integrity** — Every issued credential's SHA-256 hash is stored on-chain via a minimal Solidity smart contract. Any party can independently verify that a credential existed at a given point in time without relying on Safeguard's servers.
- **Police Training Module** — A Unity WebGL-based training simulation embedded in the admin dashboard for officer preparedness.

---

## Architecture Overview

```
┌─────────────────────┐          ┌──────────────────────┐
│   User Frontend     │          │   Admin Frontend      │
│   (React 19, CRA)   │          │   (React 19, CRA)     │
│                     │          │                        │
│  ┌───────────────┐  │          │  ┌────────────────┐   │
│  │ Auth (JWT)    │  │          │  │ SOS Live Feed   │   │
│  │ Document      │  │ REST     │  │ (Socket.IO)     │   │
│  │ Upload        │──┼──────────┼──│ VC Issuance     │   │
│  │ SOS Dispatch  │  │          │  │ Hash Verification│   │
│  │ Audio Record  │  │          │  │ Training Module  │   │
│  └───────────────┘  │          │  └────────────────┘   │
└─────────────────────┘          └──────────────────────┘
         │                              │
         │         HTTP / WS            │
         ▼                              ▼
   ┌───────────────────────────────────────────┐
   │          Express API Server (:4000)         │
   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ │
   │  │Auth  │ │User  │ │Admin │ │Socket.IO │ │
   │  │Routes│ │Routes│ │Routes│ │(admins   │ │
   │  │      │ │      │ │      │ │ room)    │ │
   │  └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘ │
   │     │         │         │          │       │
   │     ▼         ▼         ▼          ▼       │
   │  ┌──────┐ ┌──────┐ ┌──────────┐ ┌───────┐ │
   │  │Veramo│ │File  │ │Blockchain│ │Email  │ │
   │  │Serv. │ │Serv. │ │Service   │ │Serv.  │ │
   │  └──┬───┘ └──┬───┘ └────┬─────┘ └──┬────┘ │
   └─────┼────────┼──────────┼───────────┼──────┘
         │        │          │           │
         ▼        ▼          ▼           ▼
   ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐
   │MongoDB │ │Uploads │ │Hardhat   │ │SMTP    │
   │        │ │(AES-256│ │Node      │ │Server  │
   │ Users  │ │ -GCM)  │ │(:8545)   │ │        │
   │ VCs    │ │ Audio  │ │Identity  │ │        │
   │ SOS    │ │        │ │Anchor    │ │        │
   └────────┘ └────────┘ └──────────┘ └────────┘
```

**Key Architectural Decisions:**

- **Child process blockchain interaction** — The API server spawns `storeHash.js`/`checkHash.js` via Node.js `child_process` rather than importing ethers directly. This decouples the blockchain toolchain (Hardhat, Solidity, ethers v6) from the server's dependency tree, allowing independent versioning and failure isolation.
- **AES-256-GCM encryption at rest** — All uploaded ID documents are encrypted before being written to disk. The encryption key is derived from `VERAMO_SECRET` via SHA-256. The IV and auth tag are stored alongside the document metadata in MongoDB, so decryption is only possible by the admin API.
- **Memory-based Veramo agent** — The Veramo DID/VC agent uses in-memory key and DID stores. This simplifies deployment (no additional database) at the trade-off of losing the issuer DID on server restart (a new `did:key` is created each time).
- **Socket.IO with JWT auth** — WebSocket connections authenticate using the same JWT as REST endpoints. Admin users are automatically placed in the `admins` room, receiving real-time SOS broadcasts.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework (both admin & user apps) |
| **React Router DOM 6** | Client-side routing |
| **Create React App** | Build tooling & dev server |
| **Axios** | HTTP client with JWT interceptor |
| **Socket.IO Client** | Real-time SOS feed |
| **date-fns** | Relative time formatting |
| **MediaRecorder API** | In-browser voice recording |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express 5** | HTTP server & routing |
| **Mongoose 8** | MongoDB ODM |
| **Socket.IO 4** | WebSocket real-time communication |
| **Multer** | Multipart file upload handling |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT issuance & verification |
| **Nodemailer** | Email verification transport |
| **crypto (Node.js)** | AES-256-GCM encryption & SHA-256 hashing |

### Blockchain & Decentralized Identity
| Technology | Purpose |
|---|---|
| **Solidity 0.8.20** | Smart contract language |
| **Hardhat 2.22** | Ethereum development environment |
| **ethers v6** | Blockchain interaction in scripts |
| **Veramo v6** | W3C DID & Verifiable Credential framework |
| **@veramo/credential-w3c** | VC issuance with JWT proof |
| **@veramo/did-provider-key** | `did:key` method support |
| **did-resolver** | DID resolution |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB** | Primary data store |
| **Mongoose** | Schema modeling & validation |

### Other
| Technology | Purpose |
|---|---|
| **Unity WebGL** | Police training simulation game |
| **WebAssembly (Brotli)** | Unity build distribution |

---

## Key Features

### ✅ Digital Identity Management
- **Registration & Email Verification** — Users sign up with name/email/password. A verification email with a 24-hour token ensures identity ownership.
- **Government ID Upload** — Users upload Aadhar or Passport documents (images or PDFs). Files are **AES-256-GCM encrypted** at rest.
- **JWT Authentication** — 1-hour expiry tokens with role-based claims (user/admin). Tokens are stored in `localStorage` and auto-attached via Axios interceptors.
- **Profile Dashboard** — Consolidated view of verification status, uploaded documents, and issued credentials.

### ✅ W3C Verifiable Credentials (VCs)
- **`did:key` Issuer** — Veramo agent creates a `did:key` identifier for the issuance authority.
- **`TouristCredential`** — Custom VC type with credential subject containing name, trip ID, and visit period. JWT proof format.
- **SHA-256 Hash Anchoring** — Every issued VC is serialized, hashed, and the hash is stored on-chain via the `IdentityAnchor` contract.
- **On-Chain Verification** — Any party can check whether a credential hash exists on-chain, providing cryptographic proof of issuance timestamp and integrity.

### ✅ Real-Time SOS Emergency Alerts
- **Preset & Custom Messages** — Choose from preset emergencies (medical, lost, robbery, fire) or write a custom 240-character message.
- **Voice Recording** — In-browser `MediaRecorder` API captures audio which is uploaded alongside the SOS.
- **Socket.IO Live Broadcast** — SOS events are instantly pushed to the `admins` room, including user profile, document URLs, and latest credential info.
- **Admin Response Actions** — From the SOS feed, admins can mark users verified, issue VCs, and check credential hashes on-chain — all without leaving the feed.

### ✅ Admin Command Center
- **Live SOS Feed Table** — Sorted by recency, with per-row user info, message, audio playback, verification status, and credential details.
- **VC JSON Expander** — Expand/collapse full VC JSON inline for inspection.
- **On-Chain Hash Lookup** — One-click verification that a credential hash exists on the blockchain.
- **Secure Document Streaming** — Admins can view decrypted ID documents in-browser (the server decrypts on-the-fly).

### ✅ Police Training Module
- **Unity WebGL Game** — Embedded in the admin dashboard as an `<iframe>`. Toggle visibility on demand.
- **Fullscreen Support** — Native Unity fullscreen API integration.

---

## Project Structure

```
safeguard-proto/
├── README.md
├── .env.example
│
├── backend/
│   ├── chain/                          # Hardhat blockchain layer
│   │   ├── contracts/
│   │   │   └── IdentityAnchor.sol      # Minimal hash registry
│   │   ├── scripts/
│   │   │   ├── deploy.js               # Compile & deploy contract
│   │   │   ├── storeHash.js            # CLI: store hash on-chain
│   │   │   └── checkHash.js            # CLI: check hash existence
│   │   ├── deployments/
│   │   │   └── IdentityAnchor.*.json   # Deployed address + ABI
│   │   ├── hardhat.config.js           # Solidity 0.8.20, localhost
│   │   └── package.json
│   │
│   ├── server/                         # Express API server
│   │   ├── src/
│   │   │   ├── index.js                # Entry: HTTP + Socket.IO + DB
│   │   │   ├── app.js                  # Express app setup
│   │   │   ├── config/
│   │   │   │   ├── db.js               # MongoDB connection
│   │   │   │   ├── email.js            # Nodemailer transporter
│   │   │   │   └── veramo.js           # Veramo agent config
│   │   │   ├── models/
│   │   │   │   ├── User.js             # User schema + ID documents
│   │   │   │   ├── VCRecord.js         # VC record with hash + tx
│   │   │   │   └── SOSRecord.js        # SOS alert schema
│   │   │   ├── middleware/
│   │   │   │   ├── authMiddleware.js   # JWT + role middleware
│   │   │   │   └── errorHandler.js     # Global error handler
│   │   │   ├── routes/
│   │   │   │   ├── authRoutes.js       # /api/auth/*
│   │   │   │   ├── userRoutes.js       # /api/user/*
│   │   │   │   ├── adminRoutes.js      # /api/admin/*
│   │   │   │   └── sosRoutes.js        # /api/sos
│   │   │   ├── controllers/
│   │   │   │   ├── authController.js
│   │   │   │   ├── userController.js
│   │   │   │   ├── adminController.js
│   │   │   │   └── sosController.js
│   │   │   └── services/
│   │   │       ├── blockchainService.js # Child process spawner
│   │   │       ├── emailService.js      # Verification emails
│   │   │       ├── fileService.js       # AES encrypt/decrypt + audio
│   │   │       ├── socketService.js     # Socket.IO init + JWT auth
│   │   │       └── veramoService.js     # VC issuance logic
│   │   ├── uploads/                    # Encrypted files + audio (gitignored)
│   │   └── .env.example
│   │
│   ├── frontend-admin/                 # Admin dashboard (React 19)
│   │   ├── src/
│   │   │   ├── App.js
│   │   │   ├── api/client.js           # Axios with admin JWT
│   │   │   ├── context/AuthContext.js
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── DashboardPage.jsx   # SOS feed + actions
│   │   │   └── components/
│   │   │       ├── Layout.jsx
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── TrainingModule.jsx  # Unity game embed
│   │   ├── public/
│   │   │   └── training-game/          # Unity WebGL build
│   │   └── .env
│   │
│   └── frontend-user/                  # User portal (React 19)
│       ├── src/
│       │   ├── App.js
│       │   ├── api/client.js           # Axios with user JWT
│       │   ├── context/AuthContext.js
│       │   ├── pages/
│       │   │   ├── RegisterPage.jsx
│       │   │   ├── VerifyPage.jsx
│       │   │   ├── LoginPage.jsx
│       │   │   ├── UploadIdPage.jsx
│       │   │   └── DashboardPage.jsx   # Profile + SOS dispatch
│       │   └── components/
│       │       ├── AudioRecorder.jsx
│       │       ├── DocumentCard.jsx
│       │       ├── Layout.jsx
│       │       └── ProtectedRoute.jsx
│       └── .env
│
└── Police Module/                      # Standalone Unity WebGL build
    ├── index.html
    ├── Build/
    └── TemplateData/
```

---

## How It Works

### User Journey

```
1. Register ──> 2. Verify Email ──> 3. Upload ID ──> 4. Admin Verifies ──> 5. VC Issued
                                                                                │
                                                                          Hash anchored
                                                                          on blockchain
                                                                                │
                                                                         6. Send SOS
                                                                        (with voice)
```

1. **Register** — User creates an account with name, email, and password. Password is hashed with bcrypt (10 rounds). A SHA-256 verification token is generated and stored.
2. **Verify Email** — A verification link is sent via Nodemailer. Clicking the link sends the raw token to the server, which hashes it and matches against the stored hash (token is never stored in plaintext).
3. **Upload ID** — User uploads a government ID document (Aadhar or Passport). The file buffer is encrypted with AES-256-GCM using a key derived from `VERAMO_SECRET`. The random IV and authentication tag are stored alongside document metadata in MongoDB.
4. **Admin Verification** — An admin reviews the uploaded document (decrypted on-the-fly via the streaming endpoint) and marks the user as verified.
5. **VC Issuance** — The admin issues a `TouristCredential` (W3C Verifiable Credential) to the user. The credential is signed with JWT proof format using the Veramo agent's `did:key`. The full credential JSON is SHA-256 hashed, and the hash is stored on-chain via `IdentityAnchor.store()`. The credential record (hash, transactionHash, issuer DID, full VC JSON) is saved in MongoDB.
6. **Send SOS** — The user can send an emergency alert at any time with a preset or custom message, optionally including a voice recording captured via the browser's `MediaRecorder` API.

### Admin Journey

```
1. Login ──> 2. Live SOS Feed ──> 3. Review User ──> 4. Verify ──> 5. Issue VC
                    │                                        │
              Socket.IO real-time                      Hash anchored on-chain
              updates from field                       
```

1. **Login** — Admin logs in with email/password. Server validates `role === 'admin'`. JWT issued.
2. **Live SOS Feed** — Admin dashboard polls `GET /api/admin/sos` for existing records and opens a Socket.IO connection for real-time updates. New SOS events appear instantly in the table.
3. **Review User** — Admin can view the user's uploaded ID document (decrypted stream) and listen to the SOS audio recording.
4. **Verify User** — Admin marks the user as verified with one click.
5. **Issue VC** — Admin issues a Verifiable Credential. The credential is anchored on-chain, and the transaction details are displayed in the feed.
6. **Check Hash** — Admin can verify the on-chain status of any credential hash by clicking "Check hash", which calls `contract.exists()` on the Ethereum node.

### Blockchain Anchoring Flow

```
Express Server                          Hardhat Node (localhost:8545)
      │                                        │
      │  POST /api/admin/issue-vc/:userId       │
      │─────────────────────────────────>       │
      │                                         │
      │  1. Veramo issues VC (JWT proof)        │
      │  2. VC JSON → SHA-256 → hash            │
      │  3. Spawn storeHash.js <hash>           │
      │─────────────────────────────────>       │
      │                                         │
      │        storeHash.js                     │
      │        ├── ethers.Wallet(privateKey)     │
      │        ├── contract.store(hash)          │
      │        └── tx.wait()                     │
      │                                         │
      │  ◄── { transactionHash, blockNumber }   │
      │                                         │
      │  4. Save VCRecord in MongoDB              │
      │  5. Return VC + anchor receipt            │
      │                                         │
```

The blockchain layer is intentionally minimal — a single `IdentityAnchor` contract with two functions (`store` and `exists`). This keeps gas costs low and the trust model simple: Safeguard does not verify identity on-chain; it merely timestamp-commits credential hashes for tamper-evident auditability.

### Real-Time SOS Flow

```
User Frontend                    Express Server                  Admin Frontend
     │                                │                              │
     │  POST /api/sos (FormData)       │                              │
     │  ├── messageType                │                              │
     │  ├── messageText                │                              │
     │  └── audioFile (optional)       │                              │
     │──────────────────────────────>  │                              │
     │                                 │                              │
     │  1. Save audio file to disk     │                              │
     │  2. Create SOSRecord in MongoDB  │                              │
     │  3. io.to('admins').emit('sos') │                              │
     │                                 │─────────────────────────────>│
     │                                 │   { id, user, message,       │
     │                                 │     audioUrl, createdAt,     │
     │  ◄── { sosId, audioUrl }       │     latestCredential }       │
     │                                 │                              │
     │                                 │  4. Append to SOS table      │
     │                                 │     (or update if exists)    │
     │                                 │                              │
```

---

## Smart Contract

### IdentityAnchor.sol

```solidity
contract IdentityAnchor {
    mapping(bytes32 => bool) private stored;
    event Stored(bytes32 indexed hash, address indexed sender);

    function store(bytes32 h) external {
        stored[h] = true;
        emit Stored(h, msg.sender);
    }

    function exists(bytes32 h) external view returns (bool) {
        return stored[h];
    }
}
```

A minimal, immutable, and transparent hash registry. Designed to be:
- **Gas-efficient** — Single SSTORE operation per store call.
- **Tamper-evident** — Once a hash is stored, it cannot be removed or altered.
- **Verifiable** — Anyone can call `exists()` directly on the contract without permission.
- **Upgradeable only by redeployment** — No proxy or owner pattern; the contract has no `onlyOwner` functions, meaning once deployed, no party (including Safeguard) can delete or modify stored hashes.

**Deployment:** Currently configured for Hardhat localhost (`http://127.0.0.1:8545`). To deploy to a testnet or mainnet, configure the network in `hardhat.config.js` and set the `ANCHOR_PRIVATE_KEY` environment variable.

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register a new user (name, email, password). Sends verification email. |
| `GET` | `/api/auth/verify?token=<token>` | ❌ | Verify email using the token from the email link. |
| `POST` | `/api/auth/login` | ❌ | Login with email/password. Returns JWT + user object. |

### User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/user/profile` | ✅ User | Get user profile, uploaded documents, and issued credentials. |
| `POST` | `/api/user/upload-id` | ✅ User | Upload an ID document (multipart: `idType`, `document` file). Encrypted at rest. |

### SOS

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/sos` | ✅ User | Send an SOS alert. Body: `messageType` (default/custom), `messageText`, optional `audioFile`. Broadcasts to admins via Socket.IO. |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/sos` | ✅ Admin | List all SOS records sorted by recency, with user details and credential info. |
| `POST` | `/api/admin/verify-user` | ✅ Admin | Mark a user as verified (`userId` in body). |
| `POST` | `/api/admin/issue-vc/:userId` | ✅ Admin | Issue a TouristCredential to the user. Anchors hash on-chain. |
| `GET` | `/api/admin/check-hash/:hash` | ✅ Admin | Check if a credential hash exists both in MongoDB and on-chain. |
| `GET` | `/api/admin/id-documents/:userId/:documentId` | ✅ Admin | Stream a decrypted ID document. |
| `GET` | `/api/admin/sos/:sosId/audio` | ✅ Admin | Stream an SOS audio recording. |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Server health check. Returns `{ "status": "ok" }`. |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `sos` | Server → Admins Room | Emitted when a new SOS alert is created. Payload includes user info, message, audio URL, and latest credential. |
| `error` | Server → Client | Emitted when Socket.IO authentication fails. |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** >= 6 (local or Atlas)
- **Hardhat** (for blockchain) — requires Java (for Hardhat's built-in node)

### Installation

```bash
# Clone the repository
git clone https://github.com/ask-z4ch/SafeGuard.git
cd safeguard-proto

# Install server dependencies
cd backend/server
npm install

# Install user frontend dependencies
cd ../frontend-user
npm install

# Install admin frontend dependencies
cd ../frontend-admin
npm install

# Install chain dependencies
cd ../chain
npm install

# Return to project root
cd ../../..
```

### Environment Variables

Create `.env` files for each module:

**`backend/server/.env`** (required variables marked with ★):

```env
# ★ MongoDB connection string
MONGO_URI=mongodb://localhost:27017/safeguard

# ★ JWT signing secret (use a long random string)
JWT_SECRET=your_jwt_secret_here

# ★ Veramo agent secret (used for DID key + file encryption)
VERAMO_SECRET=your_veramo_secret_here

# Email verification (optional — skipped if placeholder values)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Blockchain paths (relative to server/src/)
CHAIN_SCRIPT_PATH=../chain/scripts/storeHash.js
CHAIN_CHECK_SCRIPT_PATH=../chain/scripts/checkHash.js

# Server port
PORT=4000

# Admin seed credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Safeguard Admin
```

**Tip:** Use a password generator for `JWT_SECRET` and `VERAMO_SECRET`. Never commit these values.

**`backend/frontend-user/.env`** and **`backend/frontend-admin/.env`**:

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

### Running Locally

You need **four terminal windows**:

#### 1. Start MongoDB

```bash
# If using local MongoDB:
mongod

# Or use Docker:
docker run -d -p 27017:27017 mongo:7
```

#### 2. Start Hardhat Node (Blockchain)

```bash
cd backend/chain
npx hardhat node
# Listens on http://127.0.0.1:8545
```

#### 3. Deploy the Smart Contract

In a **new terminal**, after the Hardhat node is running:

```bash
cd backend/chain
npx hardhat run scripts/deploy.js --network localhost
```

Expected output:
```
IdentityAnchor deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 on network localhost
Deployment saved to .../deployments/IdentityAnchor.localhost.json
```

#### 4. Start the API Server

```bash
cd backend/server
npm run dev
# Listens on http://localhost:4000
```

#### 5. Start the Frontend Apps

```bash
# Terminal A — User Portal
cd backend/frontend-user
npm start
# Opens on http://localhost:3000

# Terminal B — Admin Dashboard
cd backend/frontend-admin
npm start
# Opens on http://localhost:3001
```

### Verifying the Setup

1. Open **User Portal** (`http://localhost:3000`) → Register a new account.
2. Check the server terminal for the verification link (or configure SMTP to receive the email).
3. Click the verification link → your email is verified.
4. Open **Admin Dashboard** (`http://localhost:3001`) → Login with admin credentials.
5. Upload an ID document from the user portal → view it in the admin dashboard.
6. Issue a VC from the admin dashboard → the credential hash is anchored on-chain.
7. Send an SOS from the user portal → it appears instantly in the admin's live feed.

---

## Security Considerations

- **Encryption at rest** — All ID documents are encrypted with AES-256-GCM before writing to disk. The encryption key is derived from `VERAMO_SECRET`, which is never exposed to clients.
- **No plaintext tokens** — Email verification tokens are stored as SHA-256 hashes. The raw token is only present in the email link and is never persisted.
- **JWT with short expiry** — 1-hour token lifetime reduces the window of opportunity for stolen tokens. Role-based authorization is enforced at both middleware and route levels.
- **Password hashing** — bcrypt with 10 salt rounds.
- **File upload validation** — Multer processes files in memory (no disk spill for ID docs). MIME type checking and file size limits should be added before production use.
- **CORS** — Configured with `origin: true` for development. Tighten this in production.

---

## Roadmap

- [ ] **Production blockchain deployment** — Deploy `IdentityAnchor` to Sepolia testnet and mainnet with automated Hardhat tasks.
- [ ] **Push notifications** — Native push alerts for SOS status updates via Firebase Cloud Messaging.
- [ ] **Decentralized storage** — Migrate encrypted documents to IPFS/Filecoin for fault tolerance.
- [ ] **DID-to-DID communication** — Peer-to-peer credential exchange using DIDComm.
- [ ] **Multi-language support** — i18n for SOS presets and admin interface.
- [ ] **Analytics dashboard** — SOS frequency, response times, credential issuance metrics.
- [ ] **CI/CD pipeline** — GitHub Actions for automated testing and deployment.
- [ ] **Unit & integration tests** — Coverage for controllers, services, and smart contract.

---

## License

MIT
