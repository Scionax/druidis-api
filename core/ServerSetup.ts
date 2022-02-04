import { config } from "../config.ts";
import { log } from "../deps.ts";
import { ForumPost, PostStatus, TableType } from "../model/ForumPost.ts";
import { Mod, ModEventType, ModWarningType } from "../model/Mod.ts";
import { User, UserRole } from "../model/User.ts";
import ImageMod from "./ImageMod.ts";
import RedisDB from "./RedisDB.ts";

export default abstract class ServerSetup {
	
	static async initialize() {
		
		// Local Test Data
		if(config.local === true && config.prod === false && Deno.build.os === "windows") {
			await ServerSetup.initializeLocalTestData();
		}
	}
	
	private static async initializeLocalTestData() {
		
		// Double check config settings. Ensures we're only flushing windows data.
		if(config.local === false || config.prod === true || Deno.build.os !== "windows") {
			return;
		}
		
		// Flush the Database
		await RedisDB.db.flushdb();
		
		// Initialize Local Test Data
		await ServerSetup.initializeTestUsers();
		await ServerSetup.initalizeTestReports();
		
		// Create Test Forum Posts in "Gaming"
		for(let i = 1; i <= 15; i++) {
			await ServerSetup.postSimple("Gaming", i);
			await ServerSetup.postSimple("Movies", i);
			await ServerSetup.postSimple("Music", i);
		}
		
		log.info("Created Local Gaming Post Placeholders.");
	}
	
	static async initializeTestUsers() {
		await ServerSetup.initializeUser("Druidis", "password", "info@druidis.org", UserRole.Superuser);
		await ServerSetup.initializeUser("TheMod", "password", "themod@druidis.org", UserRole.Mod);
		await ServerSetup.initializeUser("AnnoyingGuest", "password", "annoying@example.com");
		await ServerSetup.initializeUser("TrustedUser", "password", "trusted@example.com");
	}
	
	static async initalizeTestReports() {
		
		const modId = await User.getId("TheMod");
		const userId = await User.getId("AnnoyingGuest");
		
		if(!modId || !userId) {
			log.error(`Cannot create Mod Reports. The user "TheMod" or "AnnoyingGuest" does not exist.`);
			return;
		}
		
		// Add Some Mod Reports
		await Mod.createModEvent(modId, userId, ModEventType.Report, "User was annoying me.", ModWarningType.ExcessNegativity);
		await Mod.createModEvent(modId, userId, ModEventType.Mute, "User said something demonstrably untrue.", ModWarningType.Misinformation);
		
		log.info(`Created Mod Reports for user 'AnnoyingGuest'.`);
	}
	
	private static async initializeUser(username: string, password: string, email: string, role: UserRole = UserRole.Guest) {
		
		// Check if the user already exists:
		const alreadyExists = await User.usernameExists(username);
		
		if(alreadyExists) {
			log.info(`User '${username}' already exists.`);
			return;
		}
		
		// Create the user
		const id = await User.createUser(username, password, email, {});
		
		if(!id) {
			log.error(`Failed to create user '${username}'.`);
			return;
		}
		
		log.info(`Created user '${username}'.`);
		
		// Assign Role
		await User.setRole(id, role);
	}
	
	private static async postSimple(forum: string, id: number, status = PostStatus.Visible) {
		
		// Get a fake author ID
		const authorId = await User.getId("Druidis");
		
		// Convert Raw Data to ForumPost
		const post = await ForumPost.buildMediaPost(
			forum,
			"http://example.com", // url
			authorId, // authorId
			ServerSetup.randomTitle(), // title
			ServerSetup.randomContent(), // content
			ImageMod.baseImageWidth, // w
			ImageMod.baseImageHeight, // h
			status,
			false, // isVideo
		);
		
		// On Failure
		if(typeof post === "string") { log.error(`Error on postSimple(${forum}, ${id}): ${post}`); return; }
		
		// Need to provide image updates for local behavior:
		const {imgPath, width, height} = ServerSetup.randomImage();
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
	
	private static randomImage() {
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
	
	private static randomTitle() {
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
	
	private static randomContent() {
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