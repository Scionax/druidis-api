import WebController from "./WebController.ts";
import Conn from "../core/Conn.ts";
import FileSys from "../core/FileSys.ts";

export default class AdminController extends WebController {
	
	async runHandler(conn: Conn): Promise<boolean> {
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn);
		}
		
		else if(conn.request.method === "OPTIONS") {
			return conn.successJSON("SUCCESS");
		}
		
		return conn.badRequest("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<boolean> {
		
		// Viewing /admin
		if(!conn.url2) {
			return conn.successJSON("No Admin Content Designated");
		}
		
		// /admin/user
		if(conn.url2 === "user") {
			
			// const index = Feed.cached["Entertainment"];
			// return conn.successJSON(index);
			
			const files = await FileSys.getFilesRecursive(`images`);
			return conn.successJSON(files);
		}
		
		// /admin/user-list
		if(conn.url2 === "user-list") {
			return conn.successJSON("Some User Lists");
		}
		
		// Something invalid.
		return conn.badRequest("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<boolean> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		
		// Return Success
		return conn.successJSON(rawData);
	}
}