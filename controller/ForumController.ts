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
	
	// GET /forum/:forum?h=10
	//		- h: Refers to High ID limit, to identify posts the user has cached. So h=10 indicates the user's highest cached ID is 10.
	//		- l: Refers to Low ID limit, to identify posts the user has cached. So l=5 indicates the user's lowest cached ID is 5.
	//		- s: Refers to 'Scan' type: new (default), asc (ascending), or desc (descending).
	//			- 'new' scan (default) means we're searching for the newest results, and stopping if we hit the High ID.
	//			- 'asc' scan means we're searching upward from the High ID.
	//			- 'desc' scan means we're searching downward from the Low ID.
	async getController(conn: Conn): Promise<Response> {
		
		// Make sure the forum exists
		if(!conn.url2 || !Forum.exists(conn.url2)) {
			return await conn.sendFail("Forum Request: Forum does not exist.");
		}
		
		let highId = 0;
		let lowId = 0;
		let scan = 'new';
		let count = 25;
		let scanStartId = 0;
		
		// Get the user's query string parameters.
		for(const [key, value] of conn.url.searchParams.entries()) {
			if(key === "h") {
				const h = Number(value);
				if(h > 0) { highId = h; }
			}
			else if(key === "l") {
				const l = Number(value);
				if(l > 0) { lowId = l; }
			}
			else if(key === "s") {
				if(value === "desc") { scan = "desc"; }
				else if(value === "asc") { scan = "asc"; }
			}
		}
		
		// Get the Starting ID and the Count (the number of indexes to scan above the Starting ID)
		if(scan === "desc") {
			scanStartId = lowId - count;
			
			if(scanStartId < 0) {
				scanStartId = 0;
				count = lowId;
			}
		}
		else if(scan === "asc") {
			scanStartId = highId;
		} else {
			const newestId = await RedisDB.getCounter(conn.url2);
			scanStartId = newestId - count;
			
			if(highId > scanStartId) {
				scanStartId = highId + 1;
				count = newestId - scanStartId;
			}
		}
		
		const postResults: unknown[] = [];
		
		if(count > 0) {
			
			// Retrieve the Forum Index
			const index = await RedisDB.getForumIndex(conn.url2, scanStartId, count);
			
			// Pipelines return absolutely f*#@ing idiotic data, so I guess we loop here. Maybe someday we can optimize this.
			for(let i = 0; i < index.length; i++) {
				const obj = await RedisDB.getHashTable(`post:${index[i]}`);
				postResults.push(obj);
			}
		}
		
		return await conn.sendJson(postResults);
	}
}
