import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import User from '../models/User.js';
import SOSRecord from '../models/SOSRecord.js';
import VCRecord from '../models/VCRecord.js';
import AuditLog from '../models/AuditLog.js';

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Safeguard Admin';

  if (!email || !password) {
    console.warn('Skipping admin seed: ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    let updated = false;

    if (existing.role !== 'admin') {
      existing.role = 'admin';
      updated = true;
    }

    if (!existing.verified) {
      existing.verified = true;
      updated = true;
    }

    if (existing.name !== name) {
      existing.name = name;
      updated = true;
    }

    const passwordMatches = await bcrypt.compare(password, existing.password || '');
    if (!passwordMatches) {
      existing.password = hashed;
      updated = true;
    }

    if (updated) {
      await existing.save();
      console.log(`Admin user ensured for ${email}`);
    } else {
      console.log(`Admin user already up to date for ${email}`);
    }
    return;
  }

  await User.create({
    name,
    email,
    password: hashed,
    role: 'admin',
    verified: true
  });

  console.log(`Seeded admin user ${email}`);
};

export const seedDemoData = async () => {
  const email = process.env.DEMO_EMAIL || 'demo@test.com';
  const password = process.env.DEMO_PASSWORD || 'DemoPass123';
  const name = 'Demo Traveller';

  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.verified) {
      existing.verified = true;
      await existing.save();
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: 'user', verified: true });
  console.log(`Seeded demo user ${email}`);

  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

  const sampleSos = [
    { messageType: 'default', messageText: 'Lost in the city centre, need directions to the embassy', location: { lat: 28.6139, lng: 77.209 } },
    { messageType: 'default', messageText: 'Medical emergency at hotel lobby, need ambulance', location: { lat: 28.7041, lng: 77.1025 } },
    { messageType: 'custom', messageText: 'My passport was stolen at the train station. Need help filing a report.', location: { lat: 28.6128, lng: 77.2295 } },
  ];

  for (const sos of sampleSos) {
    const record = await SOSRecord.create({
      user: user.id,
      ...sos,
    });
    console.log(`  Seeded SOS: ${record.messageText.slice(0, 40)}...`);
  }

  const mockVc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential', 'TouristCredential'],
    issuer: 'did:key:z6MkhaXgB4vYyp2K3Y1TqPzJtRmQqZbYqGzK9V8LqXrWnB5d',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:example:user:${user.id}`,
      name: user.name,
      tripId: 'IND-2026-0042',
      visitPeriod: '2026-03-15 to 2026-04-15'
    },
    proof: {
      type: 'JwtProof2020',
      jwt: 'eyJhbGciOiJFUzI1NksifQ.mock-jwt-for-demo'
    }
  };

  const serialized = JSON.stringify(mockVc);
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');

  await VCRecord.create({
    user: user.id,
    hash,
    issuerDid: mockVc.issuer,
    verifiableCredential: mockVc,
  });
  console.log(`  Seeded VC with hash ${hash.slice(0, 20)}...`);

  if (admin) {
    await AuditLog.create({
      admin: admin.id,
      action: 'verify_user',
      targetUser: user.id,
      targetType: 'user',
      details: {},
      ip: '127.0.0.1',
    });
    await AuditLog.create({
      admin: admin.id,
      action: 'issue_vc',
      targetUser: user.id,
      targetType: 'vc',
      details: { hash },
      ip: '127.0.0.1',
    });
    console.log('  Seeded audit logs');
  }
};

export default seedAdmin;
