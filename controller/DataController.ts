import Mapp from "../core/Mapp.ts";
import WebController from "./WebController.ts";
import { Forum } from "../model/Forum.ts";
import Conn from "../core/Conn.ts";
import ImageMod from "../core/ImageMod.ts";

export default class DataController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		// Viewing /data
		if(!conn.url2) {
			return await conn.sendJson("No Data Type Selected");
		}
		
		// /data/forums API (Fixed Forum Data)
		if(conn.url2 === "forums") {
			
			// Specific Forum
			if(conn.url3) {
				if(Forum.exists(conn.url3)) {
					return await conn.sendJson( Forum.get(conn.url3) );
				} else {
					return await conn.sendFail("Forum does not exist.");
				}
			}
			
			// Full Forum Data
			return await conn.sendJson( Mapp.forums );
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
			const width = Number(conn.url.searchParams.get("width")) || 0;
			const height = Number(conn.url.searchParams.get("height")) || 0;
			
			// We need to identify the crop rules to determine resizes, regardless of whether or not we crop.
			const cropRules = ImageMod.getWideAspectCrop(width, height);
			const resizeRules = ImageMod.getResizeRules(cropRules);
			
			return await conn.sendJson(resizeRules);
		}
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
}