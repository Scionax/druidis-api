import WebController from "./WebController.ts";
import { Forum } from "../model/Forum.ts";
import Conn from "../core/Conn.ts";
import { Feed } from "../model/Feed.ts";
import { config } from "../config.ts";
import ServerMechanics from "../core/ServerMechanics.ts";
import { log } from "../deps.ts";
import FileSys from "../core/FileSys.ts";

/*
	Allows interactions with specific data APIs.
	
	GET /data/forums			// Fetch forum schema.
	GET /data/feeds				// Fetch feed schema.
	GET /data/html				// Fetch a website's HTML, scraping.
	GET /data/test
	
	POST /data/shutdown			// Runs a graceful shutdown.
*/

export default class DataController extends WebController {
	
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
		
		// Viewing /data
		if(!conn.url2) {
			return await conn.sendJson("No Data Type Selected");
		}
		
		// /data/forums API (Fixed Forum Data)
		if(conn.url2 === "forums") {
			
			// Full Forum Data
			if(conn.url3 === "expanded") {
				return await conn.sendJson( Forum.schema );
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
			return await conn.sendJson( Forum.getCompactSchema() );
		}
		
		// /data/feeds API (Fixed Forum Data)
		if(conn.url2 === "feeds") {
			return await conn.sendJson( Feed.getCompactSchema() );
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
			
			// const index = Feed.cached["Entertainment"];
			// return await conn.sendJson(index);
			
			const files = await FileSys.getFilesRecursive(`images`);
			return await conn.sendJson(files);
		}
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		
		// Run Shutdown
		if(conn.url2 === "shutdown") {
			// const pass = Deno.env.get('SHUTDOWN_PASS');
			// if(rawData.pass !== pass) { conn.sendFail("Stop that, it tickles."); }
			
			if(config.local && !config.prod) {
				ServerMechanics.gracefulExit();
			}
		}
		
		// Run POST Test
		else if(conn.url2 === "test") {
			log.info(rawData);
			return await conn.sendJson(rawData);
		}
		
		// Return Success
		return await conn.sendJson(rawData);
	}
}