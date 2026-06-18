# Safeguard

Full-stack traveller identity and SOS platform. Blockchain-anchored W3C Verifiable Credentials, AES-256-GCM encrypted document storage, real-time emergency alerts, and a native Android APK. Built with React, Express, MongoDB, Solidity, and Veramo.

## What it does

Two main problems:

**Identity verification is a mess.** Physical documents get lost, forged, or tampered with. There's no standard way for authorities in different places to verify a traveller's identity. Safeguard gives travellers a self-sovereign digital identity — a W3C Verifiable Credential anchored on Ethereum — that any authorized party can verify independently.

**Emergency response coordination is slow.** When someone needs help, there's no streamlined channel to alert authorities with identity context, location, and supporting evidence. Safeguard's SOS system sends real-time alerts with voice recordings, location data, and the user's full identity profile directly to a command-and-control dashboard.

The platform pairs a user-facing mobile app (React web app wrapped in Capacitor for Android) with an admin command center for monitoring and response, connected through an Express API with Socket.IO for live updates.

## Architecture

```
User Frontend (React/Capacitor)          Admin Frontend (React)
       |                                        |
  REST API + Socket.IO                    REST API + Socket.IO
       |                                        |
       +---------- Express Server --------------+
                      |
        +-------------+-------------+
        |             |             |
     MongoDB      Uploads       Hardhat Node
  (users, VCs,  (AES-256-GCM   (Ethereum L1,
    SOS records)  encrypted)    localhost:8545)
```

The server handles auth, document upload/encryption, VC issuance via Veramo, and real-time SOS broadcasting. The blockchain layer is minimal — a single Solidity contract that stores SHA-256 hashes of issued credentials. No on-chain identity verification, just tamper-evident timestamping.

## Tech stack

### Frontend
- React 19 with Create React App
- React Router DOM 6 for routing
- Axios with JWT interceptors
- Socket.IO client for live SOS feed
- date-fns for relative timestamps
- Capacitor (Camera, Geolocation, SplashScreen plugins) for native Android features
- MediaRecorder API for in-browser voice recording

### Backend
- Node.js, Express 5
- Mongoose 8 for MongoDB
- Socket.IO 4 for WebSocket
- Multer for file uploads
- bcryptjs for passwords
- jsonwebtoken for auth
- Nodemailer for verification emails
- Node crypto for AES-256-GCM and SHA-256

### Blockchain / Identity
- Solidity 0.8.20
- Hardhat 2.22 for dev environment
- ethers v6 for contract interaction
- Veramo v6 for W3C DID and Verifiable Credentials
- @veramo/credential-w3c, @veramo/did-provider-key, did-resolver

### Storage
- MongoDB (primary data store)
- Filesystem (encrypted uploads)

### Other
- Unity WebGL training simulation embedded in admin dashboard
- Capacitor Android wrapper for APK generation

## Features

### Digital identity
- Registration with email verification (24-hour token, stored as SHA-256 hash)
- Government ID upload (Aadhar or Passport) — AES-256-GCM encrypted at rest
- JWT auth with 1-hour expiry, role-based claims (user/admin)
- Profile dashboard showing verification status, documents, issued credentials

### W3C Verifiable Credentials
- Veramo agent creates a `did:key` identifier for the issuance authority
- Custom `TouristCredential` type with JWT proof format
- Every issued VC is SHA-256 hashed and stored on-chain via the IdentityAnchor contract
- Anyone can verify a credential hash exists on-chain — no server dependency

### Real-time SOS alerts
- Preset emergencies (medical, lost, robbery, fire) or custom 240-char messages
- Optional voice recording via MediaRecorder API
- Socket.IO pushes alerts instantly to all connected admin sessions
- Payload includes user profile, document URLs, GPS location, and latest credential info
- Admins can verify users, issue VCs, and check on-chain hashes directly from the SOS feed

### Admin command center
- Live SOS feed sorted by recency with per-row actions
- VC JSON viewer (expand/collapse inline)
- One-click on-chain hash verification
- Secure document streaming (server decrypts on-the-fly, never stores plaintext)
- Police training module (Unity WebGL game embedded via iframe)

## Project structure

```
safeguard-proto/
├── .env.example
├── backend/
│   ├── chain/                    # Hardhat setup
│   │   ├── contracts/IdentityAnchor.sol
│   │   ├── scripts/deploy.js, storeHash.js, checkHash.js
│   │   ├── deployments/
│   │   ├── hardhat.config.js
│   │   └── package.json
│   ├── server/                   # Express API
│   │   ├── src/
│   │   │   ├── index.js, app.js
│   │   │   ├── config/ (db.js, email.js, veramo.js)
│   │   │   ├── models/ (User.js, VCRecord.js, SOSRecord.js)
│   │   │   ├── middleware/ (authMiddleware.js, errorHandler.js)
│   │   │   ├── routes/ (auth, user, admin, sos)
│   │   │   ├── controllers/ (auth, user, admin, sos)
│   │   │   └── services/ (blockchain, email, file, socket, veramo)
│   │   ├── uploads/   (gitignored)
│   │   └── .env.example
│   ├── frontend-admin/           # React admin dashboard
│   │   ├── src/ (pages/, components/, context/, api/)
│   │   ├── public/training-game/ # Unity WebGL build
│   │   └── .env
│   └── frontend-user/            # React user portal
│       ├── src/ (pages/, components/, context/, api/)
│       └── .env
```

## Smart contract

```solidity
contract IdentityAnchor {
    mapping(bytes32 => bool) private stored;
    event Stored(bytes32 indexed hash, address indexed sender);

    function store(bytes32 h) external { stored[h] = true; emit Stored(h, msg.sender); }
    function exists(bytes32 h) external view returns (bool) { return stored[h]; }
}
```

Minimal hash registry. No owner functions, no upgradeability, no proxy. Once a hash is stored it cannot be removed. Anyone can call `exists()` directly on the contract without permission.

## API reference

### Auth
`POST /api/auth/register` — Register (name, email, password). Sends verification email.  
`GET /api/auth/verify?token=<token>` — Verify email.  
`POST /api/auth/login` — Returns JWT + user object.

### User
`GET /api/user/profile` — Profile, documents, credentials.  
`POST /api/user/upload-id` — Upload ID document (multipart: idType, document).

### SOS
`POST /api/sos` — Send SOS (messageType, messageText, optional audioFile, lat, lng). Broadcasts to admins.

### Admin
`GET /api/admin/sos` — List SOS records with user details.  
`POST /api/admin/verify-user` — Mark user verified (userId in body).  
`POST /api/admin/issue-vc/:userId` — Issue TouristCredential, anchor on-chain.  
`GET /api/admin/check-hash/:hash` — Check hash on-chain + in DB.  
`GET /api/admin/id-documents/:userId/:documentId` — Stream decrypted document.  
`GET /api/admin/sos/:sosId/audio` — Stream SOS audio.

### WS Events
`sos` — Server → Admins room on new SOS. Payload includes user info, message, audio URL, credential.  
`error` — Server → Client on auth failure.

## Getting started

You'll need Node.js >= 18, npm >= 9, and MongoDB >= 6 (local or Atlas). Hardhat requires Java.

```bash
git clone https://github.com/ask-z4ch/SafeGuard.git
cd safeguard-proto

# Install everything
cd backend/server && npm install
cd ../frontend-user && npm install
cd ../frontend-admin && npm install
cd ../chain && npm install
cd ../../..
```

Set up environment variables in `backend/server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/safeguard
JWT_SECRET=<random string>
VERAMO_SECRET=<random string>
PORT=4000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<password>
ADMIN_NAME=Safeguard Admin
```

Frontend `.env` files just need `REACT_APP_API_BASE_URL=http://localhost:4000`.

### Running locally (four terminals)

1. **MongoDB** — `mongod` or `docker run -d -p 27017:27017 mongo:7`
2. **Hardhat node** — `cd backend/chain && npx hardhat node`
3. **Deploy contract** — `cd backend/chain && npx hardhat run scripts/deploy.js --network localhost`
4. **API server** — `cd backend/server && npm run dev` (listens on :4000)
5. **User frontend** — `cd backend/frontend-user && npm start` (:3000)
6. **Admin frontend** — `cd backend/frontend-admin && npm start` (:3001)

To build the Android APK:
```bash
cd backend/frontend-user
npm run build
npx cap copy android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Security notes

- ID documents encrypted with AES-256-GCM before touching disk. Key derived from VERAMO_SECRET, never exposed client-side.
- Email verification tokens stored as SHA-256 hashes. Raw token only in the email link.
- JWT expires in 1 hour. Role middleware enforced at route level.
- bcrypt with 10 salt rounds for passwords.
- File processing happens in memory (Multer buffer), no temp disk writes for ID docs.
- CORS set to `origin: true` — tighten for production.

## Roadmap

- Deploy IdentityAnchor to Sepolia testnet
- Push notifications via Firebase
- Migrate encrypted storage to IPFS/Filecoin
- DID-to-DID credential exchange (DIDComm)
- i18n for SOS presets and admin UI
- Analytics: SOS frequency, response times, credential metrics
- CI/CD with GitHub Actions
- Unit and integration test coverage

## License

MIT
