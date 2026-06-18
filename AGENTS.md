# Agent context for opencode

## Build & verify

### Admin frontend
- `cd backend/frontend-admin && npm run build` — production build (ESLint errors fail CI)
- `cd backend/frontend-admin && CI=true npm run build` — simulate Vercel CI build

### User frontend
- `cd backend/frontend-user && npm run build` — production build
- `cd backend/frontend-user && CI=true npm run build` — simulate Vercel CI build

### Server
- `cd backend/server && npm run dev` — start dev server with nodemon
- `cd backend/server && npm start` — start production

### Full verification
- `cd backend/frontend-admin; CI=true npm run build` then `cd ../frontend-user; CI=true npm run build` — catch all Vercel CI issues before push

## ESLint
Both frontends use `react-scripts` with `eslint-config-react-app`. In CI (Vercel), `CI=true` promotes warnings to errors. Common breakers:
- `no-unused-vars` — unused imports/variables
- `react-hooks/exhaustive-deps` — missing useEffect dependencies
- `no-console` — console.log/warn/error

## Project structure
- `backend/server/` — Express API (deployed on Render)
- `backend/frontend-admin/` — Admin React app (deployed on Vercel)
- `backend/frontend-user/` — User React app + Capacitor Android wrapper (deployed on Vercel)
- `backend/chain/` — Hardhat + Solidity contract (Sepolia testnet)

## Training module (Unity WebGL)

The police training module is served from the **API server** (Render), not from Vercel, because the 150MB `.data` file exceeds Vercel free-tier limits.

### Local dev
- Build files exist at `backend/frontend-admin/public/training-game/Build/` (not committed to git)
- `cd backend/server && npm run dev` auto-runs `scripts/prepare-training-module.js` which copies files from the admin source
- Iframe loads from local API at `http://localhost:5000/training-module/index.html`

### Production (Render)
- Set `TRAINING_MODULE_BASE_URL` env var on Render: a base URL where the four Build files (`Police Module.data`, `Police Module.wasm`, `Police Module.framework.js`, `Police Module.loader.js`) are individually hosted
- If unset, the training module shows a graceful fallback message
- The server auto-downloads these files on startup

### Vercel (admin app)
- `REACT_APP_API_URL` env var controls where the iframe points (defaults to `https://safeguard-c7n8.onrender.com`)
- No training files needed in the Vercel build

## Live URLs
- API: https://safeguard-c7n8.onrender.com
- User: https://safeguard-plum.vercel.app
- Admin: https://safeguardadmin.vercel.app
- Sepolia contract: 0xe5a53C2F56480262f89c5478Cb683AcC5d2Cc6Db

## Demo creds
- User: demo@test.com / DemoPass123
- Admin: admin@example.com / SuperSecure123

## Key integrations
- MongoDB (in-memory by default, Atlas optional via MONGO_URI)
- Ethereum Sepolia (IdentityAnchor contract, via ethers.js)
- Socket.IO (real-time SOS feed)
- Veramo (W3C VC issuance, did:key)
