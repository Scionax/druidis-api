import Conn from "../core/Conn.ts";
import WebController from "./WebController.ts";

export default class ForumController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method == "GET") {
			return await this.getController(conn);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		// Make sure the forum exists
		if(!conn.url2) {
			return await conn.sendFail("No additional page data exists.");
		}
		
		return await conn.sendJson("Path successful!");
	}
}