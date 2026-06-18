# Safeguard

Traveller identity and emergency alert platform. Web/mobile app for users + admin dashboard for authorities. Uses W3C Verifiable Credentials anchored on Ethereum Sepolia.

Live: [user](https://safeguard-plum.vercel.app) · [admin](https://safeguardadmin.vercel.app) · [api](https://safeguard-c7n8.onrender.com)

## Structure

```
safeguard-proto/
├── backend/
│   ├── chain/                    # Hardhat + Solidity contract
│   ├── server/                   # Express API
│   ├── frontend-admin/           # React admin panel
│   └── frontend-user/            # React user app + Capacitor Android
├── DEPLOYMENT.md
├── BUILD_APK.md
└── README.md
```

## Tech

**Frontend:** React 19, react-router-dom, axios, socket.io-client, Capacitor
**Backend:** Express 5, Mongoose, Socket.IO, Zod, multer, bcryptjs, jsonwebtoken
**Chain:** Solidity 0.8, Hardhat, ethers v6
**Storage:** MongoDB Atlas, Render disk

## Getting started

Need Node >= 18, npm >= 9, MongoDB.

```bash
git clone https://github.com/ask-z4ch/SafeGuard.git
cd backend/server && npm install
cd ../frontend-user && npm install
cd ../frontend-admin && npm install
cd ../chain && npm install
```

### Environment

`backend/server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/safeguard
JWT_SECRET=<random>
VERAMO_SECRET=<random>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<password>
```

Both frontends need `REACT_APP_API_BASE_URL=http://localhost:4000` in their `.env`.

### Run locally

```bash
# Start MongoDB first
cd backend/server && npm run dev     # API on :4000
cd ../frontend-user && npm start     # user app on :3000
cd ../frontend-admin && npm start    # admin on :3001
```

Optional: `cd backend/chain && npx hardhat node && npx hardhat run scripts/deploy.js --network localhost` for local chain features.

### APK

```bash
cd backend/frontend-user
npm run build
npx cap copy android
cd android && ./gradlew assembleDebug
```

## Login

- User: `demo@test.com` / `DemoPass123`
- Admin: `admin@example.com` / `SuperSecure123`

## Production

| Service | URL |
|---------|-----|
| API | https://safeguard-c7n8.onrender.com |
| User | https://safeguard-plum.vercel.app |
| Admin | https://safeguardadmin.vercel.app |
| Contract | `0xe5a53C2F56480262f89c5478Cb683AcC5d2Cc6Db` (Sepolia) |

## Notes

- ID documents encrypted with AES-256-GCM at rest
- JWT auth, Zod validation on all inputs
- Rate limited (20/15min auth, 100/min general)
- SOS audio stored unencrypted on server disk (does not persist across deploys on Render)
