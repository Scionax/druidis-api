import WebController from "./WebController.ts";
import Conn from "../core/Conn.ts";
import { User, UserRole } from "../model/User.ts";
import { Mod, ModEventType } from "../model/Mod.ts";
import { Sanitize } from "../core/Validate.ts";

/*
	Provides an API for handling Modding Activities (banning, muting, reporting, etc.)
	
	// Reviews
	GET /mod/reports						// List of recent reports
	GET /mod/reports?user={username}		// List of username's reports
	
	// Submitting a mod report:
	POST /mod/report
		?username
		?type
		?warning
		?reason
*/

export default class ModController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		// Must be logged in, or no method is allowed.
		if(!conn.id) {
			return await conn.sendFail("Method Not Allowed", 405);
		}
		
		// Must be a moderator, or this page is disabled.
		const role = await User.getRole(conn.id);
		
		if(role < UserRole.Mod) {
			return await conn.sendFail("Method Not Allowed", 405);
		}
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn, role);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		// Viewing /mod
		if(!conn.url2) {
			return await conn.sendJson("No Mod Content Designated");
		}
		
		// /mod/recent
		if(conn.url2 === "reports") {
			
			const count = 50;
			
			// Check if we're looking at a specific user:
			const username = conn.url.searchParams.get("user");
			
			if(username) {
				
				// Make sure the user exists
				const userId = await User.getId(username);
				
				if(userId === 0) {
					return await conn.sendFail("Invalid username.");
				}
				
				// User exists. Review their reports in order of recency.
				const userReports = await Mod.getModReports(userId, 0, 10);
				return await conn.sendJson(userReports);
			}
			
			// No user associated. Get a list of all reports, sorted by most recent:
			const recentReports = await Mod.getModEventHistory(count);
			return await conn.sendJson(recentReports);
		}
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
	
	async postController(conn: Conn, role: UserRole): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		if(conn.errorMessage) { return await conn.sendFail(conn.errorMessage); }
		
		if(conn.url2 === "report") {
			
			if(!rawData.username) {
				return await conn.sendFail(`Invalid username provided.`);
			}
			
			if(!rawData.type) {
				return await conn.sendFail(`Must specify a 'type' of mod report.`);
			}
			
			if(!rawData.warning) {
				return await conn.sendFail(`Must specify a 'warning' level (severity).`);
			}
			
			if(!rawData.reason) {
				return await conn.sendFail(`Must provide a 'reason' field for the mod report.`);
			}
			
			// Make sure the user exists
			const userId = await User.getId(Sanitize.slug(rawData.username.toString()));
			
			if(userId === 0) {
				return await conn.sendFail("Invalid username provided.");
			}
			
			// Make sure the mod event type & warning types are valid.
			const modType = Mod.getModEventType(Number(rawData.type));
			const warningType = Mod.getModWarningType(Number(rawData.warning));
			
			if(modType == -1) {
				return await conn.sendFail(`Invalid 'type' assigned to mod report.`);
			}
			
			if(warningType === -1) {
				return await conn.sendFail(`Invalid 'warning' severity provided.`);
			}
			
			// Create Mod Event
			const modEventId = await Mod.createModEvent(conn.id, userId, modType, Sanitize.sentence(rawData.reason.toString()), warningType)
			
			if(modEventId > 0) {
				const modEvent = await Mod.getModEvent(modEventId);
				return await conn.sendJson(modEvent);
			}
			
			return await conn.sendFail("Unknown Error: Mod Event Submission failed.");
		}
		
		return await conn.sendFail("Invalid API.");
	}
}