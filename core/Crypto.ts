import { Sha256, Md5 } from "../deps.ts";

export default abstract class Crypto {
	
	static simpleHash(pass: string, length = 4): string {
		return new Md5().update(pass).toString("base64").substring(2, length + 2);
	}
	
	static createSha(pass: string): string {
		return new Sha256().update(pass).toString();
	}
	
	static getUserHash( username: string ): string {
		const md5 = new Md5();
		const hash = md5.update(username).toString("base64").substring(0, 7);
		return Crypto.convertToReadableHash(hash);
	}
	
	static verifyUserHash( levelHash: string, username: string ): boolean {
		return levelHash.substring(0, 7) === Crypto.getUserHash( username );
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
