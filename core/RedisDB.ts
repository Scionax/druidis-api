import Mapp from "./Mapp.ts";

export default abstract class RedisDB {
	
	// ------ Helper Functions ------ //
	
	static async getHashTable(table: string): Promise<{ [id: string]: string }> {
		const results = await Mapp.redis.hgetall(table);
		const obj: {[id: string]: string} = {};
		for(let i = 0; i < results.length; i += 2) {
			obj[results[i]] = results[i+1];
		}
		return obj;
	}
	
	// ------ Counters, GET ------ //
	
	static async getHomeFeedId() {
		const val = await Mapp.redis.get(`count:homeFeed`) as string;
		if(!val) { return 0; }
		return Number(val);
	}
	
	static async getForumPostId(forum: string) {
		const val = await Mapp.redis.get(`count:post:${forum}`) as string;
		return Number(val);
	}
	
	static async getQueuedPostId(forum: string) {
		const val = await Mapp.redis.get(`count:queue:${forum}`) as string;
		return Number(val);
	}
	
	// ------ Counters, Increment ------ //
	
	static async nextHomeFeedId() {
		return await Mapp.redis.incr(`count:homeFeed`);
	}
	
	static async nextForumPostId(forum: string) {
		if(!Mapp.forums[forum]) { return 0; }
		return await Mapp.redis.incr(`count:post:${forum}`);
	}
	
	static async nextQueuedPostId(forum: string) {
		if(!Mapp.forums[forum]) { return 0; }
		return await Mapp.redis.incr(`count:queue:${forum}`);
	}
	
	// ------ INDEX, GET (BY ID) ------ //
	// When retrieving posts, retrieve by ID. If we retrieve by index, new posts will be pushed into the results.
	// 		Retrieving by ID, ensures that you get the exact set you're looking for.
	
	static async getById_Post_Primary(startId: number, count: number) {
		return await Mapp.redis.zrevrangebyscore(`iPost:primary`, startId + count, startId);
	}
	
	static async getById_Post_Forum(forum: string, startId: number, count: number) {
		return await Mapp.redis.zrevrangebyscore(`iPost:${forum}`, startId + count, startId);
	}
	
	static async getById_Post_Forum_Category(forum: string, category: string, startId: number, count: number) {
		return await Mapp.redis.zrevrangebyscore(`iPost:${forum}:${category}`, startId + count, startId);
	}
	
	static async getById_QueueForum(forum: string, startId: number, count: number) {
		return await Mapp.redis.zrangebyscore(`iQueue:${forum}`, startId + count, startId);
	}
	
	
	// ------ INDEX, GET (BY INDEX) ------ //
	
	static async getIndex_Post_Primary(start: number, count: number) {
		return await Mapp.redis.zrevrange(`iPost:primary`, start, start + count - 1);
	}
	
	static async getIndex_Post_Forum(forum: string, start: number, count: number) {
		return await Mapp.redis.zrevrange(`iPost:${forum}`, start, start + count - 1);
	}
	
	static async getIndex_Post_Forum_Category(forum: string, category: string, start: number, count: number) {
		return await Mapp.redis.zrevrange(`iPost:${forum}:${category}`, start, start + count - 1);
	}
	
	static async getIndex_QueueForum(forum: string, start: number, count: number) {
		return await Mapp.redis.zrange(`iQueue:${forum}`, start, start + count - 1);
	}
	
	// ------ INDEX, SET ------ //
	/*
		iPost:primary						// 25,000				// Home Post Feed. Combines all forum indexes.
		iPost:{forum}						// 5000					// One index per forum. Contains last 1000 entries.
		iPost:{forum}:{category}			// 1000					// Indexes the last 250 posts for a given category.
		iQueue:{forum}						// Unlimited			// Queued entries for a forum. Expire after 30 days if not approved.
	*/
	
	static async addToIndex_Post_Primary(forum: string, id: number) {
		const added = await Mapp.redis.zadd(`iPost:primary`, id, `${forum}:${id}`);
		RedisDB.purgeExcess(`iPost:primary`, id, 25000, 100);
		return added === 1 ? true : false;
	}
	
	static async addToIndex_Post_Forum(forum: string, id: number) {
		const added = await Mapp.redis.zadd(`iPost:${forum}`, id, `${forum}:${id}`);
		RedisDB.purgeExcess(`iPost:${forum}`, id, 5000, 100);
		return added === 1 ? true : false;
	}
	
	static async addToIndex_Post_Forum_Category(forum: string, id: number, category:string) {
		const added = await Mapp.redis.zadd(`iPost:${forum}:${category}`, id, `${forum}:${id}`);
		RedisDB.purgeExcess(`iPost:${forum}:${category}`, id, 1000, 10);
		return added === 1 ? true : false;
	}
	
	static async addToIndex_Queue_Forum(forum: string, id: number) {
		const added = await Mapp.redis.zadd(`iQueue:${forum}`, id, `${forum}:${id}`);
		RedisDB.purgeExcess(`iQueue:${forum}`, id, 25000, 100);
		return added === 1 ? true : false;
	}
	
	// ------ Methods------ //
	
	// Purging SortedSet Results
	static async purgeExcess(table: string, scoreAdded: number, setSize: number, purgeAmount = 100) {
		
		// Every {purgeAmount} results, purge excess values beyond {setSize}.
		if(scoreAdded % purgeAmount === 0) {
			const count = await Mapp.redis.zcount(table, -Infinity, Infinity);
			if(count > setSize) {
				await Mapp.redis.zpopmin(table, count - setSize);
			}
		}
		
		return true;
	}
}