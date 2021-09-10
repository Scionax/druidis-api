import RedisDB from "../core/RedisDB.ts";
import { RedisReply } from "../deps.ts";
import { User, UserRole } from "./User.ts";

/*
	// Schema for Mod Events
	count:modEvents									// Incrementing indexer for modEvents:{num} records.
	modEvents:{num}									// A historical record of all mod events that have occurred. Should dump to logs over time.
	
	u:{id}:modEvents = [{type, reason, etc}]		// Array that tracks the mod events a user has received.
*/

export const enum ModEventType {
	Report = 1,						// Track the event for context.
	ApplyWarning = 3,				// Creates an official warning for the user.
	Quiet = 5,						// Reduces someone's posting allowance or communication status. (Not yet implemented)
	Mute = 6,						// Silences someone, preventing their posting.
	TemporaryBan = 8,				// Temporarily bans.
	Ban = 10,						// Prevents someone from accessing Druidis with their account.
}

const enum AdminEventType {
	ChangeUserData = 8,
	ChangeRole = 10,
}

export const enum ModWarningType {
	None = 0,						// No applicable warning type.
	Other = 1,						// Includes any warnings that don't apply elsewhere.
	ExcessNegativity = 2,			// User has been excessively negative or demoralizing.
	Incite = 3,						// User incited hostility, anger, trolling, flaming, etc.
	Inappropriate = 5,				// Includes inappropriate behavior for the context.
	Misinformation = 8,				// User provided inaccurate information in context where it was very important.
	Hateful = 10,					// Includes racism, sexism, anti-minority, bigotry, and other forms of hate.
}

type ModEvent = {
	modId: number,					// ID of the moderator that applied the event. Is not visible to users.
	type: ModEventType,				// The type of moderation event applied.
	reason: string,					// Provides an internal (staff-only) reason or additional context for the event. May be customized by the moderator.
	warning: ModWarningType,		// The warning applied (if applicable)
	time: number,					// Timestamp of the event (seconds).
}

export abstract class Mod {
	
	static canModPerformThis(role: UserRole, type: ModEventType) {
		if(role < UserRole.Mod) { return false; }
		
		switch(type) {
			case ModEventType.Report: return true;
			case ModEventType.ApplyWarning: return true;
			case ModEventType.Quiet: return true;
			case ModEventType.Mute: return true;
		}
		
		return role >= UserRole.Staff;
	}
	
	// ----- Mod Events ----- //
	
	static async getModEventHistory(count = 25) {
		const eventCount = await RedisDB.getCounter("modEvents");
		const pl = RedisDB.db.pipeline();
		
		// Loop through and retrieve the last {count} mod events:
		const max = Math.max(1, eventCount - count);
		for(let i = eventCount; i >= max; i--) {
			await pl.get(`modEvents:${i}`);
		}
		
		const replies = await pl.flush() as RedisReply[];
		const arr: Array<string> = [];
		
		for (const [_key, value] of Object.entries(replies)) {
			arr.push(value.value() as string);
		}
		
		return arr;
	}
	
	static async getModEventsByUser(userId: number): Promise<Array<ModEvent>> {
		const modEvents = await RedisDB.db.get(`u:${userId}:modEvents`) || `[]`;
		return JSON.parse(modEvents);
	}
	
	static async createModEvent(modId: number, userId: number, type: ModEventType, reason: string, warning: ModWarningType = 0): Promise<boolean> {
		
		// Ensure that we're working with a valid User ID.
		if(!(await User.idExists(userId))) { return false; }
		
		// Verify the Mod's UserRole
		const modRole = await User.getRole(modId);
		
		// Make sure the mod can perform these actions.
		if(!(await Mod.canModPerformThis(modRole, type))) { return false; }
		
		// Generate the Mod Event
		const event: ModEvent = {
			modId: modId,
			type: type,
			reason: reason,
			warning: warning,
			time: Math.floor(Date.now() / 1000),
		}
		
		await Mod.addModEventToUserTable(userId, event);
		await Mod.addModEventToModTable(userId, event);
		
		return true;
	}
	
	static async addModEventToUserTable(userId: number, event: ModEvent) {
		
		// Retrieve existing mod events from the user:
		const eJson = await Mod.getModEventsByUser(userId);
		eJson.push(event);
		
		// Update the mod events applied to the user:
		await RedisDB.db.set(`u:${userId}:modEvents`, JSON.stringify(eJson));
		return true;
	}
	
	static async addModEventToModTable(userId: number, event: ModEvent) {
		const modName = await User.getUsername(event.modId);
		const userName = await User.getUsername(userId);
		const message = Mod.summarizeModEvent(modName, userId, userName, event.type, event.warning);
		const eventCount = await RedisDB.incrementCounter("modEvents");
		await RedisDB.db.set(`modEvents:${eventCount}`, message);
		return true;
	}
	
	// Returns a simple summary about what a mod event did.
	// Outputs a string with following format: `{userId}:Message that mods will see explaining the event.`
	static summarizeModEvent(modName: string, userId: number, userName: string, type: ModEventType, warning: ModWarningType) {
		let message = `${userId}:${modName} `;
		
		switch(type) {
			case ModEventType.Report: message += "reported"; break;
			case ModEventType.ApplyWarning: message += "warned"; break;
			case ModEventType.Quiet: message += "quieted"; break;
			case ModEventType.Mute: message += "muted"; break;
			case ModEventType.TemporaryBan: message += "temporarily banned"; break;
			case ModEventType.Ban: message += "banned"; break;
		}
		
		message += ` ${userName} `;
		
		switch(warning) {
			case ModWarningType.None: message += `without attaching a warning.`; break;
			case ModWarningType.Other: message += `for a custom reason.`; break;
			case ModWarningType.ExcessNegativity: message += `for excess negativity.`; break;
			case ModWarningType.Incite: message += `for inciting hostility.`; break;
			case ModWarningType.Inappropriate: message += `for inappropriate behavior.`; break;
			case ModWarningType.Misinformation: message += `for spreading misinformation.`; break;
			case ModWarningType.Hateful: message += `for spreading hate.`; break;
		}
		
		return message;
	}
}

