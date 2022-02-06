import Conn from "../core/Conn.ts";

export default class WebController {
	
	// This only exists here as an interface, but is important for running RouteMap[url], which points to a WebRouter class.
	async runHandler(conn: Conn): Promise<boolean> {
		return await conn.badRequest("Invalid Route");
	}
}
