import { Router } from 'express';
import VCRecord from '../models/VCRecord.js';
import { checkCredentialHash } from '../services/blockchainService.js';

const router = Router();

router.post('/verify-vc', async (req, res, next) => {
  try {
    const { hash, credential } = req.body;

    if (!hash && !credential) {
      return res.status(400).json({ message: 'Provide a hash or a verifiable credential to verify' });
    }

    let canonicalHash = hash;

    if (credential) {
      const serialized = typeof credential === 'string' ? credential : JSON.stringify(credential);
      const crypto = await import('crypto');
      canonicalHash = crypto.createHash('sha256').update(serialized).digest('hex');
    }

    canonicalHash = canonicalHash.startsWith('0x') ? canonicalHash.slice(2) : canonicalHash;

    if (canonicalHash.length !== 64) {
      return res.status(400).json({ message: 'Invalid hash length' });
    }

    let onChain;
    try {
      onChain = await checkCredentialHash(`0x${canonicalHash}`);
    } catch {
      onChain = null;
    }

    const record = await VCRecord.findOne({ hash: canonicalHash }).sort({ createdAt: -1 }).lean();

    res.json({
      verified: Boolean(onChain?.exists || record),
      hash: canonicalHash,
      onChain: onChain || null,
      record: record
        ? {
            issuerDid: record.issuerDid,
            issuedAt: record.createdAt,
            credentialSubject: record.verifiableCredential?.credentialSubject || null,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
