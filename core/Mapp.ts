import { Redis } from "../deps.ts";

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
	static recentPosts: { [authorId: number]: TrackRecentPost } = {};		// Used to prevent re-submitting same material.
}

