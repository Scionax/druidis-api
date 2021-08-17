import { join, Redis } from "../deps.ts";
import { Forum } from "../model/Forum.ts";

/*
	This class tracks important MAPPING DATA
	- DB Connection
	- Cache
	- Paths
*/

export default abstract class Mapp {
	
	// ------------------------------ //
	// ---------- DATABASE ---------- //
	static redis: Redis;		// Redis Connection
	
	// --------------------------- //
	// ---------- CACHE ---------- //
	static forums: { [id: string]: Forum } = {};
	
	// --------------------------- //
	// ---------- PATHS ---------- //
	static Path = {
		Root: Deno.cwd(),
		Core: join(Deno.cwd(), "/core"),
		Model: join(Deno.cwd(), "/model"),
		Controller: join(Deno.cwd(), "/controller"),
	};
}

