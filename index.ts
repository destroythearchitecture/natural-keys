import * as openpgp from 'openpgp';
import Rand from 'rand-seed';

async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await (global as any).crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

let rand: Rand;

(global as any).crypto.getRandomValues = function<T extends ArrayBufferView | null>(array: T): T{
  if (!array) {
    return array;
  }

  if (!(array instanceof Uint8Array)) {
    throw new Error('Invalid buffer')
  }

  const bytes = new Array(array.byteLength)

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = rand.next() * 255
  }

  array.set(bytes)
  
  return array;
}

async function main() {
  rand = new Rand(await digestMessage('foobar'));

  const { publicKey, privateKey, revocationCertificate } = await openpgp.generateKey({
    userIDs: [
      { name: 'test', email: 'test@test.com', comment: 'nah' }
    ],
    passphrase: 'test',
    type: 'ecc',
    curve: 'curve25519',
    keyExpirationTime: 0,
    date: new Date(0),
    format: 'armored'
  })

  console.log(privateKey)
  console.log(publicKey)
  console.log(revocationCertificate)

  const test = await openpgp.readKey({ armoredKey: publicKey })
  const result = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: 'hello world' }),
    encryptionKeys: test
  })
  console.log(result)
}

main()