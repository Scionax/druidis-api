import Mapp from "../core/Mapp.ts";
import WebController from "./WebController.ts";
import { Forum } from "../model/Forum.ts";
import Conn from "../core/Conn.ts";

export default class DataController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		// Viewing /data
		if(!conn.url2) {
			return await conn.sendJson("No Data Type Selected");
		}
		
		// /data/forums API (Fixed Forum Data)
		if(conn.url2 === "forums") {
			
			// Full Forum Data
			if(conn.url3 === "expanded") {
				return await conn.sendJson( Mapp.forums );
			}
			
			// Specific Forum
			if(conn.url3) {
				if(Forum.exists(conn.url3)) {
					return await conn.sendJson( Forum.get(conn.url3) );
				} else {
					return await conn.sendFail("Forum does not exist.");
				}
			}
			
			// Return Compact Forum Data
			return await conn.sendJson( Forum.getCompactForumData());
		}
		
		// Fetch a website's HTML.
		if(conn.url2 === "html") {
			const url = conn.url.searchParams.get("url");
			if(!url) { return await conn.sendFail("Must include a URL."); }
			
			try {
				const textResponse = await fetch(url);
				const textData = await textResponse.text();
				return await conn.sendJson(textData);
			} catch {
				return await conn.sendFail("Error while attempting to retrieve website.");
			}
		}
		
		// Run a Test
		if(conn.url2 === "test") {
			
			return await conn.sendJson("Let's try this");
		}
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await WebController.getPostValues(conn);
		
		// Run POST Test
		if(conn.url2 === "test") {
			console.log(rawData);
			return await conn.sendJson(rawData);
		}
		
		// Return Success
		return await conn.sendJson(rawData);
	}
}