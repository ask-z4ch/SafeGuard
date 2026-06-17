# Deployment Guide

## Architecture (Production)

```
User App (Vercel)          Admin App (Vercel)
  safeguard-user.vercel.app   safeguard-admin.vercel.app
         |                           |
         |         REST + WS         |
         +----------> API <-----------+
                  (Railway)
                       |
                  MongoDB Atlas
                       |
                  Hardhat / Sepolia
                  (Blockchain)
```

---

## 1. Database — MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) — Sign up (free tier = M0)
2. Create a cluster → "Build a Database" → M0 (Shared) → AWS / your region
3. Under **Security > Database Access** → Add a user (username + password)
4. Under **Security > Network Access** → Add `0.0.0.0/0` (allow all, since Railway IPs vary)
5. Click **Connect** → "Connect your application" → Copy the connection string
   - Format: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/safeguard?retryWrites=true&w=majority`

---

## 2. Backend API — Railway

1. Go to [railway.app](https://railway.app) — Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repo → Set **Root Directory** to `backend/server`
4. Under **Settings > Environment Variables**, add:

| Variable | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Random 64-char hex (use `openssl rand -hex 32`) |
| `VERAMO_SECRET` | Random 64-char hex |
| `PORT` | `4000` (Railway sets this automatically via `$PORT`) |
| `ADMIN_EMAIL` | `admin@safeguard.app` |
| `ADMIN_PASSWORD` | A strong admin password |
| `ADMIN_NAME` | `Safeguard Admin` |
| `APP_BASE_URL` | Your Railway app URL (e.g. `https://safeguard-api.up.railway.app`) |

5. Railway auto-detects `npm start` — no extra build step needed.
6. Note your Railway URL — it looks like `https://safeguard-api.up.railway.app`.

> ⚠️ The blockchain anchoring scripts (`storeHash.js` / `checkHash.js`) use `child_process.spawn` and require Hardhat/ethers dependencies available in the `backend/chain/` directory. For production, either:
> - Deploy the chain scripts alongside the server on Railway
> - Or skip blockchain anchoring initially and add it later

---

## 3. Frontend — Vercel

### User App

1. Go to [vercel.com](https://vercel.com) — Sign up with GitHub
2. Click **Add New > Project** → Import your GitHub repo
3. Set:
   - **Root Directory:** `backend/frontend-user`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)
4. Under **Environment Variables**:
   - `REACT_APP_API_BASE_URL` → `https://safeguard-api.up.railway.app`
5. Click **Deploy**

### Admin App

1. Repeat the same steps with:
   - **Root Directory:** `backend/frontend-admin`
   - `REACT_APP_API_BASE_URL` → `https://safeguard-api.up.railway.app`
2. Click **Deploy**

---

## 4. Blockchain (Optional — Sepolia Testnet)

Deploying the smart contract to Sepolia testnet enables live on-chain verification:

### Prerequisites

- Sepolia ETH (free from any faucet — e.g., [sepoliafaucet.com](https://sepoliafaucet.com/))
- An Alchemy or Infura API key (free tier)

### Steps

1. Update `backend/chain/hardhat.config.js` to add Sepolia network:

```js
networks: {
  localhost: { url: "http://127.0.0.1:8545" },
  sepolia: {
    url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}
```

2. Set environment variables:
   - `ALCHEMY_API_KEY` — from [alchemy.com](https://alchemy.com)
   - `DEPLOYER_PRIVATE_KEY` — the private key of the wallet with Sepolia ETH
   - `ANCHOR_NETWORK=sepolia` — used by `storeHash.js` / `checkHash.js`

3. Deploy:

```bash
cd backend/chain
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

4. Update Railway environment variables:
   - `CHAIN_SCRIPT_PATH=../chain/scripts/storeHash.js`
   - `CHAIN_CHECK_SCRIPT_PATH=../chain/scripts/checkHash.js`
   - `ANCHOR_NETWORK=sepolia`
   - `ANCHOR_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-key>`
   - `ANCHOR_PRIVATE_KEY=<deployer-wallet-key>`

---

## Verifying the Live Setup

1. Open the User App → Register → Check server logs for verification link → Verify email
2. Open the Admin App → Login with admin credentials
3. Upload an ID document from the User App → View it in Admin App
4. Issue a Verifiable Credential from Admin App → Check the hash on-chain
5. Send an SOS from User App → See it appear live in Admin App
