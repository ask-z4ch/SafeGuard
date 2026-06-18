import bcrypt from 'bcryptjs';

import User from '../models/User.js';

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

export const seedDemoUser = async () => {
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
  await User.create({ name, email, password: hashed, role: 'user', verified: true });
  console.log(`Seeded demo user ${email}`);
};

export default seedAdmin;
