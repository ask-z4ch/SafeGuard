#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const [, , inputHash] = process.argv;

if (!inputHash) {
  console.error('Usage: node scripts/checkHash.js <hexHash>');
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
      throw new Error(`deployment file not found: ${deploymentFile}. Run the deploy script first.`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));
    const providerUrl = process.env.ANCHOR_RPC_URL || 'http://127.0.0.1:8545';
    const provider = new ethers.JsonRpcProvider(providerUrl);

    const contract = new ethers.Contract(deployment.address, deployment.abi, provider);

    const hash = normalizeHash(inputHash);
    const exists = await contract.exists(hash);

    const result = {
      hash,
      exists,
      contractAddress: deployment.address,
      network,
      checkedAt: new Date().toISOString()
    };

    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
