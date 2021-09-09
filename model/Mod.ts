import RedisDB from "../core/RedisDB.ts";
import { User, UserRole } from "./User.ts";

const enum ModEventType {
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

const enum ModWarningType {
	None = 0,						// No applicable warning type.
	Other = 1,						// Includes any warnings that don't apply elsewhere.
	ExcessNegativity = 4,			// User has been excessively negative or demoralizing.
	Inappropriate = 6,				// Includes inappropriate behavior for the context.
	Misinformation = 8,				// User provided inaccurate information in context where it was very important.
	Bigotry = 10,					// Includes sexism, racism, anti-minority, and other forms of hate.
}

// u:{id}:modEvents = [{type, reason, etc}]	// An array that tracks any events the user received mod actions from.
type ModEvent = {
	modId: number,					// ID of the moderator that applied the event. Is not visible to users.
	type: ModEventType,				// The type of moderation event applied.
	reason: string,					// Provides an internal (staff-only) reason or additional context for the event. May be customized by the moderator.
	warning: ModWarningType,		// The warning applied (if applicable)
	time: number,					// Timestamp of the event (seconds).
}

export abstract class Mod {
	
	static async canModPerformThis(modId: number, type: ModEventType) {
		const role = await User.getRole(modId);
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
	
	static async attachModEvent(modId: number, userId: number, type: ModEventType, reason: string, warning: ModWarningType = 0): Promise<boolean> {
		
		// Ensure that we're working with a valid User ID.
		if(!(await User.idExists(userId))) { return false; }
		
		// TODO: Make sure the mod can perform these actions.
		
		// Generate the Mod Event
		const event: ModEvent = {
			modId: modId,
			type: type,
			reason: reason,
			warning: warning,
			time: Math.floor(Date.now() / 1000),
		}
		
		// Retrieve existing mod events from the user:
		const mEvents = await RedisDB.db.get(`u:${userId}:modEvents`) || `[]`;
		const eJson: Array<ModEvent> = JSON.parse(mEvents);
		eJson.push(event);
		
		// Update the mod events applied to the user:
		await RedisDB.db.set(`u:${userId}:modEvents`, JSON.stringify(eJson));
		return true;
	}
	
	// Returns a simple blurb about what a mod did.
	static simpleModEvent() {
	}
}

