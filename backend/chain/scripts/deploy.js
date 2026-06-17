const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  await hre.run('compile');

  const IdentityAnchor = await hre.ethers.getContractFactory('IdentityAnchor');
  const contract = await IdentityAnchor.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const artifact = await hre.artifacts.readArtifact('IdentityAnchor');

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const filePath = path.join(deploymentsDir, `IdentityAnchor.${hre.network.name}.json`);
  const payload = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));

  console.log(`? IdentityAnchor deployed at ${address} on network ${hre.network.name}`);
  console.log('ABI:', JSON.stringify(artifact.abi));
  console.log(`?? Deployment saved to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
