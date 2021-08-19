import { join, Redis } from "../deps.ts";
import { Forum } from "../model/Forum.ts";

/*
	This class tracks important MAPPING DATA
	- DB Connection
	- Cache
	- Paths
*/

export default abstract class Mapp {
	
	// ------------------------------ //
	// ---------- DATABASE ---------- //
	static redis: Redis;		// Redis Connection
	
	// --------------------------- //
	// ---------- CACHE ---------- //
	static forums: { [id: string]: Forum } = {};
	
	// --------------------------- //
	// ---------- Time ---------- //
	private static _currentDate = -1;
	private static _currentYYMM = "";
	
	static getYYMM() {
		const dateObj = new Date();
		const day = dateObj.getDay();
		
		// Update the tracked time once each day:
		if(day === Mapp._currentDate) {
			return Mapp._currentYYMM;
		}
		
		Mapp._currentDate = day;
		
		// Assign the new time to track:
		const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);	// Current month as MM
		const year = ("0" + (dateObj.getFullYear())).slice(-2);		// Current year as YY
		
		Mapp._currentYYMM = year + month;
		
		return Mapp._currentYYMM;
	}
	
	static getDD(): string {
		const dateObj = new Date();
		return ("0" + dateObj.getDate()).slice(-2);			// Current date as DD
	}
}

