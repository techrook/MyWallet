import { web5, userDid } from "./index.js";
import { Ed25519, Jose } from "@web5/crypto";
import { DidKeyMethod } from "@web5/dids";
import { VerifiableCredential,PresentationExchange } from "@web5/credentials";

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
    if (records.length===0){
      return "no credential stored"
    } 
    return records
  } catch (e) {
    console.log(`Credentials retrieve  failed: ${e.message}`);
  }
};

async function deleteCredentials() {
  let { records } = await web5.dwn.records.query({
    message: {
      filter: {
        schema: "http://schema-registry.org/message",
      },
    },
  });
for(let i=0;i<records.length; i++){
    const record = records[i];

// Delete the record
const deleteResult = await record.delete();
if(deleteResult){
  console.log("deleted")
}
}
return
}
const presentCredential = async () => {
  try {
    const vcJwts = []
    const records = await fetchCredentials()
    const promises = records.map(async (record) => {
      const data = await record.data.json();
      vcJwts.push(data);
    });
    
    // Wait for all promises to settle
    await Promise.all(promises);
    
    const presentationDefinition = {
      subject: userDid
    }
    console.log( vcJwts.map((vc) => vc.credential))
    const selectedCredentials = PresentationExchange.selectCredentials(
      vcJwts.map((vc) => vc.credential),
      presentationDefinition
  )
  console.log("vcJwts satisfies Presentation Definition!")
  } catch (error) {
    console.log(`Verification failed: ${error.message}`)
  }
};

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
  uploadCredentials(vcJwt, issuer.did)

  return `credential signed sucessfully.`;
};
const verifyCredential = async (vcJwt) => {
  try {
    await VerifiableCredential.verify(vcJwt)
    return "VC Verification successful!"
  } catch (e) {
    return `VC Verification failed: ${e.message}`
  }
};

presentCredential()

export { fetchCredentials, uploadCredentials, signCredential, verifyCredential };
