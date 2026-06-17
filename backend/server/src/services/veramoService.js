import crypto from 'crypto';

import { getVeramoAgent } from '../config/veramo.js';

let issuerIdentity;

const getIssuerIdentity = async () => {
  const agent = getVeramoAgent();

  if (issuerIdentity) {
    return issuerIdentity;
  }

  const existing = await agent.didManagerFind({});
  issuerIdentity = existing.find((identifier) => identifier.provider === 'did:key');

  if (!issuerIdentity) {
    issuerIdentity = await agent.didManagerCreate({ provider: 'did:key', alias: 'safeguard-issuer' });
  }

  return issuerIdentity;
};

export const issueTouristCredential = async ({ user, tripId, visitPeriod }) => {
  const agent = getVeramoAgent();
  const issuer = await getIssuerIdentity();

  const unsignedCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential', 'TouristCredential'],
    issuer: issuer.did,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:example:user:${user.id}`,
      name: user.name,
      tripId,
      visitPeriod
    }
  };

  const verifiableCredential = await agent.createVerifiableCredential({
    credential: unsignedCredential,
    proofFormat: 'jwt'
  });

  return {
    verifiableCredential,
    issuerDid: issuer.did
  };
};
