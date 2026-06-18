import { existsSync, copyFileSync, mkdirSync, readdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { get } from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = join(__dirname, '..');
const destDir = join(serverRoot, 'public', 'training-module', 'Build');
const sourceDir = join(serverRoot, '..', 'frontend-admin', 'public', 'training-game', 'Build');

const FILE_CONFIG = [
  { name: 'Police Module.loader.js', env: 'TRAINING_LOADER_URL', default: 'https://files.catbox.moe/mnwtwa.js' },
  { name: 'Police Module.framework.js', env: 'TRAINING_FRAMEWORK_URL', default: 'https://files.catbox.moe/12qtzq.js' },
  { name: 'Police Module.data', env: 'TRAINING_DATA_URL', default: 'https://files.catbox.moe/zajttx.data' },
  { name: 'Police Module.wasm', env: 'TRAINING_WASM_URL', default: 'https://files.catbox.moe/td7u8h.wasm' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const opts = {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    };
    const req = get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (err) => { file.close(); reject(err); });
  });
}

async function main() {
  const assetsDir = process.env.TRAINING_MODULE_ASSETS_DIR;

  if (assetsDir && existsSync(assetsDir)) {
    console.log('[training] Copying from', assetsDir);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    for (const f of readdirSync(assetsDir)) {
      copyFileSync(join(assetsDir, f), join(destDir, f));
    }
    return;
  }

  if (existsSync(sourceDir)) {
    console.log('[training] Copying from local source');
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    for (const f of readdirSync(sourceDir)) {
      if (!f.endsWith('.br')) {
        copyFileSync(join(sourceDir, f), join(destDir, f));
      }
    }
    return;
  }

  const urls = FILE_CONFIG
    .map((cfg) => ({ name: cfg.name, url: process.env[cfg.env] || cfg.default }))
    .filter(({ url }) => !!url);

  if (urls.length > 0) {
    console.log('[training] Downloading files');
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    for (const { name, url } of urls) {
      const dest = join(destDir, name);
      try {
        await download(url, dest);
        console.log(`[training] Downloaded ${name}`);
      } catch (err) {
        console.error(`[training] Failed to download ${name}: ${err.message}`);
      }
    }
    return;
  }

  console.log('[training] No source found. Set TRAINING_DATA_URL / TRAINING_WASM_URL etc. for production.');
}

main().catch(console.error);
