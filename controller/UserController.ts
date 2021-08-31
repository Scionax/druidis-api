import Conn from "../core/Conn.ts";
import WebController from "./WebController.ts";

export default class UserController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn);
		}
		
		else if(conn.request.method === "OPTIONS") {
			return await conn.sendJson("SUCCESS");
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	// GET /user
	async getController(conn: Conn): Promise<Response> {
		return await conn.sendFail();
	}
	
	// POST /user/login
	// POST /user/sign-up
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		if(conn.errorMessage) { return await conn.sendFail(conn.errorMessage); }
		
		if(conn.url2 === "login") {
			rawData.extra = "Received from login.";
			return await conn.sendJson(rawData);
		}
		
		if(conn.url2 === "sign-up") {
			rawData.extra = "Received from sign-up.";
			return await conn.sendJson(rawData);
		}
		
		// Return Success
		return await conn.sendFail("Invalid API.");
	}
}