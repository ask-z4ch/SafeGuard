# Safeguard Admin Dashboard

React dashboard for command-center operators. Streams SOS alerts via Socket.IO, surfaces traveller status, and lets admins verify accounts and issue verifiable credentials.

## Prerequisites

- Node.js 18+
- API server running locally (defaults to `http://localhost:4000`).
- Admin credentials (user with `role: 'admin'`).

## Setup

```bash
npm install
npm start
```

Optional `.env` override:

```
REACT_APP_API_BASE_URL=http://localhost:4000
```

## Features

- **Real-time SOS feed** – connects to Socket.IO on load and appends alerts as they come in.
- **Traveller context** – shows name, email, verification flag, ID document link, and voice note playback.
- **Credential controls** – trigger VC issuance, inspect latest VC JSON, and check the anchored hash via `/api/admin/check-hash/:hash`.
- **Verification actions** – mark travellers verified through `/api/admin/verify-user`.
- **Hash insights** – inline status tags once a hash check succeeds.

## Available scripts

- `npm start` – start CRA dev server on port 3000.
- `npm run build` – production bundle in `build/`.
- `npm test` – CRA test runner.

Ensure the backend exposes the admin endpoints:

- `GET /api/admin/sos`
- `POST /api/admin/verify-user`
- `POST /api/admin/issue-vc/:userId`
- `GET /api/admin/check-hash/:hash`
- `GET /api/admin/id-documents/:userId/:documentId`
- `GET /api/admin/sos/:sosId/audio`

Login with an admin JWT-capable account, keep the tab open, and monitor live incidents.
