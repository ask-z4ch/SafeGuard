# Safeguard Prototype Backend

Node.js/Express backend for the Safeguard prototype. Features include user authentication with email verification, encrypted ID document uploads, Veramo-based verifiable credential issuance, SOS broadcasting over Socket.IO, and simple role-based access control.

## Requirements

- Node.js 18+
- MongoDB instance

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Duplicate `.env.example` to `.env` and fill in the values:

   - `MONGO_URI` — Mongo connection string
   - `JWT_SECRET` — secret for signing access tokens
   - `EMAIL_USER` / `EMAIL_PASS` — SMTP credentials (defaults assume Gmail; adjust `config/email.js` if needed)
   - `VERAMO_SECRET` — used by the Veramo agent and file encryption key derivation
   - `CHAIN_SCRIPT_PATH` — path to the anchoring script (defaults to `../chain/scripts/storeHash.js`)
   - `PORT` — optional, defaults to `4000`

3. Start the dev server:

   ```bash
   npm run dev
   ```

   or run in production mode:

   ```bash
   npm start
   ```

## Key Features

- **Auth & Email Verification**
  - `POST /api/auth/register` — accepts `{ email, password, name }`, stores user with `verified:false`, and emails a verification link.
  - `GET /api/auth/verify?token=...` — validates the emailed token and sets `verified:true`.
  - `POST /api/auth/login` — issues a JWT (`role:user|admin`, `sub:userId`).

- **ID Upload (Protected)**
  - `POST /api/user/upload-id`
    - Multipart form fields: `idType` (`aadhar|passport`) and `document` file.
    - File encrypted with AES-256-GCM (key derived from `VERAMO_SECRET`) and stored in `uploads/`.

- **Veramo VC Issuance (Admin)**
  - `POST /api/admin/issue-vc/:userId`
    - Body: optional `{ tripId, visitPeriod }`.
    - Issues a `TouristCredential` Verifiable Credential (JWT proof) via Veramo `did:key` agent.
    - Hashes VC JSON (SHA-256), calls Hardhat script (`node ../chain/scripts/storeHash.js <hash>`), stores VC + anchor metadata in Mongo.

- **Secure ID Viewing (Admin)**
  - `GET /api/admin/id-documents/:userId/:documentId`
    - Decrypts & streams the stored ID document on demand.

- **SOS Alerts (Protected)**
  - `POST /api/sos`
    - Fields: `messageType`, `messageText`, optional `audioFile`.
    - Persists record and broadcasts payload (user profile + ID doc URLs + audio URL) to Socket.IO room `admins`.
  - `GET /api/admin/sos/:sosId/audio` (admin) streams stored audio.

## Socket.IO Notes

- Server initialises Socket.IO alongside HTTP.
- Admin dashboards should connect using a JWT:

  ```js
  const socket = io('http://localhost:4000', {
    auth: { token: '<jwt>' }
  });
  ```

- Authenticated admins auto-join the `admins` room and receive `sos` events.

## Hardhat Anchor Script

- Default script lives at `../chain/scripts/storeHash.js` and returns JSON with `{ storedHash, transactionHash, anchoredAt }`.
- Update `CHAIN_SCRIPT_PATH` if you move or replace it.

## Development Tips

- Verify Mongo connectivity before running the server.
- For testing email locally, use a service like [Ethereal Email](https://ethereal.email/) and update `config/email.js` transport config accordingly.
- Uploaded files are ignored by git; inspect decrypted content through the admin endpoints only.
