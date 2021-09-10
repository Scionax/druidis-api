import { config } from "../config.ts";
import { log } from "../deps.ts";
import { ForumPost, PostStatus, TableType } from "../model/ForumPost.ts";
import { Mod, ModEventType, ModWarningType } from "../model/Mod.ts";
import { User, UserRole } from "../model/User.ts";
import ImageMod from "./ImageMod.ts";
import RedisDB from "./RedisDB.ts";

export default abstract class LocalServer {
	
	static async initialize() {
		
		// Only initialize this data on Windows
		if(Deno.build.os !== "windows") { return; } // NOTE: DO NOT REMOVE THIS LINE. It protects us from accidental database flush.
		
		// Flush the Database
		// Double check config settings, and make sure we're only flushing windows data.
		if(config.local === true && config.prod === false) {
			await RedisDB.db.flushdb();
		}
		
		// Produce Local Content
		await LocalServer.postSimple("Gaming", 1);
		await LocalServer.postSimple("Gaming", 2);
		await LocalServer.postSimple("Gaming", 3);
		await LocalServer.postSimple("Gaming", 4);
		await LocalServer.postSimple("Gaming", 5);
		await LocalServer.postSimple("Gaming", 6);
		await LocalServer.postSimple("Gaming", 7);
		await LocalServer.postSimple("Gaming", 8);
		await LocalServer.postSimple("Gaming", 9);
		await LocalServer.postSimple("Gaming", 10);
		await LocalServer.postSimple("Gaming", 11);
		await LocalServer.postSimple("Gaming", 12);
		await LocalServer.postSimple("Gaming", 13);
		await LocalServer.postSimple("Gaming", 14);
		await LocalServer.postSimple("Gaming", 15);
		await LocalServer.postSimple("Gaming", 16);
		await LocalServer.postSimple("Gaming", 17);
		await LocalServer.postSimple("Gaming", 18);
		await LocalServer.postSimple("Gaming", 19);
		await LocalServer.postSimple("Gaming", 20);
		await LocalServer.postSimple("Gaming", 21);
		await LocalServer.postSimple("Gaming", 22);
		await LocalServer.postSimple("Gaming", 23);
		await LocalServer.postSimple("Gaming", 24);
		await LocalServer.postSimple("Gaming", 25);
		await LocalServer.postSimple("Gaming", 26);
		await LocalServer.postSimple("Gaming", 27);
		await LocalServer.postSimple("Gaming", 28);
		await LocalServer.postSimple("Gaming", 29);
		await LocalServer.postSimple("Gaming", 30);
		
		log.info("Created Local Gaming Post Placeholders.");
		
		// Add Users
		const id1 = await User.createUser("Druidis", "password", "info@druidis.org", {});
		const id2 = await User.createUser("TheMod", "password", "themod@druidis.org", {});
		const id3 = await User.createUser("AnnoyingGuest", "password", "annoying@example.com", {});
		
		if(!id1 || !id2 || !id3) { log.error("Error when creating users."); } else { log.info("Created Users."); }
		
		// Assign Roles
		await User.setRole(id1, UserRole.Superuser);
		await User.setRole(id2, UserRole.Mod);
		
		// Add Some Mod Reports
		await Mod.createModEvent(id2, id3, ModEventType.Report, "User was annoying me.", ModWarningType.ExcessNegativity);
		await Mod.createModEvent(id2, id3, ModEventType.Mute, "User said something demonstrably untrue.", ModWarningType.Misinformation);
	}
	
	static async postSimple(forum: string, id: number, status = PostStatus.Visible) {
		
		// Convert Raw Data to ForumPost
		const post = await ForumPost.buildMediaPost(
			forum,
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
		if(typeof post === "string") { log.error(`Error on postSimple(${forum}, ${id}): ${post}`); return; }
		
		// Need to provide image updates for local behavior:
		const {imgPath, width, height} = LocalServer.randomImage();
		post.setImage(imgPath, width, height);
		
		post.applyTrackedValues(
			status,
			(Date.now() - (Math.ceil(Math.random() * 1000 * 3600 * 24 * 365))), // created
			0, // edited
			Math.ceil(Math.random() * 100000), // views
			Math.ceil(Math.random() * 1000), // clicks
			Math.ceil(Math.random() * 10), // comments
		);
		
		// Save To Database
		await post.saveToRedis(TableType.Post);
	}
	
	static randomImage() {
		let imgPath, height;
		const width = 600;
		const rnd = Math.floor(Math.random() * 5);
		
		switch(rnd) {
			case 1: imgPath = `local-1-hash.webp`; height = 315; break;
			case 2: imgPath = `local-2-hash.webp`; height = 443; break;
			case 3: imgPath = `local-3-hash.webp`; height = 462; break;
			case 4: imgPath = `local-4-hash.webp`; height = 487; break;
			default: imgPath = `local-5-hash.webp`; height = 462; break;
		}
		
		return {imgPath, width, height};
	}
	
	static randomTitle() {
		const rnd = Math.ceil(Math.random() * 10);
		switch(rnd) {
			case 1: return "This title is pretty cool.";
			case 2: return "The return of the title. Let's make some of these longer so we can get some reference points available to us.";
			case 3: return "Headlines beware! We're coming for you.";
			case 4: return "This is a longer headline than usual. It's mostly for testing purposes.";
			case 5: return "Are you paying attention to this? You should. It's the best thing since sliced bread.";
			case 6: return "You won't believe what happens next! Or maybe you will. I don't know.";
			case 7: return "Please click on this. It's pure clickbait.";
			case 8: return "Sometimes things just go well. And it's nice.";
			case 9: return "A short headline.";
			case 10: return "Have you met the muffin man? Come buy a muffin for $50.";
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