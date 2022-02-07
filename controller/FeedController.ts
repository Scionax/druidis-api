import Conn from "../core/Conn.ts";
import { Feed, FeedList } from "../model/Feed.ts";
import { ForumPost, TableType } from "../model/ForumPost.ts";
import WebController from "./WebController.ts";

/*
	Retrieves data from a feed:
	
	/feed/{feed}
*/

export default class FeedController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method == "GET") {
			return await this.getController(conn);
		}
		
		return conn.badRequest("Method Not Allowed", 405);
	}
	
	// When requesting posts from a Feed, you must supply a tag ('tag') and a position ('p').
	// If the 'tag' doesn't match, it means the feed was rebuilt, and it will send you the new results instead.
	async getController(conn: Conn): Promise<Response> {
		
		const feed = conn.url2 ? conn.url2 : "Home";
		
		// Make sure the feed exists:
		if(!Feed.exists(feed)) {
			return conn.badRequest(`Feed Request: ${feed} does not exist.`);
		}
		
		// Get the current cached Feed.
		const index = Feed.cached[feed as FeedList].posts;
		const count = 25;
		
		// "p" is the "pos" or start index position. Not page.
		// With feeds, we only scroll down. If the feed gets rebuilt, it will start from scratch.
		const params = conn.url.searchParams;
		const tag = params.get('tag');
		const start = tag === Feed.cached[feed as FeedList].tag ? Number(params.get("p")) || 0 : 0; // If the tag doesn't match, start with index position 0.
		const end = Math.min(start + count - 1, index.length - 1);
		
		const postResults: Record<string, string|number>[] = [];
		
		// TODO: Pipelines return absolutely f*#@ing idiotic data, so I guess we loop here. Maybe someday we can optimize this.
		for(let id = start; id < end; id++) {
			const pData = index[id].split(":");
			const obj = await ForumPost.getPostDataForUser(pData[1], Number(pData[2]), pData[0] as TableType);
			postResults.push(obj);
		}
		
		return conn.sendJSON({ tag: Feed.cached[feed as FeedList].tag, start: start, end: end, posts: postResults });
	}
}
