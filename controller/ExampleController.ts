import Conn from "../core/Conn.ts";
import WebController from "./WebController.ts";

export default class ExampleController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method == "GET") {
			return await this.getController(conn);
		}
		
		return conn.badRequest("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		// Make sure the forum exists
		if(!conn.url2) {
			return conn.badRequest("No additional page data exists.");
		}
		
		return await conn.sendJSON("Path successful!");
	}
}