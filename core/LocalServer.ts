import { config } from "../config.ts";
import { ForumPost, PostStatus } from "../model/ForumPost.ts";
import ImageMod from "./ImageMod.ts";
import Mapp from "./Mapp.ts";
import { TableType } from "./Types.ts";

export default abstract class LocalServer {
	
	static async initialize() {
		
		// Only initialize this data on Windows
		if(Deno.build.os !== "windows") { return; } // NOTE: DO NOT REMOVE THIS LINE. It protects us from accidental database flush.
		
		// Flush the Database
		// Double check config settings, and make sure we're only flushing windows data.
		if(config.local === true && config.prod === false) {
			await Mapp.redis.flushdb();
		}
		
		// Produce Local Content
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
		LocalServer.postSimple("Gaming", 15);
		LocalServer.postSimple("Gaming", 16);
		LocalServer.postSimple("Gaming", 17);
		LocalServer.postSimple("Gaming", 18);
		LocalServer.postSimple("Gaming", 19, "Events");
		LocalServer.postSimple("Gaming", 20, "Events");
		LocalServer.postSimple("Gaming", 21, "Events");
		LocalServer.postSimple("Gaming", 22, "Events");
		LocalServer.postSimple("Gaming", 23, "Events");
		LocalServer.postSimple("Gaming", 24, "Events");
		LocalServer.postSimple("Gaming", 25, "Events");
		LocalServer.postSimple("Gaming", 26, "Events");
		LocalServer.postSimple("Gaming", 27, "Events");
		LocalServer.postSimple("Gaming", 28, "Showoff");
		LocalServer.postSimple("Gaming", 29, "Showoff");
		LocalServer.postSimple("Gaming", 30, "Showoff");
		
		await Mapp.redis.set(`count:post:Gaming`, 30);
		console.log("Created Local Gaming Post Placeholders.");
	}
	
	static async postSimple(forum: string, id: number, category = "", status = PostStatus.Visible) {
		
		// Convert Raw Data to ForumPost
		const post = await ForumPost.buildMediaPost(
			forum,
			category,
			"http://example.com", // url
			0, // authorId
			LocalServer.randomTitle(), // title
			LocalServer.randomContent(), // content
			ImageMod.baseImageWidth, // w
			ImageMod.baseImageHeight, // h
			status,
			false, // isVideo
		);
		
		// On Failure
		if(typeof post === "string") { console.error(`Error on postSimple(${forum}, ${id}, ${category}): ${post}`); return; }
		
		// Need to provide image updates for local behavior:
		const {imgPath, width, height} = LocalServer.randomImage();
		post.setImage(imgPath, width, height);
		
		post.applyTrackedValues(
			status,
			(Date.now() - (Math.ceil(Math.random() * 1000 * 3600 * 24 * 365))), // timePosted
			0, // timeEdited
			Math.ceil(Math.random() * 100000), // views
			Math.ceil(Math.random() * 1000), // clicks
			Math.ceil(Math.random() * 10), // comments
		);
		
		// Save To Database
		post.saveToRedis(TableType.Post);
	}
	
	static randomImage() {
		let imgPath, height;
		const width = 600;
		const rnd = Math.floor(Math.random() * 5);
		
		switch(rnd) {
			case 1: imgPath = `img-local-1.webp`; height = 315; break;
			case 2: imgPath = `img-local-2.webp`; height = 443; break;
			case 3: imgPath = `img-local-3.webp`; height = 462; break;
			case 4: imgPath = `img-local-4.webp`; height = 487; break;
			default: imgPath = `img-local-5.webp`; height = 462; break;
		}
		
		return {imgPath, width, height};
	}
	
	static randomTitle() {
		const rnd = Math.ceil(Math.random() * 10);
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
		const rnd = Math.ceil(Math.random() * 10);
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