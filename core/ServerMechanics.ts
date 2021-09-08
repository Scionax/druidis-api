import { Feed } from "../model/Feed.ts";
import RedisDB from "./RedisDB.ts";

const PeriodicUpdates = 1000 * 15;		// # of milliseconds until the next periodic update cycle.

export default abstract class ServerMechanics {
	
	static async gracefulExit() {
		console.log("Gracefully exiting system...");
		console.log("Saving Redis Data...");
		await RedisDB.db.save();
		
		console.log("Final exit complete. Shutting down server.");
		Deno.exit();
	}
	
	// deno-lint-ignore require-await
	static async runScheduledUpdates() {
		
		Feed.runNextScheduledRebuild();
		
		// Repeatedly run the Periodic Updater
		setTimeout(() => { ServerMechanics.runScheduledUpdates(); }, PeriodicUpdates);
	}
}
