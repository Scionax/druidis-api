import RedisDB from "../core/RedisDB.ts";
import { Sanitize } from "../core/Validate.ts";
import { RedisReply } from "../deps.ts";
import { User, UserRole } from "./User.ts";

/*
	// Mod Event Global History (a global history of mod events)
	count:modEvents									// Incrementing indexer for modEvents:{num} records.
	modEvents:{num}									// A historical record of global mod events.
		`{modId}:{userId}:{type}:{warning}:{time}:{reason}`
	
	// Mod Actions (tracks the mod's actions)
	u:{id}:modActions								// List of mod actions that a mod has taken. (LPUSH, LRANGE)
		`{modEventId}`
	
	// User Reports (tracks the user reported)
	u:{id}:reports									// List that tracks the mod events reporting the given user. (LPUSH, LRANGE)
		`{modEventId}`
*/

export const enum ModEventType {
	Report = 1,						// Track the event for context.
	Warning = 3,					// Creates an official warning for the user.
	Quiet = 5,						// Reduces someone's posting allowance or communication status. (Not yet implemented)
	Mute = 6,						// Silences someone, preventing their posting.
	TemporaryBan = 8,				// Temporarily bans.
	Ban = 10,						// Prevents someone from accessing Druidis with their account.
	Invalid = -1,					// Invalid Event Type. Submission was incorrect.
}

export const enum ModWarningType {
	None = 0,						// No applicable warning type.
	Misinformation = 1,				// User provided inaccurate information, but doesn't seem intentional.
	Other = 2,						// Includes any warnings that don't apply elsewhere.
	ExcessNegativity = 3,			// User has been excessively negative or demoralizing.
	Inappropriate = 4,				// Includes inappropriate behavior for the context.
	Incite = 6,						// User incited hostility, anger, trolling, flaming, etc.
	Disinformation = 8,				// User provided grossly inaccurate information in context where it was very important.
	Hateful = 10,					// Includes racism, sexism, anti-minority, bigotry, and other forms of hate.
	Invalid = -1,					// Invalid Warning Type. Submission was incorrect.
}

type ModEvent = {
	modId: number,					// ID of the moderator that applied the event. Is not visible to users.
	userId: number,					// ID of the user being reported.
	type: ModEventType,				// The type of moderation event applied.
	warning: ModWarningType,		// The warning applied (if applicable)
	time: number,					// Timestamp of the event (seconds).
	reason: string,					// Provides an internal (staff-only) reason or additional context for the event. May be customized by the moderator.
}

export abstract class Mod {
	
	static canModPerformThis(role: UserRole, type: ModEventType) {
		if(role < UserRole.Mod) { return false; }
		
		switch(type) {
			case ModEventType.Report: return true;
			case ModEventType.Warning: return true;
			case ModEventType.Quiet: return true;
			case ModEventType.Mute: return true;
		}
		
		return role >= UserRole.SuperMod;
	}
	
	// ----- Type Conversions ----- //
	
	// Submission Data to ModEventType
	static getModEventType(eventTypeNum: number): ModEventType {
		switch(eventTypeNum) {
			case ModEventType.Report: return ModEventType.Report;
			case ModEventType.Warning: return ModEventType.Warning;
			case ModEventType.Quiet: return ModEventType.Quiet;
			case ModEventType.Mute: return ModEventType.Mute;
			case ModEventType.TemporaryBan: return ModEventType.TemporaryBan;
			case ModEventType.Ban: return ModEventType.Ban;
		}
		
		return ModEventType.Invalid;
	}
	
	// Submission Data to ModWarningType
	static getModWarningType(warningNum: number): ModWarningType {
		switch(warningNum) {
			case ModWarningType.None: return ModWarningType.None;
			case ModWarningType.Misinformation: return ModWarningType.Misinformation;
			case ModWarningType.Other: return ModWarningType.Other;
			case ModWarningType.ExcessNegativity: return ModWarningType.ExcessNegativity;
			case ModWarningType.Inappropriate: return ModWarningType.Inappropriate;
			case ModWarningType.Incite: return ModWarningType.Incite;
			case ModWarningType.Disinformation: return ModWarningType.Disinformation;
			case ModWarningType.Hateful: return ModWarningType.Hateful;
		}
		
		return ModWarningType.Invalid;
	}
	
	// ----- Mod Events ----- //
	
	static async getModEventHistory(count = 25): Promise<ModEvent[]> {
		const eventCount = await RedisDB.getCounter("modEvents");
		const pl = RedisDB.db.pipeline();
		
		// Loop through and retrieve the last {count} mod events:
		const max = Math.max(1, eventCount - count);
		for(let i = eventCount; i >= max; i--) {
			await pl.get(`modEvents:${i}`);
		}
		
		const replies = await pl.flush() as RedisReply[];
		const arr: ModEvent[] = [];
		
		for(const [_key, value] of Object.entries(replies)) {
			const event = Mod.parseModEventString(value.value() as string);
			arr.push(event);
		}
		
		return arr;
	}
	
	static async getModEvent(modEventId: number): Promise<ModEvent> {
		const rawEvent = (await RedisDB.db.get(`modEvents:${modEventId}`)) || "";
		return Mod.parseModEventString(rawEvent);
	}
	
	static async getModEventsByIds(ids: string[]): Promise<ModEvent[]> {
		const arr: ModEvent[] = [];
		const pl = RedisDB.db.pipeline();
		
		for(let i = 0; i < ids.length; i++) {
			await pl.get(`modEvents:${ids[i]}`);
		}
		
		const replies = await pl.flush() as RedisReply[];
		
		for(const [_key, value] of Object.entries(replies)) {
			const event = Mod.parseModEventString(value.value() as string);
			arr.push(event);
		}
		
		return arr;
	}
	
	static async getModReports(userId: number, start = 0, count = 10): Promise<ModEvent[]> {
		const ids = await RedisDB.db.lrange(`u:${userId}:reports`, start, start + count) || [];
		return Mod.getModEventsByIds(ids);
	}
	
	static async getModActions(modId: number, start = 0, count = 10): Promise<ModEvent[]> {
		const ids = await RedisDB.db.lrange(`u:${modId}:modActions`, start, start + count) || [];
		return Mod.getModEventsByIds(ids);
	}
	
	// Returns ID of the created Mod Event (or 0 on failure)
	static async createModEvent(modId: number, userId: number, type: ModEventType, reason: string, warning: ModWarningType = ModWarningType.None): Promise<number> {
		
		// Ensure that we're working with a valid User ID.
		if(!(await User.idExists(userId))) { return 0; }
		
		// Verify the Mod's UserRole
		const modRole = await User.getRole(modId);
		
		// Make sure the mod can perform these actions.
		if(!(await Mod.canModPerformThis(modRole, type))) { return 0; }
		
		// Generate the Mod Event
		const event: ModEvent = {
			modId: modId,
			userId: userId,
			type: type,
			warning: warning,
			time: Math.floor(Date.now() / 1000),
			reason: reason,
		}
		
		// Record the mod globally, and attach it to the user and mod related to the event.
		const modEventId = await Mod.addModEventToHistory(event);
		
		await Mod.attachModReportToUser(userId, modEventId);
		await Mod.attachModActionToMod(modId, modEventId);
		
		return modEventId;
	}
	
	static async attachModReportToUser(userId: number, modEventId: number) {
		return await RedisDB.db.lpush(`u:${userId}:reports`, `${modEventId}`);
	}
	
	static async attachModActionToMod(modId: number, modEventId: number) {
		return await RedisDB.db.lpush(`u:${modId}:modActions`, `${modEventId}`);
	}
	
	static async addModEventToHistory(event: ModEvent): Promise<number> {
		const eventCount = await RedisDB.incrementCounter("modEvents");
		const reason = Sanitize.sentence(event.reason.replace("~", "-"));
		await RedisDB.db.set(`modEvents:${eventCount}`, `${event.modId}~${event.userId}~${event.type}~${event.warning}~${event.time}~${reason}`);
		return eventCount;
	}
	
	static parseModEventString(eventStr: string): ModEvent {
		const split = eventStr.split("~");
		
		return {
			modId: Number(split[0]) || 0,
			userId: Number(split[1]) || 0,
			type: (Number(split[2]) || 0) as ModEventType,
			warning: (Number(split[3]) || 0) as ModWarningType,
			time: Number(split[4]) || 0,
			reason: split[5],
		};
	}
	
	// Returns a simple summary about what a mod event did.
	// Outputs a string with following format: `{userId}:Message that mods will see explaining the event.`
	static summarizeModEvent(modName: string, userName: string, type: ModEventType, warning: ModWarningType) {
		let message = `${modName} `;
		
		switch(type) {
			case ModEventType.Report: message += "reported"; break;
			case ModEventType.Warning: message += "warned"; break;
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
			case ModWarningType.Disinformation: message += `for spreading misinformation.`; break;
			case ModWarningType.Hateful: message += `for spreading hate.`; break;
		}
		
		return message;
	}
}

