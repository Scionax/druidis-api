import Data from "../core/Data.ts";
import RedisDB from "../core/RedisDB.ts";
import { Forum, ForumType } from "./Forum.ts";

/*
	About Feeds:
		- Feeds don't contain any of their own posts.
		- Feeds collect (and display) a large number of posts from multiple forums.
		- Feeds are cached for a given duration, then re-run when they are marked as stale.
*/

export enum FeedList {
	Home = "Home",
	Entertainment = "Entertainment",
	News = "News",
	Informative = "Informative",
	Lifestyle = "Lifestyle",
	Fun = "Fun",
	Creative = "Creative",
}

/*
	Future Integration: Add each of these values as individual settings per post:
		
		Educational
			- Useful Information (Did You Know)
			- Interesting Tidbit (Did You Know)
		
		Quality Journalism (Expose Corruption)
			- Investigative Journalism
		
		Hidden Gems / Showcase (people or groups that deserve a spotlight)
		
		Trending, Matters
		Trending, Doesn't Matter
		
		Uplifting, Meaningful Change
		Uplifting, Feel Good Story
*/

export class Feed {
	
	/*
		To determine the contents of a Feed, get 100 posts from the associated forums.
			- Retrieve a number from each forum based on a weighting score.
			- Shuffle their positions so that they're not bunched together.
		
		"weight" refers to the percent (of 100) of how often the related forum appears in the index.
		
		We also use the "ForumType," which helps indicate how the entries should be retrieved.
			"News" means the forum is based on current events. Should extract results by recent IDs.
			"Collect" means the forum is a collection; entries can be selected from any point and still be relevant.
			"Mixed" means the forum is a collection, but may have time-sensitive relevance.
	*/
	
	// Contains the full Feed Schema
	static schema: { [feed: string]: { [forum: string]: { weight: number } } } = {
		"Entertainment": {
			"Shows": { weight: 20 },			// Highest scored because everyone watches shows.
			"Movies": { weight: 10 },			// Everyone watches movies, but also similar to Shows.
			"People": { weight: 18 },			// A popular subject. Some won't care. Same with Sports / Gaming.
			"Sports": { weight: 18 },			// Lots of sports fans. Some won't care. Same with People / Gaming.
			"Gaming": { weight: 18 },			// Lots of gaming enthusiasts. Some won't care. Same with People / Sports.
			"Virtual Reality": { weight: 5 },
			"Tabletop Games": { weight: 5 },
			"Music": { weight: 4 },
			"Books": { weight: 2 },
		},
		"News": {
			"World News": { weight: 24 },
			"Social Issues": { weight: 22 },
			"Politics": { weight: 20 },
			"Environment": { weight: 12 },		// Very important, but we shouldn't overdo it.
			"Business": { weight: 12 },
			"Economic": { weight: 8 },
			"Legal": { weight: 2 },				// Generally useless to socity. May remove if we can't find anything of substance.
		},
		"Informative": {
			"Technology": { weight: 40 },
			"Science": { weight: 25 },
			"Education": { weight: 15 },
			"History": { weight: 10 },
		},
		"Lifestyle": {
			"Fashion": { weight: 20 },
			"Food": { weight: 16 },
			"Health": { weight: 16 },
			"Fitness": { weight: 12 },
			"Social Life": { weight: 10 },
			"Relationships": { weight: 10 },
			"Recipes": { weight: 8 },
			"Travel": { weight: 8 },
		},
		"Fun": {
			"Funny": { weight: 45 },
			"Ask": { weight: 15 },
			"Cute": { weight: 15 },
			"Forum Games": { weight: 15 },
			"Cosplay": { weight: 10 },
		},
		"Creative": {
			"Crafts": { weight: 40 },
			"Artwork": { weight: 25 },
			"Design": { weight: 25 },
			"Writing": { weight: 10 },
		},
		"Home": {
			
			// Entertainment - 20%
			"Shows": { weight: 4 },				// Highest scored because everyone watches shows.
			"Movies": { weight: 2 },			// Everyone watches movies, but also similar to Shows.
			"People": { weight: 3 },			// A popular subject. Some won't care. Same with Sports / Gaming.
			"Sports": { weight: 3 },			// Lots of sports fans. Some won't care. Same with People / Gaming.
			"Gaming": { weight: 3 },			// Lots of gaming enthusiasts. Some won't care. Same with People / Sports.
			"Virtual Reality": { weight: 1 },
			"Tabletop Games": { weight: 2 },
			"Music": { weight: 1 },
			"Books": { weight: 1 },
			
			// News - 17%
			"World News": { weight: 4 },
			"Social Issues": { weight: 3 },
			"Environment": { weight: 3 },		// Very important, but we shouldn't overdo it.
			"Politics": { weight: 2 },
			"Business": { weight: 2 },
			"Economic": { weight: 2 },
			"Legal": { weight: 1 },				// Generally useless to socity. May remove if we can't find anything of substance.
			
			// Informative - 20%
			"Technology": { weight: 7 },
			"Science": { weight: 7 },
			"Education": { weight: 3 },
			"History": { weight: 3 },
			
			// Lifestyle - 8%
			"Fashion": { weight: 1 },
			"Food": { weight: 1 },
			"Health": { weight: 1 },
			"Fitness": { weight: 1 },
			"Social Life": { weight: 1 },
			"Relationships": { weight: 1 },
			"Recipes": { weight: 1 },
			"Travel": { weight: 1 },
			
			// Fun - 23%
			"Funny": { weight: 9 },
			"Cute": { weight: 6 },
			"Ask": { weight: 4 },
			"Cosplay": { weight: 3 },
			"Forum Games": { weight: 1 },
			
			// Creative - 12%
			"Crafts": { weight: 5 },
			"Artwork": { weight: 5 },
			"Design": { weight: 3 },
			"Writing": { weight: 2 },
			
			// Druidis Extras (Features, etc) - This adds BEYOND the standard 100 results.
			// "Sponsored": { weight: 10 },
			// "Featured": { weight: 10 },
			// "CallToAction": { weight: 10 },
		},
	}
	
	// Stores the full list of indexes:
	static cached: {
		[FeedList.Home]: string[],
		[FeedList.Creative]: string[],
		[FeedList.Entertainment]: string[],
		[FeedList.Fun]: string[],
		[FeedList.Informative]: string[],
		[FeedList.Lifestyle]: string[],
		[FeedList.News]: string[],
	} = {
		[FeedList.Home]: [],
		[FeedList.Creative]: [],
		[FeedList.Entertainment]: [],
		[FeedList.Fun]: [],
		[FeedList.Informative]: [],
		[FeedList.Lifestyle]: [],
		[FeedList.News]: [],
	};
	
	constructor() {}
	
	public static exists(feed: string) { return feed && Feed.schema[feed]; }
	
	public static getCompactSchema() {
		const response: {[feed: string]: string[]} = {};
		
		for (const [key, child] of Object.entries(Feed.schema)) {
			response[key] = [];
			for (const [forum, _v2] of Object.entries(child)) {
				response[key].push(forum);
			}
		}
		
		return response;
	}
	
	// Best solution is to create the feed all at once, update every few hours.
	// A "batch" is 100 posts (+extras, if applicable). If we run 100 batches, that's 10,000 posts being indexed.
	// Use a mix of collections, and maintain the news in its general order.
	// const feed = await FeedIndexer.build(FeedList.Home);
	public static async build(feedName: FeedList = FeedList.Home, numberOfBatches = 10) {
		
		let posts: Array<string> = [];
		
		// Build the iterator tracker. This keeps track of each forum's iterator, which is important for ordering the feed.
		const iterators: { [forum: string]: number } = {};
		
		for (const [forum, _values] of Object.entries(Feed.schema[feedName])) {
			const newestId = Number(await RedisDB.getCounter(`post:${forum}`)) || 0;
			iterators[forum] = newestId;
		}
		
		// We will repeat this process {numberOffBatch} times
		for(let batchRun = 0; batchRun < numberOfBatches; batchRun++) {
			
			// Sets will automatically prevent any duplicate values, making it perfect for the "Collection" type.
			// If we don't have a sufficient number of entries, it will just reject some. That's fine. Once populated, it's irrelevant.
			const entries = new Set();
			
			// Loop through all of the related forums:
			for (const [forum, values] of Object.entries(Feed.schema[feedName])) {
				
				// Get Values
				const weight = values.weight;
				const type = Forum.schema[forum].type;
				const newestId = iterators[forum];
				const totalToRetrive = Math.min(newestId, weight);
				
				// Get a list of posts from a "Collection" - meaning they aren't time sensitive.
				if(type === ForumType.Collect) {
					for(let i = 0; i < totalToRetrive; i++) {
						const id = Math.floor(Math.random() * newestId) + 1;
						entries.add(`post:${forum}:${id}`);
					}
				}
				
				// Get a list of posts from a time-sensitive ("News") forum.
				// TODO: Mixed could be separated to its own block of code.
				else if(type === ForumType.News || type === ForumType.Mixed) {
					
					// The iterator has to be reduced so that next time around we're not overlapping the same IDs.
					iterators[forum] -= totalToRetrive;
					
					for(let i = 0; i < totalToRetrive; i++) {
						const id = newestId - i;
						entries.add(`post:${forum}:${id}`);
					}
				}
			}
			
			// Append this batch of results to the homeIndex array.
			const batchResults: string[] = Array.from(entries) as string[];
			Data.shuffle(batchResults);
			posts = posts.concat(batchResults);
		}
		
		// Cache the Feed
		Feed.cached[feedName] = posts;
		console.log(`Built Feed Index: ${feedName}`);
		return posts;
		
		/*
			Later Considerations:
				World Events (make sure many are positive; if posting negative, post investigation on corruption, not just complaints)
					- Positive Foreign News
				Helpful Information - DYK, MythBusting
				Interesting Tidbits - TIL, Shower Thoughts, Thought Provoking
				Uplifting News
					- Meaningful Changes
					- Feel Good Stories
				Quality Journalism (Expose Corruption)
					- Investigative Journalism
				Trending News (not bs news, has to be meaningful; don't popularize stupid people unless we must)
				Impressive, Inspiring, Artistic
					- Beautiful Photography
					- Talent
				Culture Discovery (feature something from culture section)
				Hidden Gems (people or groups that don't get the attention they deserve)
				Stimulating - Mental Boost
		*/
	}
	
	// Initialize Feeds at Server Start.
	// NOTE: Feeds will build asynchronously, and may finish in any order.
	public static initialize() {
		Feed.build(FeedList.Home);
		Feed.build(FeedList.Creative);
		Feed.build(FeedList.Entertainment);
		Feed.build(FeedList.Fun);
		Feed.build(FeedList.Informative);
		Feed.build(FeedList.Lifestyle);
		Feed.build(FeedList.News);
	}
}
