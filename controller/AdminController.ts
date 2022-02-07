import WebController from "./WebController.ts";
import Conn from "../core/Conn.ts";
import FileSys from "../core/FileSys.ts";

export default class AdminController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn);
		}
		
		else if(conn.request.method === "OPTIONS") {
			return conn.sendJSON("SUCCESS");
		}
		
		return conn.badRequest("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		// Viewing /admin
		if(!conn.url2) {
			return conn.sendJSON("No Admin Content Designated");
		}
		
		// /admin/user
		if(conn.url2 === "user") {
			
			// const index = Feed.cached["Entertainment"];
			// return conn.successJSON(index);
			
			const files = await FileSys.getFilesRecursive(`images`);
			return conn.sendJSON(files);
		}
		
		// /admin/user-list
		if(conn.url2 === "user-list") {
			return conn.sendJSON("Some User Lists");
		}
		
		// Something invalid.
		return conn.badRequest("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		if(rawData instanceof Response) { return rawData; }
		
		// Return Success
		return conn.sendJSON(rawData);
	}
}