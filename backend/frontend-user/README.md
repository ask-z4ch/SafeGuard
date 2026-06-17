# Safeguard Companion (User Portal)

React app for travellers to manage registration, digital ID uploads, SOS alerts, and credential status. Pairs with the Express API running at `http://localhost:4000` by default.

## Prerequisites

- Node.js 18+
- API server from `../server` running locally (or set `REACT_APP_API_BASE_URL`).

## Getting started

```bash
npm install
npm start
```

The app expects these API endpoints:

- `POST /api/auth/register`
- `GET /api/auth/verify?token=...`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `POST /api/user/upload-id`
- `POST /api/sos`

Create a `.env` file (optional) to override the API origin:

```
REACT_APP_API_BASE_URL=http://localhost:4000
```

## Key screens

- **Register** – Sign up and trigger the verification email.
- **Verify** – Parses the token from the URL and calls the verification endpoint.
- **Login** – Persists the JWT and user details in localStorage.
- **Upload ID** – Upload encrypted ID assets (Aadhar/Passport) with thumbnail preview for images.
- **Dashboard** – Displays verification status, uploaded documents, VC hashes, and an SOS console with preset/custom messages and optional voice recording.

## Building for production

```bash
npm run build
```

Outputs the compiled bundle to `build/`.
