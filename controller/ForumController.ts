import Conn from "../core/Conn.ts";
import RedisDB from "../core/RedisDB.ts";
import { Forum } from "../model/Forum.ts";
import WebController from "./WebController.ts";

export default class ForumController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method == "GET") {
			return await this.getController(conn);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	// GET /forum/:forum?s=10
	//		- s: Refers to Start Position (for pagination). So s=10 would start at index 10.
	async getController(conn: Conn): Promise<Response> {
		
		// Make sure the forum exists
		if(!conn.url2 || !Forum.exists(conn.url2)) {
			return await conn.sendFail("Forum Request: Forum does not exist.");
		}
		
		let startIndex = 0;
		
		// Get the user's query string parameters.
		for(const [key, value] of conn.url.searchParams.entries()) {
			if(key === "s") {
				const s = Number(value);
				if(s > 0) { startIndex = s; }
			}
		}
		
		const postResults: unknown[] = [];
		
		// Retrieve the Index
		const index = await RedisDB.getIndex_Post_Forum(conn.url2, startIndex, 10);
		
		// Pipelines return absolutely f*#@ing idiotic data, so I guess we loop here. Maybe someday we can optimize this.
		for(let i = 0; i < index.length; i++) {
			const obj = await RedisDB.getHashTable(`post:${index[i]}`);
			postResults.push(obj);
		}
		
		return await conn.sendJson(postResults);
	}
}
