import { Sha256, Md5 } from "../deps.ts";

export default abstract class Crypto {
	
	// Yes, I know bcrypt would be better and that global salts can be broken if the database is stolen.
	// But this is a game, not a bank. We can always update the password security later through this wrapper.
	static passwordHash( password: string ): string {
		const sha256 = new Sha256();
		sha256.update("d0D9OFSji4CsD2f83SMO" + password);
		return sha256.toString();
	}
	
	static getUserHash( username: string ): string {
		const md5 = new Md5();
		const hash = md5.update(username).toString("base64").substring(0, 7);
		return Crypto.safeConvert(hash);
	}
	
	static verifyUserHash( levelHash: string, username: string ): boolean {
		return levelHash.substring(0, 7) === Crypto.getUserHash( username );
	}
	
	private static safeConvert( hash: string ): string {
		
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
