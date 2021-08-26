import Mapp from "./Mapp.ts";

const enum TableType {
	Home = "home",
	Post = "post",
	Queue = "queue",
	Sponsor = "sponsor",
}

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
	
	// ------ Counters ------ //
	static async getCounter(forum: string, tableType = TableType.Post) {
		const val = await Mapp.redis.get(`count:${tableType}:${forum}`) as string;
		return Number(val);
	}
	
	static async incrementCounter(forum: string, tableType = TableType.Post) {
		if(!Mapp.forums[forum]) { return 0; }
		return await Mapp.redis.incr(`count:${tableType}:${forum}`);
	}
	
	// ------ INDEX, GET (BY ID) ------ //
	// When retrieving posts, retrieve by ID. If we retrieve by index, new posts will be pushed into the results.
	// 		Retrieving by ID, ensures that you get the exact set you're looking for.
	//		NOTE: This can be resolved by using Date.now()/1k for all scores.
	
	static async getForumIndex(forum: string, startId: number, count: number, tableType = TableType.Post, reverse = false, byScore = false) {
		if(reverse) { return await Mapp.redis.zrevrange(`i${tableType}:${forum}`, startId + count, startId, {withScore: byScore}); }
		return await Mapp.redis.zrange(`i${tableType}:${forum}`, startId + count, startId, {withScore: byScore});
	}
	
	// ------ INDEX, SET ------ //
	/*
		ipost:home							// 10,000 elements
			post:News:6
			post:News:7
			post:World News:4
			post:Business:1
			post:World News:5
			...
	*/
	
	static async addToIndex_Post_Primary(forum: string, id: number) {
		const added = await Mapp.redis.zadd(`index:home`, id, `${forum}:${id}`);
		RedisDB.purgeExcess(`index:home`, id, 25000, 100);
		return added === 1 ? true : false;
	}
	
	// // Old Indexing System - May need again later for sorting purposes.
	// static async addToForumIndex(forum: string, id: number, tableType = TableType.Post) {
	// 	const added = await Mapp.redis.zadd(`i${tableType}:${forum}`, id, `${forum}:${id}`);
	// 	RedisDB.purgeExcess(`i${tableType}:${forum}`, id, 5000, 100);
	// 	return added === 1 ? true : false;
	// }
	
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