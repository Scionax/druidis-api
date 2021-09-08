import { log } from "../deps.ts";
import { Feed } from "../model/Feed.ts";
import RedisDB from "./RedisDB.ts";

const PeriodicUpdates = 1000 * 15;		// # of milliseconds until the next periodic update cycle.

export default abstract class ServerMechanics {
	
	static async gracefulExit() {
		log.info("Gracefully exiting system...");
		log.info("Saving Redis Data...");
		await RedisDB.db.save();
		
		log.info("Final exit complete. Shutting down server.");
		Deno.exit();
	}
	
	// deno-lint-ignore require-await
	static async runScheduledUpdates() {
		
		Feed.runNextScheduledRebuild();
		
		// Repeatedly run the Periodic Updater
		setTimeout(() => { ServerMechanics.runScheduledUpdates(); }, PeriodicUpdates);
	}
}
