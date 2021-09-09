import { config } from "../config.ts";
import { connectRedis, log, Redis } from "../deps.ts";
import { TableType } from "../model/ForumPost.ts";

export default abstract class RedisDB {
	
	static db: Redis;		// Redis Connection
	
	static async connect(): Promise<boolean> {
		
		// Don't re-connect. (Useful, because we reconnect during Unit Tests).
		if(RedisDB.db) { return true; }
		
		// Connect To Redis
		const opts: { hostname: string, port: number, password?: string, tls?: boolean, name?: string } = {
			hostname: config.redis.hostname,
			port: config.redis.port,
			// tls: boolean, // If using TLS
			// name: string
		};
		
		if(config.redis.password) { opts.password = config.redis.password; }
		
		try {
			RedisDB.db = await connectRedis(opts);
		} catch (error) {
			log.critical(error);
			return false;
		}
		
		return true;
	}
	
	// ------ Helper Functions ------ //
	
	static async getHashTable(table: string): Promise<{ [id: string]: string }> {
		const results = await RedisDB.db.hgetall(table);
		const obj: {[id: string]: string} = {};
		for(let i = 0; i < results.length; i += 2) {
			obj[results[i]] = results[i+1];
		}
		return obj;
	}
	
	// ------ Counters ------ //
	static async getCounter(table: string) {
		const val = await RedisDB.db.get(`count:${table}`) as string;
		return Number(val);
	}
	
	static async incrementCounter(table: string) {
		return await RedisDB.db.incr(`count:${table}`);
	}
	
	// ------ INDEX, GET (BY ID) ------ //
	// When retrieving posts, retrieve by ID. If we retrieve by index, new posts will be pushed into the results.
	// 		Retrieving by ID, ensures that you get the exact set you're looking for.
	//		NOTE: This can be resolved by using Date.now()/1k for all scores.
	
	static async getForumIndex(forum: string, startId: number, count: number, tableType = TableType.Post, reverse = false, byScore = false) {
		if(reverse) { return await RedisDB.db.zrevrange(`i${tableType}:${forum}`, startId + count, startId, {withScore: byScore}); }
		return await RedisDB.db.zrange(`i${tableType}:${forum}`, startId + count, startId, {withScore: byScore});
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
		const added = await RedisDB.db.zadd(`index:home`, id, `${forum}:${id}`);
		RedisDB.purgeExcess(`index:home`, id, 25000, 100);
		return added === 1 ? true : false;
	}
	
	// // Old Indexing System - May need again later for sorting purposes.
	// static async addToForumIndex(forum: string, id: number, tableType = TableType.Post) {
	// 	const added = await RedisDB.db.zadd(`i${tableType}:${forum}`, id, `${forum}:${id}`);
	// 	RedisDB.purgeExcess(`i${tableType}:${forum}`, id, 5000, 100);
	// 	return added === 1 ? true : false;
	// }
	
	// ------ Methods------ //
	
	// Purging SortedSet Results
	static async purgeExcess(table: string, scoreAdded: number, setSize: number, purgeAmount = 100) {
		
		// Every {purgeAmount} results, purge excess values beyond {setSize}.
		if(scoreAdded % purgeAmount === 0) {
			const count = await RedisDB.db.zcount(table, -Infinity, Infinity);
			if(count > setSize) {
				await RedisDB.db.zpopmin(table, count - setSize);
			}
		}
		
		return true;
	}
}