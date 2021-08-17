import Conn from "../core/Conn.ts";
import VerboseLog from "../core/VerboseLog.ts";
import { getCookies } from "../deps.ts";

export default class WebController {
	
	// This only exists here as an interface, but is important for running RouteMap[url], which points to a WebRouter class.
	async runHandler(conn: Conn): Promise<Response> {
		return await conn.sendFail("Invalid Route");
	}
	
	static verifyLoggedIn(conn: Conn): boolean {
		
		const cookies = getCookies(conn.request);
		
		const user = cookies["User"];
		const token = cookies["Token"];
		
		// Confirm that the cookies are present:
		if(!user || !token) {
			VerboseLog.verbose("WebRouter.verifyLoggedIn() Error: User or Token Cookie is not set.");
			return false;
		}
		
		// TODO
		// Make sure the token matches.
		
		return true;
	}
	
	
	// ------------------------- //
	// ----- API Post Data ----- //
	// ------------------------- //
	
	static async getPostValues(conn: Conn): Promise<{ [id: string]: FormDataEntryValue }> {
		
		// Verify Correct Content-Type
		const contentType = conn.request.headers.get("content-type");
		
		if(!contentType) {
			conn.error("Invalid 'Content-Type' Header");
			return {};
		}
		
		// Handle JSON data.
		if(contentType.includes("application/json")) {
			try {
				return await conn.request.json();
			} catch {
				conn.error("Improperly Formatted JSON Object");
				return {};
			}
		}
		
		// Handle Form Data
		else if(contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
			try {
				const reqData = await conn.request.formData();
				const formData: { [id: string]: FormDataEntryValue } = {};
				for (const [key, value] of reqData.entries()) {
					formData[key] = value;
				}
				return formData;
			} catch {
				conn.error("Invalid Form Data");
				return {};
			}
		}
		
		return {};
	}
}
