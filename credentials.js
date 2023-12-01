import { web5, userDid } from "./index.js";


const uploadCredentials=async (vcJwt, issuer) => {
    //verify credential 
    try {
        // await VerifiableCredential.verify(vcJwt)
        // store credential 
        const { record } = await web5.dwn.records.create({
            data: {
                issuer: issuer,
                credential: vcJwt,
                subject:userDid
            },
            message: {
                dataFormat: 'application/json'
            }
        });
        console.log("VC Verification successful!")
        console.log(record)
      } catch (e) {
        console.log(`VC Verification failed: ${e.message}`)
      }
    
}
//trying to fetch credentials
let { record } = await web5.dwn.records.read({
    message: {
      filter: {
        author:userDid
      }
    }
  });
  
  // assuming the record has a text payload
  const text = await record.data.text();
  console.log(text)

const shareCredentials=async () => {

    // convert signed credentials to json
    
    //share to verufying party
}

// uploadCredentials('drivers license', "monday")