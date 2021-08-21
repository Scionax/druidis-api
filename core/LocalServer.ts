import { PostStatus } from "../model/ForumPost.ts";
import Mapp from "./Mapp.ts";

export default abstract class LocalServer {
	
	static initialize() {
		
		LocalServer.postSimple("Gaming", 1);
		LocalServer.postSimple("Gaming", 2);
		LocalServer.postSimple("Gaming", 3);
		LocalServer.postSimple("Gaming", 4);
		LocalServer.postSimple("Gaming", 5);
		LocalServer.postSimple("Gaming", 6);
		LocalServer.postSimple("Gaming", 7);
		LocalServer.postSimple("Gaming", 8);
		LocalServer.postSimple("Gaming", 9);
		LocalServer.postSimple("Gaming", 10);
		LocalServer.postSimple("Gaming", 11);
		LocalServer.postSimple("Gaming", 12);
		LocalServer.postSimple("Gaming", 13);
		LocalServer.postSimple("Gaming", 14);
		
		LocalServer.postSimple("News", 1, "Politics");
		LocalServer.postSimple("News", 2, "Politics");
		LocalServer.postSimple("News", 3, "Politics");
		LocalServer.postSimple("News", 4, "Events");
		LocalServer.postSimple("News", 5, "Events");
		LocalServer.postSimple("News", 6, "Events");
	}
	
	static postSimple(forum: string, id: number, category = "", status = PostStatus.Visible) {
		
		// TODO: hmset is deprecated, but hset (the supposed alternative) is not functioning. Wait until fixed.
		return Mapp.redis.hmset("post:" + forum + ":" + id,
			
			// Fixed Content
			["forum", forum],
			["id", id],
			["category", category],
			["title", LocalServer.randomTitle()],
			["url", "http://example.com"],
			["authorId", 0],
			["hash", "local"],
			["content", LocalServer.randomContent()],
			
			// Tracked Values
			["status", status],
			["timePosted", (Date.now() - (Math.random() * 1000 * 3600 * 24 * 365))],
			["timeEdited", 0],
			["views", Math.random() * 100000],
			["clicks", Math.random() * 1000],
			["comments", Math.random() * 10],
			
			// Awards
			// ["awards.druid", this.awards.druid],
			// ["awards.tree", this.awards.tree],
			// ["awards.plant", this.awards.plant],
			// ["awards.seed", this.awards.seed],
		);
	}
	
	static randomTitle() {
		const rnd = Math.random() * 10;
		switch(rnd) {
			case 1: return "This title is pretty cool.";
			case 2: return "The return of the title.";
			case 3: return "Headlines beware! We're coming for you.";
			case 4: return "This is a longer headline than usual. It's mostly for testing purposes.";
			case 5: return "Are you paying attention to this?";
			case 6: return "You won't believe what happens next!";
			case 7: return "Please click on this. It's pure clickbait.";
			case 8: return "Sometimes things just go well. And it's nice.";
			case 9: return "A short headline.";
			case 10: return "Have you met the muffin man?";
		}
		
		return "In theory, this headline should not appear. But if it does, that's fine."
	}
	
	static randomContent() {
		const rnd = Math.random() * 10;
		switch(rnd) {
			case 1: return "Okay, so one day I was talking to this dog, and he was like 'WOOF'. And I was like 'OMG, a talking dog!'.";
			case 2: return "Something tells me that this isn't the first time you've done that. Is it the second time? Because that would be cool.";
			case 3: return "Nobody suspects the spanish inquisition.";
			case 4: return "Red alert! Red alert! This was a test from the testing broadcasting agency of red alerts.";
			case 5: return "What? Such short information.";
			case 6: return "Are you entertained?";
			case 7: return "Artificial intelligence is awesome. Why do people fear it? I fear artifical unintelligence, which is what most humans are stuck in.";
			case 8: return "I'm not saying the Mayans were right, but from a historical perspective, 2012 sure seems like it's at the epicenter of a lot of exponential curves.";
			case 9: return "Dude, where's my car keys? That would have made a much less interesting movie concept.";
			case 10: return "RWBY is one of the greatest stories of all time.";
		}
		
		return "Brandon Sanderson is an author that wrote Mistborn, and based on the lore I've seen, I'd really like to read that book."
	}
}