import forge from "node-forge";

export async function generateKeyPair(): Promise<{
  publicKeyPem: string;
  privateKeyPem: string;
}> {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair(
      { bits: 2048, workers: 2 },
      (err: Error | null, keypair: forge.pki.rsa.KeyPair) => {
        if (err) return reject(err);
        resolve({
          publicKeyPem: forge.pki.publicKeyToPem(keypair.publicKey),
          privateKeyPem: forge.pki.privateKeyToPem(keypair.privateKey),
        });
      }
    );
  });
}
