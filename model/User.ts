import Crypto from "../core/Crypto.ts";
import Mapp from "../core/Mapp.ts";
import RedisDB from "../core/RedisDB.ts";
import Validate from "../core/Validate.ts";

/*
	// User Tables
	u:{username} = id
	u:{id} = username
	u:{id}:pass = password
	u:{id}:last = lastTimeUpdate
	u:{id}:time = timeSpentOnSite
	u:{id}:profile = profileData						// First Name, Last Name, Country, State/Province, Postal Code, DOB, Email, Website, etc.
	u:{id}:token = tokenHash							// The current token. If a cookie uses this token for the user, it can log in.
	
	// Planned for, or considered, but not yet implemented:
	u:{id}:comm = [Community1, Community2] or Sorted Set		// List of communities the user is subscribed to.
	u:{id}:subs = [Sub1, Sub2] or Sorted Set					// List of forums the user is subscribed to.
	u:{id}:allowComment = 1
	u:{id}:allowPost = 1
	u:{id}:karma = ??
	u:{id}:vouchers = #									// Number of remaining vouchers.
	r:{id} = [friendId, friendId]						// List of relationships (often friends) the user has with other users.
	r:{id}:{id} = relationshipEnum						// The "Relationship" table. First {id} is user, second {id} is related user.
	
	u:{id}:ip = ipAddress								// Not sure how I want to handle IP's yet. Maybe in a fingerprint/cookie object.
	
	// Cookie: ${id}.${token}
	id - the id of the user
	token - some random token, saved into user table
	
	// Related Tables
	count:users					// User Index. Tracks the number of users and returns the next User ID.
*/

// Can use User.convertToUserProfile(email, firstName, lastName, ...) to convert to UserProfile type.
type UserProfile = {
	email?: string;
	firstName?: string,
	lastName?: string;
	country?: string;
	state?: string;
	city?: string;
	zip?: string;
	dobYear?: number;
	dobMonth?: number;
	dobDay?: number;
	website?: string;				// Personal website of the user.
}

export abstract class User {
	
	// Static Trackers
	private static _userMin = 6;
	private static _userMax = 16;
	private static _passMin = 8;
	
	// ----- Retrieve User Data ----- //
	
	static async getId(username: string) { return Number(await Mapp.redis.get(`u:${username}`)) || 0; }
	static async getUsername(id: number) { return (await Mapp.redis.get(`u:${id}`)) || ""; }
	static async getPassword(id: number) { return (await Mapp.redis.get(`u:${id}:pass`)) || ""; }
	static async getIP(id: number) { return (await Mapp.redis.get(`u:${id}:ip`)) || ""; }
	static async getLastTime(id: number) { return Number(await Mapp.redis.get(`u:${id}:last`)) || 0; }
	static async getTimeSpent(id: number) { return Number(await Mapp.redis.get(`u:${id}:time`)) || 0; }
	static async getProfile(id: number): Promise<UserProfile> { return (await RedisDB.getHashTable(`u:${id}:profile`)) || {}; }
	
	// ----- Set User Data ----- //
	
	static async changeUsername(id: number, newUsername: string): Promise<boolean> {
		
		// Ensure that we're working with a valid ID.
		if(!await User.idExists(id)) { return false; }
		
		// Can't allow the same user to be named twice.
		if(await User.usernameExists(newUsername)) { return false; }
		
		// Update Username
		if(!(await Mapp.redis.set(`u:${id}`, newUsername))) { return false; }
		
		return true;
	}
	
	static async setProfile(id: number, profile: UserProfile): Promise<boolean> {
		await Mapp.redis.set(`u:${id}:profile`, JSON.stringify(profile));
		return true;
	}
	
	static async setPassword(id: number, password: string): Promise<string> {
		const passHash = Crypto.safeHash(password);
		return await Mapp.redis.set(`u:${id}:pass`, passHash);
	}
	
	// addCommunity 	// adds a new community
	// addSub			// adds a new sub (RedisDB.addToArray(hash)
	// removeCommunity
	// removeSub
	
	// ----- Checks ----- //
	
	static async idExists(id: number): Promise<boolean> {
		const userId = (await Mapp.redis.get(`u:${id}`)) || "";
		return (userId && typeof userId === "string" && userId.length > 0) ? true : false;
	}
	
	static async usernameExists(username: string): Promise<boolean> {
		const userId = await User.getId(username);
		return userId > 0;
	}
	
	static async isCorrectPassword(username: string, password: string): Promise<boolean> {
		const userId = await User.getId(username);
		const hash = await User.getPassword(userId);
		return hash === Crypto.safeHash(password);
	}
	
	// ----- Time Updatees ----- //
	
	static async updateTime(id: number) {
		const lastTime = await User.getLastTime(id);
		
		// If the time setting doesn't exist, create it.
		if(!lastTime) { User.updateLastTimeAsync(id); return; }
		
		const time = Math.floor(Date.now() / 1000);
		const diff = time - lastTime;
		
		// Don't update the time if it's been less than ten seconds.
		if(diff < 10) { return; }
		
		// Activity is within 90 seconds, partial activity is within 3 minutes, inactive time over 3 minutes.
		if(diff < 90) { User.updateTimeSpentAsync(id, diff); }
		else if(diff < 180) { User.updateTimeSpentAsync(id, Math.floor(diff / 2)); }
		
		// Must update the last time check:
		User.updateLastTimeAsync(id);
	}
	
	private static updateLastTimeAsync(id: number) {
		Mapp.redis.set(`u:${id}:last`, Math.floor(Date.now() / 1000));
	}
	
	private static updateTimeSpentAsync(id: number, addSeconds: number) {
		User.getTimeSpent(id).then((value: number) => {
			Mapp.redis.set(`u:${id}:time`, value + addSeconds)
		});
	}
	
	// ----- Cookies & Tokens ----- //
	
	// Returns an ID if the cookie is valid, or 0 if the cookie is invalid.
	// const id = User.verifyLoginCookie(cookies.login);
	static async verifyLoginCookie(loginCookie: string): Promise<number> {
		if(!loginCookie || loginCookie.indexOf(".") < 0) { return 0; }
		
		// Recover the ID and the Token
		const log = loginCookie.split(".");
		const id = Number(log[0]) || 0;
		if(!id || !log[1]) { return 0; }
		
		// Verify if the user has the relevant cookie token:
		const verify = await User.verifyToken(id, log[1]);
		
		// If successful, return the user ID. Otherwise, return 0.
		return verify ? id : 0;
	}
	
	private static async updateToken(id: number): Promise<string> {
		const token = Crypto.safeHash(Math.random().toString(16), 20);
		await Mapp.redis.set(`u:${id}:token`, token);
		return token;
	}
	
	// Retrieves the current Cookie token, or generates a new one if not available.
	static async getToken(id: number, autoGenerate: boolean): Promise<string> {
		let token = (await Mapp.redis.get(`u:${id}:token`)) as string || "";
		
		// If we don't have an existing token, create oone.
		if(!token && autoGenerate) {
			token = await this.updateToken(id);
		}
		
		return token;
	}
	
	// Purges the token, such as when logging out.
	static async clearToken(id: number): Promise<true> {
		await Mapp.redis.set(`u:${id}:token`, "");
		return true;
	}
	
	static async verifyToken(id: number, tokenSent: string) {
		const token = await User.getToken(id, false);
		if(!token || !tokenSent) { return false; }
		return token === tokenSent;
	}
	
	// ----- Validation for User Creation ----- //
	
	static async canCreateUser(username: string, password: string, email: string, profile: UserProfile): Promise<string> {
		
		// Verify Username
		const usernameIssue = await User.verifyUsername(username);
		if(usernameIssue !== "") { return usernameIssue; }
		
		// Verify Password
		const passwordIssue = User.verifyPassword(password);
		if(passwordIssue !== "") { return passwordIssue; }
		
		// Verify Email
		const emailIssue = User.verifyEmail(email);
		if(emailIssue !== "") { return emailIssue; }
		
		// Verify Profile (Optional Submissions)
		const profileIssue = User.verifyProfileData(profile);
		if(profileIssue !== "") { return profileIssue; }
		
		// Creation Tests Passed. User creation is allowed.
		return "";
	}
	
	static async createUser(username: string, password: string, email: string, profile: UserProfile): Promise<number> {
		
		// Current method for storing email:
		profile.email = email;
		
		// Get a new User ID
		// TODO: Redis Transaction (tx)
		const id = await RedisDB.incrementCounter(`users`);
		
		// Create the user
		// TODO: These can all be activated at once with transaction.
		await Mapp.redis.set(`u:${id}`, username);
		await Mapp.redis.set(`u:${username}`, id);
		await User.setPassword(id, password);
		await User.setProfile(id, profile);
		await Mapp.redis.set(`u:${id}:time`, 0);
		
		return id;
	}
	
	// ----- Conversions ----- //
	
	static convertToProfileData(
		email: string,
		firstName: string,
		lastName: string,
		country: string,
		state: string,
		zip: string,
		dobYear: string | number,
		dobMonth: string | number,
		dobDay: string | number,
		website: string,
		
	): UserProfile {
		if(typeof dobYear === "string") { dobYear = Number(dobYear) || 0; }
		if(typeof dobMonth === "string") { dobMonth = Number(dobMonth) || 0; }
		if(typeof dobDay === "string") { dobDay = Number(dobDay) || 0; }
		return {email, firstName, lastName, country, state, zip, dobYear, dobMonth, dobDay, website};
	}
	
	// ----- Validation for User Creation ----- //
	
	static async verifyUsername(username: string) {
		if(!username || typeof username !== "string" || username.length === 0) { return "Must provide a valid username."; }
		if(username.length < User._userMin) { return `Username must have at least ${User._userMin} characters.`; }
		if(username.length > User._userMax) { return `Username cannot exceed ${User._userMax} characters.`; }
		if(!Validate.isSafeWord(username)) { return `Username may only contain letters, numbers, and underscores.`; }
		if(await User.usernameExists(username)) { return `Username is already taken.`; }
		return "";
	}
	
	static verifyPassword(password: string) {
		if(!password || typeof password !== "string" || password.length === 0) { return "Must provide a valid password."; }
		if(password.length < User._userMin) { return `Password must have at least ${User._passMin} characters.`; }
		return "";
	}
	
	static verifyEmail(email: string) {
		if(!email || typeof email !== "string" || email.length === 0) { return "Must provide a valid password."; }
		if(!Validate.isEmailFormatted(email)) { return "Email is not in the correct format."; }
		return "";
	}
	
	static verifyProfileData(profile: UserProfile, requireName = false, requireBirth = false, requireLocation = false) {
		
		// Verify Birth Date
		if(requireBirth) {
			if(!profile.dobYear) { return `A birth year is required.`; }
			if(!profile.dobMonth) { return `A birth month is required.`; }
			if(!profile.dobDay) { return `A birth day is required.`; }
		}
		
		if(profile.dobYear) {
			const curYear = new Date().getFullYear();
			if(!Validate.isPositiveNumber(profile.dobYear, curYear, 1900)) { return `An invalid birth year was provided.`; }
		}
		
		if(profile.dobMonth) {
			if(!Validate.isPositiveNumber(profile.dobMonth, 1, 12)) { return `Birth month must be between 1 and 12.`; }
		}
		
		if(profile.dobDay) {
			if(!Validate.isPositiveNumber(profile.dobDay, 1, 31)) { return `Birth day must be between 1 and 31.`; }
		}
		
		// Verify Name
		if(requireName) {
			if(!profile.firstName) { return `Must provide a name.`; }
			if(!profile.lastName) { return `Must provide a last name.`; }
		}
		
		if(profile.firstName) {
			if(!Validate.isName(profile.firstName, 32)) { return `First Name must be letters only, up to 32 characters.`; }
		}
		
		if(profile.lastName) {
			if(!Validate.isName(profile.lastName, 32)) { return `Last Name must be letters only, up to 32 characters.`; }
		}
		
		// Verify Location
		if(requireLocation) {
			if(!profile.country) { return `Must provide your country of residence.`; }
			if(!profile.state) { return `Must provide your state or province of residence.`; }
			if(!profile.city) { return `Must provide your city of residence.`; }
			if(!profile.zip) { return `Must provide your postal code.`; }
		}
		
		if(profile.country) {
			if(!Validate.isName(profile.country, 32)) { return `Country names must be letters only, up to 32 characters.`; }
		}
		
		if(profile.state) {
			if(!Validate.isName(profile.state, 32)) { return `State names must be letters only, up to 32 characters.`; }
		}
		
		if(profile.city) {
			if(!Validate.isName(profile.city, 32)) { return `City names must be letters only, up to 32 characters.`; }
		}
		
		if(profile.zip) {
			if(!(profile.zip.match(/[a-z0-9-]/gi))) { return `Postal code must be alphanumeric (dashes allowed).`; }
		}
		
		return "";
	}
}

