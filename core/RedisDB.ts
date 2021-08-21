import Mapp from "./Mapp.ts";

export default abstract class RedisDB {
	
	static async nextPostId(forum: string) {
		if(!Mapp.forums[forum]) { return 0; }
		return await Mapp.redis.incr(`count:post:${forum}`);
	}
	
	static async nextQueuedPostId(forum: string) {
		if(!Mapp.forums[forum]) { return 0; }
		return await Mapp.redis.incr(`count:queue:${forum}`);
	}
	
}