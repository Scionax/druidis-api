import RedisDB from "../core/RedisDB.ts";
import { Sanitize } from "../core/Validate.ts";
import { RedisReply } from "../deps.ts";
import { User, UserRole } from "./User.ts";

/*
	// Mod Event Global History (a global history of mod events)
	count:modEvents									// Incrementing indexer for modEvents:{num} records.
	modEvents:{num}									// A historical record of global mod events.
		`{modId}:{userId}:{type}:{warn}:{reason}:{time}`
	
	// Mod Actions (tracks the mod's actions)
	u:{id}:modActions								// List of mod actions that a mod has taken. (LPUSH, LRANGE)
		`{modEventId}`
	
	// User Reports (tracks the user reported)
	u:{id}:reports									// List that tracks the mod events reporting the given user. (LPUSH, LRANGE)
		`{modEventId}`
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
	userId: number,					// ID of the user being reported.
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
	
	static async getModReports(userId: number, start = 0, count = 10): Promise<string[]> {
		return await RedisDB.db.lrange(`u:${userId}:reports`, start, start + count) || [];
	}
	
	static async getModActions(modId: number, start = 0, count = 10): Promise<string[]> {
		return await RedisDB.db.lrange(`u:${modId}:modActions`, start, start + count) || [];
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
			userId: userId,
			modId: modId,
			type: type,
			reason: reason,
			warning: warning,
			time: Math.floor(Date.now() / 1000),
		}
		
		// Record the mod globally, and attach it to the user and mod related to the event.
		const modEventId = await Mod.addModEventToHistory(event);
		
		await Mod.attachModReportToUser(userId, modEventId);
		await Mod.attachModActionToMod(modId, modEventId);
		
		return true;
	}
	
	static async attachModReportToUser(userId: number, modEventId: number) {
		return await RedisDB.db.lpush(`u:${userId}:reports`, `${modEventId}`);
	}
	
	static async attachModActionToMod(modId: number, modEventId: number) {
		return await RedisDB.db.lpush(`u:${modId}:modActions`, `${modEventId}`);
	}
	
	static async addModEventToHistory(event: ModEvent): Promise<number> {
		const eventCount = await RedisDB.incrementCounter("modEvents");
		const reason = Sanitize.sentence(event.reason.replace(":", ""));
		await RedisDB.db.set(`modEvents:${eventCount}`, `${event.modId}:${event.userId}:${event.type}:${event.warning}:${event.time}:${reason}`);
		return eventCount;
	}
	
	// Returns a simple summary about what a mod event did.
	// Outputs a string with following format: `{userId}:Message that mods will see explaining the event.`
	static summarizeModEvent(modName: string, userName: string, type: ModEventType, warning: ModWarningType) {
		let message = `${modName} `;
		
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

