import RedisDB from "../core/RedisDB.ts";
import Validate from "../core/Validate.ts";

/*
	UserRequest
		Handle
		Password
		
		Email
		IP
		First Name
		Last Name
		Country
		State or Province
		Postal / Zip Code
		Date of Birth
		Website
		YouTube
		Facebook
		Twitter
		How did you learn about us?
		Voucher Code
		
		A user's vouchers are hashes of {handle}:vouch:1, {handle}:vouch:2, and so on.
			- Once the user uses a voucher, that voucher is locked to that user.
*/

export class User implements User {
	
	// User Traits
	private username: string;
	
	// Static Trackers
	private static _userMin = 6;
	private static _userMax = 16;
	private static _passMin = 6;
	
	constructor(handle: string) {
		this.username = handle;
	}
	
	// public static getUser(name: string): User {}
	
	async getUser() {
		await RedisDB.getHashTable(`user:${this.username}`);
	}
	
	verifyUsername(username: string) {
		
		// Username is provided
		if(!username || typeof username !== "string" || username.length === 0) { return "Must provide a valid username."; }
		
		// Username Length
		if(username.length < User._userMin) { return `Username must have at least ${User._userMin} characters.`; }
		if(username.length > User._userMax) { return `Username cannot exceed ${User._userMax} characters.`; }
		
		// Valid Username
		if(!Validate.isSafeWord(username)) { return `Username may only contain letters, numbers, and underscores.`; }
		
		// Username Taken
		// TODO: Username Taken
		
		return "";
	}
	
	verifyPassword(password: string) {
		
		// Password is provided
		if(!password || typeof password !== "string" || password.length === 0) { return "Must provide a valid password."; }
		
		// Password Length
		if(password.length < User._userMin) { return `Password must have at least ${User._passMin} characters.`; }
		
		// Password 
	}
}

export const enum AccountValidation {
	Valid = 0,
	
	// Missing Values
	MustProvideEmail = 2,
	
	// Already Taken
	EmailTaken = 6,
	
	// Invalid Lengths
	FreeAccountTooShort = 13,			// Six Characters Required
	
	// Password
	PasswordDoesNotMatch = 15,
	
	// Invalid Values
	EmailInvalid = 21,
	PasswordInvalid = 22,
	FreeAccountRequiredChars = 23,		// Must contain a number or underscore.
	
	// Other Issues
	AccountBanned = 30,
	CannotPerformAction = 31,
}
