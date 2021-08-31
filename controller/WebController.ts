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
}
