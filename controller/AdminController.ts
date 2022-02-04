import WebController from "./WebController.ts";
import Conn from "../core/Conn.ts";
import Data from "../core/Data.ts";

export default class AdminController extends WebController {
	
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
	
	async getController(conn: Conn): Promise<Response> {
		
		// Viewing /admin
		if(!conn.url2) {
			return await conn.sendJson("No Admin Content Designated");
		}
		
		// /admin/user
		if(conn.url2 === "user") {
			
			// const index = Feed.cached["Entertainment"];
			// return await conn.sendJson(index);
			
			const files = await Data.getFilesRecursive(`images`);
			return await conn.sendJson(files);
		}
		
		// /admin/user-list
		if(conn.url2 === "user-list") {
			return await conn.sendJson("Some User Lists");
		}
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		
		// Return Success
		return await conn.sendJson(rawData);
	}
}