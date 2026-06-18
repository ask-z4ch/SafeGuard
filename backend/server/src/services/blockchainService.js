import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let provider;
let signer;
let contract;

const getProvider = () => {
  if (!provider) {
    const rpcUrl = process.env.ANCHOR_RPC_URL || 'http://127.0.0.1:8545';
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
};

const getContract = () => {
  if (contract) return contract;

  const network = process.env.ANCHOR_NETWORK || 'localhost';
  const deploymentDir = path.resolve(__dirname, '../../../chain/deployments');
  const deploymentFile = path.join(deploymentDir, `IdentityAnchor.${network}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));

  const pk = process.env.ANCHOR_PRIVATE_KEY ||
             (network === 'localhost' ? '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' : null);

  if (!pk) {
    throw new Error('Set ANCHOR_PRIVATE_KEY for the target network.');
  }

  const prov = getProvider();
  const wallet = new ethers.Wallet(pk, prov);
  contract = new ethers.Contract(deployment.address, deployment.abi, wallet);
  return contract;
};

export const anchorCredentialHash = async (hash) => {
  const normalized = ethers.hexlify(ethers.getBytes(hash.startsWith('0x') ? hash : `0x${hash}`));
  const c = getContract();
  const tx = await c.store(normalized);
  const receipt = await tx.wait();
  return {
    storedHash: normalized,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    stored: true,
    contractAddress: c.target,
    network: process.env.ANCHOR_NETWORK || 'localhost',
    anchoredAt: new Date().toISOString(),
  };
};

export const checkCredentialHash = async (hash) => {
  const normalized = ethers.hexlify(ethers.getBytes(hash.startsWith('0x') ? hash : `0x${hash}`));
  const c = getContract();
  const exists = await c.exists(normalized);
  return {
    hash: normalized,
    exists,
    contractAddress: c.target,
    network: process.env.ANCHOR_NETWORK || 'localhost',
    checkedAt: new Date().toISOString(),
  };
};
