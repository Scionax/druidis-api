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
	u:{id}:comm = [Community1, Community2]				// List of communities the user is subscribed to.
	u:{id}:subs = [Sub1, Sub2]							// List of forums the user is subscribed to.
	u:{id}:allowComment = 1
	u:{id}:allowPost = 1
	u:{id}:karma = ??
	u:{id}:vouchers = #									// Number of remaining vouchers.
	r:{id} = [friendId, friendId]						// List of relationships (often friends) the user has with other users.
	r:{id}:{id} = relationshipEnum						// The "Relationship" table. First {id} is user, second {id} is related user.
	
	u:{id}:ip = ipAddress								// Not sure how I want to handle IP's yet. Maybe in a fingerprint/cookie object.
*/

type UserProfile = {
	email?: string;
	firstName?: string,
	lastName?: string;
	country?: string;
	state?: string;
	zip?: string;
	dobYear?: number;
	dobMonth?: number;
	dobDay?: number;
	website?: string;				// Personal website of the user.
}

export abstract class User implements User {
	
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
	
	static async setProfile(
		id: number,
		email: string,
		firstName: string,
		lastName: string,
		country: string,
		state: string,
		zip: string,
		dobYear: string,
		dobMonth: string,
		dobDay: string,
		website: string,
	): Promise<boolean> {
		const profile = {email, firstName, lastName, country, state, zip, dobYear, dobMonth, dobDay, website};
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
		const someUser = (await Mapp.redis.get(`u:${id}`)) || "";
		return (someUser && typeof someUser === "string" && someUser.length > 0) ? true : false;
	}
	
	static async usernameExists(username: string): Promise<boolean> {
		const someUser = Number(await Mapp.redis.get(`u:${username}`)) || 0;
		return (someUser && typeof someUser === "number" && someUser > 0) ? true : false;
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
	
	// ----- Validation for User Creation ----- //
	
	static verifyUsername(username: string) {
		if(!username || typeof username !== "string" || username.length === 0) { return "Must provide a valid username."; }
		if(username.length < User._userMin) { return `Username must have at least ${User._userMin} characters.`; }
		if(username.length > User._userMax) { return `Username cannot exceed ${User._userMax} characters.`; }
		if(!Validate.isSafeWord(username)) { return `Username may only contain letters, numbers, and underscores.`; }
		// TODO: Username Taken
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
		// TODO: Email Taken.
		return "";
	}
}

