# Deployment Guide

## Architecture (Production)

```
User App (Vercel)             Admin App (Vercel)
 safeguard-plum.vercel.app     safeguardadmin.vercel.app
        |                            |
        |         REST + WS          |
        +----------> API <------------+
                  (Render)
                       |
                  MongoDB Atlas
                       |
                  Ethereum Sepolia
                  (IdentityAnchor)
```

---

## 1. Database — MongoDB Atlas

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) — Sign up (free tier = M0)
2. Create a cluster → "Build a Database" → M0 (Shared) → AWS / your region
3. Under **Security > Database Access** → Add a database user (username + password)
4. Under **Security > Network Access** → Add `0.0.0.0/0` (allow all, since Render IPs vary)
5. Click **Connect** → "Connect your application" → Copy the connection string
   - Format: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/safeguard?retryWrites=true&w=majority`

---

## 2. Backend API — Render

1. Go to [render.com](https://render.com) — Sign up with GitHub
2. Click **New > Web Service** → Connect your GitHub repo
3. Configure:
   - **Name:** `safeguard-api`
   - **Root Directory:** `backend/server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Under **Environment Variables**, add:

| Variable | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Random 64-char hex (use `openssl rand -hex 32`) |
| `VERAMO_SECRET` | Random 64-char hex |
| `ADMIN_EMAIL` | `admin@safeguard.app` |
| `ADMIN_PASSWORD` | A strong admin password |
| `ADMIN_NAME` | `Safeguard Admin` |
| `ANCHOR_RPC_URL` | Sepolia RPC URL (e.g. `https://eth-sepolia.g.alchemy.com/v2/<key>`) |
| `ANCHOR_PRIVATE_KEY` | Wallet private key with Sepolia ETH for contract writes |
| `ANCHOR_CONTRACT_ADDRESS` | Deployed IdentityAnchor contract address |
| `FRONTEND_USER_URL` | `https://safeguard-plum.vercel.app` |
| `FRONTEND_ADMIN_URL` | `https://safeguardadmin.vercel.app` |

5. Click **Create Web Service**

---

## 3. Frontend — Vercel

### User App

1. Go to [vercel.com](https://vercel.com) — Sign up with GitHub
2. Click **Add New > Project** → Import your GitHub repo
3. Set:
   - **Root Directory:** `backend/frontend-user`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. Under **Environment Variables**:
   - `REACT_APP_API_BASE_URL` → `https://safeguard-c7n8.onrender.com`

### Admin App

1. Repeat the same steps with:
   - **Root Directory:** `backend/frontend-admin`
   - `REACT_APP_API_BASE_URL` → `https://safeguard-c7n8.onrender.com`

---

## 4. Blockchain — Sepolia Testnet

### Prerequisites

- Sepolia ETH (free from any faucet — e.g., [sepoliafaucet.com](https://sepoliafaucet.com/))
- An Alchemy or Infura API key (free tier)
- A wallet private key with Sepolia ETH (for contract deployment and credential anchoring)

### Deploy Contract

```bash
cd backend/chain
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

The deploy script outputs the contract address. Update your Render environment variables:
- `ANCHOR_CONTRACT_ADDRESS=<deployed-address>`
- `ANCHOR_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your-key>`
- `ANCHOR_PRIVATE_KEY=<wallet-private-key>`

The server uses ethers.js directly to interact with the contract. No child_process or Hardhat dependency at runtime.

### Verify on Etherscan

```bash
npx hardhat verify --network sepolia <contract-address>
```

---

## Verifying the Live Setup

1. Open the User App → Register → You're auto-verified and logged in
2. Open the Admin App → Login with admin credentials
3. Upload an ID document from the User App → View it in Admin App
4. Issue a Verifiable Credential from Admin App → Check it's anchored on Sepolia
5. Send an SOS from User App → See it appear live in Admin App
6. Use the Credential Verifier in Admin App to check any VC hash
7. Try the User Management page and Audit Trail in Admin App
