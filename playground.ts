// deno run --unstable --allow-net --allow-write --allow-read --allow-run --allow-env playground.ts --runDirect

import Crypto from "./core/Crypto.ts";
import { log } from "./deps.ts";

export default abstract class Playground {
	
	static runOnServerLoad() {
		Playground.runOnServerLoadAsync();
		return true;
	}
	
	static async runOnServerLoadAsync() {
		
		// const keyRS384CryptoKeyPair = await window.crypto.subtle.generateKey(
		// 	{
		// 		name: "RSASSA-PKCS1-v1_5",
		// 		modulusLength: 4096,
		// 		publicExponent: new Uint8Array([1, 0, 1]),
		// 		hash: "SHA-384",
		// 	},
		// 	true,
		// 	["verify", "sign"],
		// );
		
		// const { privateKey, publicKey } = keyRS384CryptoKeyPair;
		
		// const pemExported = await Crypto.generatePemFromPrivateCryptoKey(privateKey);
		
		// const importedCryptoKey = await Crypto.importPrivateKey(pemExported);
		
		// const areEqualKeys =
		// pemExported === await Crypto.generatePemFromPrivateCryptoKey(importedCryptoKey);
		
		// console.log("---- keys equal ---- ");
		// console.log(areEqualKeys);
	}
	
	static async runOnDirectLoad() {
		
		const { files } = await Deno.emit("../scripts/druidis.ts");
		for (const [fileName, text] of Object.entries(files)) {
			log.info(`emitted ${fileName} with a length of ${text}`);
		}
	}
}

if(Deno.args.indexOf("--runDirect") > -1) {
	await Playground.runOnDirectLoad();
}
