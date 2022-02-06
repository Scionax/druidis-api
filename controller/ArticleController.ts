import WebController from "./WebController.ts";
import Conn from "../core/Conn.ts";
import { Sanitize } from "../core/Validate.ts";

/*
	Retrieves articles.
	
	GET /article/{category}/{article}				// Fetch article JSON.
*/

export default class ArticleController extends WebController {
	
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
		
		// Make sure the category is set, e.g. /article/{category}
		if(!conn.url2) {
			return await conn.sendJson("Invalid Article Category");
		}
		
		const category = Sanitize.slug(conn.url2);
		
		// Make sure the article exists, e.g. /article/{category}/{article}.json
		if(!conn.url3) {
			return await conn.sendJson("No Article Was Selected");
		}
		
		const article = Sanitize.slug(conn.url3);
		
		// Return the article's JSON (if valid)
		try {
			const fileContents = await Deno.readTextFile(`./data/articles/${category}/${article}.json`);
			return conn.sendDirect(fileContents);
		}
		
		// If the article doesn't exist, the request is invalid:
		catch(e) {
			if(e instanceof Deno.errors.NotFound) {
				// Do Nothing - will result in invalid request.
			}
		}
		
		return await conn.sendFail("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		
		// Return Success
		return await conn.sendJson(rawData);
	}
}