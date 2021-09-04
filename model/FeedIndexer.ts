import { Forum, ForumType } from "./Forum.ts";

/*
	// Forum Indexing Process
	1. Check if there are any cached results from the last 15 minutes.
		- If so, return the cached results.
	2. If results are stale, run the algorithm and cache new results. Return to step #1.
*/

enum IndexList {
	Entertainment = "Entertainment",
	News = "News",
	Informative = "Informative",
	Lifestyle = "Lifestyle",
	Fun = "Fun",
	Creative = "Creative",
}

export class FeedIndexer {
	
	/*
		To determine what is in a forum index, get 100 of the latest results from the given forums.
			- Retrieve a number from each forum based on a weighting score.
			- Position them randomly. Use a sorted set of 1000.
		
		"weight" refers to the percent (of 100) of how often the related forum appears in the index.
		
		We also use the "ForumType," which helps indicate how the entries should be retrieved.
			"News" means the forum is based on current events. Should extract results by recent IDs.
			"Collect" means the forum is a collection; entries can be selected from any point and still be relevant.
			"Mixed" means the forum is a collection, but generally has time-sensitive relevance.
	*/
	
	static indexDetails: { [index: string]: { [forum: string]: { weight: number } } } = {
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
	}
	
	constructor() {}
	
	public getEntriesFromForum(index: IndexList, forum: string, num: number) {
		const weight = FeedIndexer.indexDetails[index][forum].weight;
		const type = Forum.schema[forum].type;
		
		// TODO:
		// const highestId = !!!; // Must set this value to proceed. Identify the highest ID for 
		
		// TODO: Mixed can be it's own search version:
		if(type === ForumType.News || type === ForumType.Mixed) {
			// 1. Get the first `num` results.
		}
		
		else if(type === ForumType.Collect) {
			// 1. Get `num` results from any ID available
		}
	}
	
	public buildForumIndex() {
		
	}
	
	public buildHomeIndex() {
		
		/*
			Algorithm:
			The algorithm sources data based on the following classifications.
			Every {X} posts contains one of each of the PRIMARY classes.
			To do this, every {X} posts, it builds a new set of 20 options, and sorts it by random.
			
			??? (Should we have this integrate into other sets?)
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
		
		/*
			PRIMARY:
				World Events (make sure many are positive; if posting negative, post investigation on corruption, not just complaints)
					- Positive Foreign News
				Entertainment News
					- Sports
					- People, Celebrities
					- Events
				Entertainment Discovery (Feature Games, Music, Movies, Shows, etc)
				Helpful Information - DYK, MythBusting
				Interesting Tidbits - TIL, Shower Thoughts, Thought Provoking
				Community Questions - Ask
				Uplifting News
					- Meaningful Changes
					- Feel Good Stories
				Science & Education
				Quality Journalism (Expose Corruption)
					- Investigative Journalism
				Issues
					- Political Issues
					- Social Issues
					- Climate & Environment
				Technology
					- Energy
					- Artificial Intelligence
					- Space
					- Robotics
					- Gadgets
					- Futurism
				Trending News (not bs news, has to be meaningful; don't popularize stupid people unless we must)
				General News
					- Economy, Business, Finance, Investments
					- Crime & Justice
					- Legal
				Funny, Comedy
				Cute, Aww
				Impressive, Inspiring, Artistic
					- Beautiful Photography
					- Talent
				Creative Discovery - Arts & Crafts, Design, Creative (Writing)
				Culture Discovery (feature something from culture section)
				Lifestyle
					- Travel
					- Fitness
					- Fashion
					- Food, Recipes
					- Social & Relationships
					- Health & Wellness
					- Advice, Personal Growth, How-Tos
				Hidden Gems (people or groups that don't get the attention they deserve)
			
			INJECTIONS:
				Call To Action
				Druidis News
				Sponsored
				
			???:
				Stimulating - Mental Boost
		*/
	}
}
