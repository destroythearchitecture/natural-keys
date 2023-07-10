import * as openpgp from 'openpgp';
import Rand from 'rand-seed';
import React from 'react';
import { render, Text, Box } from 'ink';
import parseArgs from 'minimist';
async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await global.crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}
let rand;
global.crypto.getRandomValues = function (array) {
    if (!array) {
        return array;
    }
    if (!(array instanceof Uint8Array)) {
        throw new Error('Invalid buffer');
    }
    const bytes = new Array(array.byteLength);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = rand.next() * 255;
    }
    array.set(bytes);
    return array;
};
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args['help'] === true || args['h'] === true) {
        render(React.createElement(Text, null, "natural-keys: --seed aaaa --name 'test person' --email test@test.com --comment 'my key' --passphrase somepassphrase"));
        process.exit();
    }
    for (const arg of ['seed', 'name', 'email', 'comment', 'passphrase']) {
        if (args[arg] === undefined) {
            throw new Error(`Missing argument --${arg}`);
        }
    }
    const { seed, name, email, comment, passphrase } = args;
    rand = new Rand.default(await digestMessage(seed));
    const { publicKey, privateKey, revocationCertificate } = await openpgp.generateKey({
        userIDs: [
            { name, email, comment }
        ],
        passphrase,
        type: 'ecc',
        curve: 'curve25519',
        keyExpirationTime: 0,
        date: new Date(0),
        format: 'armored'
    });
    const test = await openpgp.readKey({ armoredKey: publicKey });
    const result = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: 'test encryption' }),
        encryptionKeys: test
    });
    if (!result) {
        throw new Error("Invalid key generated");
    }
    const Keys = () => {
        return React.createElement(Box, { flexDirection: 'column', paddingBottom: 1 },
            React.createElement(Text, { color: "red" }, "Private Key"),
            React.createElement(Box, { borderStyle: "single", width: 62, flexDirection: 'column' },
                React.createElement(Text, null, privateKey)),
            React.createElement(Text, { color: "green" }, "Public Key"),
            React.createElement(Box, { borderStyle: "single", width: 62, flexDirection: 'column' },
                React.createElement(Text, null, publicKey)),
            React.createElement(Text, { color: "blue" }, "Revocation Certificate"),
            React.createElement(Box, { borderStyle: "single", width: 62, flexDirection: 'column' },
                React.createElement(Text, null, revocationCertificate)));
    };
    render(React.createElement(Keys, null));
}
main();
//# sourceMappingURL=index.js.map