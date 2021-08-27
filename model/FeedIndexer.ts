
/*
	// Forum Indexing Process
	1. Check if there are any cached results from the last 15 minutes.
		- If so, return the cached results.
	2. If results are stale, run the algorithm and cache new results. Return to step #1.
*/

export class FeedIndexer {
	
	constructor() {}
	
	public buildForumIndex() {}
	
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
