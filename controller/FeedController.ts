import Conn from "../core/Conn.ts";
import RedisDB from "../core/RedisDB.ts";
import { Feed, FeedList } from "../model/Feed.ts";
import WebController from "./WebController.ts";

export default class ForumController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method == "GET") {
			return await this.getController(conn);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	async getController(conn: Conn): Promise<Response> {
		
		const feed = conn.url2 ? conn.url2 : "Home";
		
		// Make sure the feed exists:
		if(!Feed.exists(feed)) {
			return await conn.sendFail(`Feed Request: ${feed} does not exist.`);
		}
		
		// Get the current cached Feed.
		const index = Feed.cached[feed as FeedList];
		
		// Check user's Pagination request ("p")
		const params = conn.url.searchParams;
		
		const page = Math.max(0, Number(params.get("p")) || 0);
		const count = 25;
		const start = page * count;
		const end = Math.min(start + count - 1, index.length - 1);
		
		const postResults: unknown[] = [];
		
		// TODO: Pipelines return absolutely f*#@ing idiotic data, so I guess we loop here. Maybe someday we can optimize this.
		for(let id = start; id < end; id++) {
			const post = index[id];
			const obj = await RedisDB.getHashTable(post);
			postResults.push(obj);
		}
		
		return await conn.sendJson(postResults);
	}
}
