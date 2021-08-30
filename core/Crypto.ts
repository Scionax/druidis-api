import { createHash } from "../deps.ts";

export default abstract class Crypto {
	
	static safeHash(pass: string, length = 16): string {
		return createHash("sha3-512").update(pass).toString("base64").substring(0, length);
	}
	
	static simpleHash(pass: string, length = 4): string {
		let hash = createHash("md5").update(pass).toString("base64").substring(2, length + 2);
		hash = hash.replace('/', "L");
		hash = hash.replace("+", "X");
		return hash;
	}
	
	private static convertToReadableHash( hash: string ): string {
		
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
}
