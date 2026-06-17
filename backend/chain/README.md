# Identity Anchor Hardhat Project

Minimal Hardhat setup for anchoring credential hashes on-chain. Deploys the `IdentityAnchor` contract and provides helper scripts to store and verify SHA-256 digests.

## Prerequisites

- Node.js 18+
- `npm install` (already run in this directory)

## Key Files

- `contracts/IdentityAnchor.sol` - simple registry with `store(bytes32)` and `exists(bytes32)`.
- `scripts/deploy.js` - deploys the contract and writes `deployments/IdentityAnchor.<network>.json` with address + ABI.
- `scripts/storeHash.js` - helper to call `store()` via ethers and anchor a hash.
- `scripts/checkHash.js` - read-only helper that calls `exists()` to confirm storage.

## Usage

1. **Start a local Hardhat node**
   ```bash
   npx hardhat node
   ```

2. **Deploy the contract** (in a new terminal)
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   - Logs the deployed address and ABI.
   - Saves deployment data to `deployments/IdentityAnchor.localhost.json`.

3. **Store a hash**
   ```bash
   node scripts/storeHash.js 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   ```
   - Uses `ANCHOR_PRIVATE_KEY` / `PRIVATE_KEY` if set.
   - Defaults to Hardhat's first account key on `localhost` (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`).
   - Outputs JSON detailing the transaction, block number, and `stored` flag.

4. **Check if a hash exists**
   ```bash
   node scripts/checkHash.js 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   ```
   - Returns `{ hash, exists, contractAddress, network }`.

5. **Verify storage manually (optional)**
   ```bash
   npx hardhat console --network localhost
   > const deployment = require('./deployments/IdentityAnchor.localhost.json');
   > const contract = await ethers.getContractAt(deployment.abi, deployment.address);
   > await contract.exists('0x0123...');
   ```

## Environment Variables (optional)

- `ANCHOR_RPC_URL` - defaults to `http://127.0.0.1:8545`.
- `ANCHOR_PRIVATE_KEY` / `PRIVATE_KEY` - account key for writing transactions.
- `ANCHOR_NETWORK` - defaults to `localhost`; used to pick the deployment file.

The helper scripts log human-readable info to stderr and print machine-readable JSON on stdout, so other processes (like the API server) can parse the results directly.
