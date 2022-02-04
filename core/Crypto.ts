import { encode64 } from "../deps.ts";

export default abstract class Crypto {
	
	// SHA-512
	static async safeHash(pass: string, length = 32) {
		
		const hashArray = new Uint8Array(
			await crypto.subtle.digest("SHA-512", new TextEncoder().encode(pass)),
		)
		
		return encode64(hashArray).substring(0, length);
	}
	
	// Simple Hash (SHA1), Tiny
	static async simpleHash(pass: string, length = 4) {
		
		const hashArray = new Uint8Array(
			await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pass)),
		)
		
		let hash = encode64(hashArray).substring(2, length + 2);
		hash = hash.replace('/', "L");
		hash = hash.replace("+", "X");
		return hash;
	}
	
	public static convertToReadableHash( hash: string ): string {
		
		// Removes anything that isn't base64 (except for underscores) and upper-cases it.
		let desired = hash.replace(/[^\w\\\+]/gi, '').toUpperCase();
		
		// Replace any potentially confusing characters.
		desired = desired.replace(/I/g, "T");
		desired = desired.replace(/U/g, "V");
		desired = desired.replace(/0/g, "O");
		desired = desired.replace(/1/g, "L");
		desired = desired.replace(/2/g, "Z");
		desired = desired.replace(/3/g, "E");
		desired = desired.replace(/4/g, "Y");
		desired = desired.replace(/5/g, "S");
		desired = desired.replace(/6/g, "G");
		desired = desired.replace(/7/g, "R");
		desired = desired.replace(/8/g, "B");
		desired = desired.replace(/9/g, "P");
		desired = desired.replace(/\+/g, "H");
		desired = desired.replace(/\\/g, "X");
		
		return desired;
	}
	
	// // Import a PEM encoded RSA private key, to use for RSA-PSS signing.
	// // Takes a string containing the PEM encoded key, and returns a Promise
	// // that will resolve to a CryptoKey representing the private key.
	// static importPrivateKey(pem: string) {
		
	// 	// fetch the part of the PEM string between header and footer
	// 	const pemHeader = "-----BEGIN PRIVATE KEY-----";
	// 	const pemFooter = "-----END PRIVATE KEY-----";
	// 	const pemContents = pem.substring(
	// 		pemHeader.length,
	// 		pem.length - pemFooter.length,
	// 	);
		
	// 	const binaryDer = decode64(pemContents).buffer;
		
	// 	return window.crypto.subtle.importKey(
	// 		"pkcs8",
	// 		binaryDer,
	// 		{
	// 		name: "RSASSA-PKCS1-v1_5",
	// 		hash: "SHA-384",
	// 		},
	// 		true,
	// 		["sign"],
	// 	);
	// }
	
	// static async generatePemFromPrivateCryptoKey(privateKey: CryptoKey) {
	// 	const exportedKey = await crypto.subtle.exportKey("pkcs8", privateKey);
	// 	const exportedAsBase64 = encode64(exportedKey);
	// 	return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
	// }
}
