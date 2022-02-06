import WebController from "./WebController.ts";
import Conn from "../core/Conn.ts";
import { User, UserRole } from "../model/User.ts";
import { Mod } from "../model/Mod.ts";
import { Sanitize } from "../core/Validate.ts";

/*
	Provides an API for handling Modding Activities (banning, muting, reporting, etc.)
	
	// Reviews
	GET /mod/reports						// List of recent reports
	GET /mod/reports/{username}				// List of username's reports
	GET /mod/actions/{username}				// List of username's mod actions
	
	...
		?page={page}						// Assign an index for pagination.
		?count={count}						// Assign number of results for pagination. Defaults to 50.
	
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
			return await this.postController(conn);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		// Viewing /mod
		if(!conn.url2) {
			return await conn.sendJson("No Mod Content Designated");
		}
		
		// Paging Params
		const params = conn.url.searchParams;
		const page = Math.max(Number(params.get("page")), 1);				// Page to start on (for pagination).
		const pageCount = Math.min(Number(params.get("count")) || 25, 50);	// The number of reports to return per page.
		const pageIndex = (page - 1) * pageCount;							// Index position to start at.
		
		// /mod/reports
		if(conn.url2 === "reports") {
			
			// /mod/reports/{username}
			if(conn.url3) {
				
				// Make sure the user exists
				const userId = await User.getId(conn.url3);
				
				if(userId === 0) {
					return await conn.sendFail("Invalid user.");
				}
				
				// User exists. Review their reports in order of recency.
				const userReports = await Mod.getModReports(userId, pageIndex, pageCount);
				return await conn.sendJson(userReports);
			}
			
			// No user associated. Get a list of all reports, sorted by most recent:
			const recentReports = await Mod.getModEventHistory(pageIndex, pageCount);
			return await conn.sendJson(recentReports);
		}
		
		// /mod/actions
		if(conn.url2 === "actions") {
			
			// /mod/actions/{username}
			if(conn.url3) {
				
				// Make sure the user exists
				const modId = await User.getId(conn.url3);
				
				if(modId === 0) {
					return await conn.sendFail("Invalid user.");
				}
				
				// User exists. Review their reports in order of recency.
				const modActions = await Mod.getModActions(modId, pageIndex, pageCount);
				return await conn.sendJson(modActions);
			}
			
			// No user associated. Get a list of all actions, sorted by most recent:
			const recentReports = await Mod.getModEventHistory(pageIndex, pageCount);
			return await conn.sendJson(recentReports);
		}
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
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