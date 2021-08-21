import { Redis } from "../deps.ts";
import { Forum } from "../model/Forum.ts";

/*
	This class tracks important MAPPING DATA
	- DB Connection
	- Cache
	- Paths
*/

type TrackRecentPost = { title: string; url: string; lastPost: number; }

export default abstract class Mapp {
	
	// ------------------------------ //
	// ---------- DATABASE ---------- //
	static redis: Redis;		// Redis Connection
	
	// --------------------------- //
	// ---------- CACHE ---------- //
	static forums: { [id: string]: Forum } = {};
	static recentPosts: { [authorId: number]: TrackRecentPost } = {};		// Used to prevent re-submitting same material.
}

