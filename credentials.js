import { web5, userDid } from "./index.js";
import { Ed25519, Jose } from "@web5/crypto";
import { DidKeyMethod } from "@web5/dids";
import { VerifiableCredential } from "@web5/credentials";

class StreetCredibility {
  constructor(localRespect, legit) {
    this.localRespect = localRespect;
    this.legit = legit;
  }
}

const vc = new VerifiableCredential({
  type: "StreetCred",
  issuer: userDid,
  subject: userDid,
  data: new StreetCredibility("high", true),
});
const uploadCredentials = async (vcJwt, issuer) => {
  //verify credential
  try {
    // await VerifiableCredential.verify(vcJwt)
    const credentialData = {
      issuer: issuer,
      credential: vcJwt,
      subject: userDid,
    };
    // store credential
    const response = await web5.dwn.records.create({
      data: credentialData,
      message: {
        schema: "http://schema-registry.org/message",
        dataFormat: "application/json",
      },
    });
    if (response.status.code) {
      console.log("Credentials uploaded successful!");
      console.log(response.status.code);
      return "Credentials uploaded successful!";
    }
  } catch (e) {
    console.log(`Credentials uploaded failed: ${e.message}`);
  }
};
//trying to fetch credentials
const fetchCredentials = async () => {
  try {
    let { records } = await web5.dwn.records.query({
      message: {
        filter: {
          schema: "http://schema-registry.org/message",
        },
        dateSort: "createdAscending",
      },
    });

    records.forEach(async (record) => {
      const data = await record.data.json();
      console.log(data);
      return data;
    });
  } catch (e) {
    console.log(`Credentials retrieve  failed: ${e.message}`);
  }
};

async function deleteCredential() {
  let credentials = await fetchCredentials();

  for (const credential of credentials) {
    let response = await web5.dwn.records.delete({
      message: {
        recordId: credential.id,
      },
    });
    console.log(`deleted`);
  }
}
const presentCredential = async () => {};

const signCredential = async () => {
  const issuer = await DidKeyMethod.create();
  const privateKeyJwk = issuer.keySet.verificationMethodKeys[0].privateKeyJwk;

  let privateKeyHex;
  if (privateKeyJwk) {
    const privateKey = await Jose.jwkToKey({ key: privateKeyJwk });
    privateKeyHex = privateKey.keyMaterial;
    // Rest of the code using privateKey
  } else {
    return "Private key JWK not available";
  }

  const signOptions = {
    issuerDid: issuer.did,
    subjectDid: userDid,
    kid: `${issuer.did}#${issuer.did.split(":")[2]}`,
    signer: async (data) => await Ed25519.sign({ data, key: privateKeyHex }),
  };
  const vcJwt = await vc.sign(signOptions);

  return vcJwt;
};
const verifyCredential = async (vcJwt) => {
  try {
    await VerifiableCredential.verify(vcJwt)
    return "VC Verification successful!"
  } catch (e) {
    return `VC Verification failed: ${e.message}`
  }
};



export { fetchCredentials, uploadCredentials, signCredential, verifyCredential };
