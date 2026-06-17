#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const [, , inputHash] = process.argv;

if (!inputHash) {
  console.error('Usage: node scripts/storeHash.js <hexHash>');
  process.exit(1);
}

const normalizeHash = (value) => {
  let hex = value.startsWith('0x') ? value : `0x${value}`;
  try {
    const bytes = ethers.getBytes(hex);
    if (bytes.length !== 32) {
      throw new Error(`expected 32 bytes, received ${bytes.length}`);
    }
    return ethers.hexlify(bytes);
  } catch (error) {
    throw new Error(`invalid hash provided: ${error.message}`);
  }
};

(async () => {
  try {
    const network = process.env.ANCHOR_NETWORK || 'localhost';
    const deploymentFile = path.join(__dirname, '..', 'deployments', `IdentityAnchor.${network}.json`);
    if (!fs.existsSync(deploymentFile)) {
      throw new Error(`deployment file not found: ${deploymentFile}. Did you run the deploy script?`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    const providerUrl = process.env.ANCHOR_RPC_URL || 'http://127.0.0.1:8545';
    const provider = new ethers.JsonRpcProvider(providerUrl);

    const DEFAULT_HARDHAT_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const suppliedKey = process.env.ANCHOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const privateKey = suppliedKey || (network === 'localhost' ? DEFAULT_HARDHAT_KEY : null);

    if (!privateKey) {
      throw new Error('Set ANCHOR_PRIVATE_KEY (or PRIVATE_KEY) to a funded account for the target network.');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(deployment.address, deployment.abi, wallet);

    const hash = normalizeHash(inputHash);
    const tx = await contract.store(hash);
    const receipt = await tx.wait();
    const stored = await contract.exists(hash);

    const result = {
      storedHash: hash,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      stored,
      contractAddress: deployment.address,
      network,
      anchoredAt: new Date().toISOString()
    };

    console.error(`Stored hash ${hash} via tx ${receipt.hash}`);
    console.error(`Contract ${deployment.address} on ${network}`);

    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
