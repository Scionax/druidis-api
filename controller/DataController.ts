import Mapp from "../core/Mapp.ts";
import WebController from "./WebController.ts";
import { Forum } from "../model/Forum.ts";
import Conn from "../core/Conn.ts";

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
		
		// Something invalid.
		return await conn.sendFail("Invalid Request.");
	}
}