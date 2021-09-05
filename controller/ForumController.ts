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
	
	// GET /forum/{forum}?h=10
	//		- h: Refers to High ID limit, to identify posts the user has cached. So h=10 indicates the user's highest cached ID is 10.
	//		- l: Refers to Low ID limit, to identify posts the user has cached. So l=5 indicates the user's lowest cached ID is 5.
	//		- s: Refers to 'Scan' type: new (default), asc (ascending), or desc (descending).
	//			- 'new' scan (default) means we're searching for the newest results, and stopping if we hit the High ID.
	//			- 'asc' scan means we're searching upward from the High ID.
	//			- 'desc' scan means we're searching downward from the Low ID.
	async getController(conn: Conn): Promise<Response> {
		
		const forum = conn.url2;
		
		// Make sure the forum exists, if one is listed:
		if(!Forum.exists(forum)) {
			return await conn.sendFail(`Forum Request: ${forum} does not exist.`);
		}
		
		// Get the user's query string parameters.
		const params = conn.url.searchParams;
		
		const highId = Number(params.get("h")) || 0;
		const lowId = Number(params.get("l")) || 0;
		const s = params.get("s");
		
		let scan = 'new';
		if(s === "desc") { scan = "desc"; }
		else if(s === "asc") { scan = "asc"; }
		
		const count = 25;
		let scanHigh = 0;
		let scanLow = 0;
		
		// Scan "Descending" (starting from one below the "l" (lowId) provided)
		if(scan === "desc") {
			scanHigh = lowId - 1;
			scanLow = Math.max(0, scanHigh - count + 1);
		}
		else {
			const newestId = await RedisDB.getCounter(`post:${forum}`);
			
			// Scan "Ascending" (starting from one above the "h" (highId) provided)
			if(scan === "asc") {
				scanLow = highId + 1;
				scanHigh = Math.min(newestId, scanLow + count - 1);
			}
			
			// Scan "Newest"
			else {
				scanHigh = newestId;
				scanLow = Math.max(newestId - count + 1, highId + 1);
			}
		}
		
		const postResults: unknown[] = [];
		
		// TODO: Pipelines return absolutely f*#@ing idiotic data, so I guess we loop here. Maybe someday we can optimize this.
		for(let id = scanHigh; id >= scanLow; id--) {
			const obj = await RedisDB.getHashTable(`post:${forum}:${id}`);
			postResults.push(obj);
		}
		
		return await conn.sendJson(postResults);
	}
}
