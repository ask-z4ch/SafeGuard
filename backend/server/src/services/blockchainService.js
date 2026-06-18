import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveScriptPath = (envVar, fallbackRelative) => {
  const configured = process.env[envVar];
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }

  return path.resolve(__dirname, fallbackRelative);
};

const runScript = (scriptPath, args = []) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Script exited with code ${code}`));
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Failed to parse chain script output: ${error.message}`));
      }
    });
  });

export const anchorCredentialHash = async (hash) => {
  const scriptPath = resolveScriptPath('CHAIN_SCRIPT_PATH', '../../../chain/scripts/storeHash.js');
  return runScript(scriptPath, [hash]);
};

export const checkCredentialHash = async (hash) => {
  const scriptPath = resolveScriptPath('CHAIN_CHECK_SCRIPT_PATH', '../../../chain/scripts/checkHash.js');
  return runScript(scriptPath, [hash]);
};

// TODO: replace child_process with direct ethers import once server and chain deps are unified
