import { Web5 } from '@web5/api';

import { webcrypto } from 'node:crypto';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { web5, did: userDid } = await Web5.connect();

module.exports = {
    web5, userDid
}