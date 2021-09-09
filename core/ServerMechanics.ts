import { log } from "../deps.ts";
import { Feed } from "../model/Feed.ts";
import RedisDB from "./RedisDB.ts";

const PeriodicUpdates = 1000 * 15;		// # of milliseconds until the next periodic update cycle.

export default abstract class ServerMechanics {
	
	// Logging Handler - Saves "warnings" or higher in log.txt
	//		log.debug("Standard debug message. Won't get logged in a file.");
	//		log.info("Standard info message. Won't get logged in a file.");
	//		log.warning(true);
	//		log.error({ foo: "bar", fizz: "bazz" });
	//		log.critical("500 Internal Server Error");
	static async setupLogger() {
		await log.setup({
			handlers: {
				console: new log.handlers.ConsoleHandler("DEBUG"),
				file: new log.handlers.FileHandler("WARNING", {
					filename: "./log.txt",
					formatter: "{levelName} {msg}",
				}),
			},
			
			loggers: {
				default: { level: "DEBUG", handlers: ["console", "file"] },
			},
		});
	}
	
	// TODO: Need signals implemented once Deno has it prepared.
	static handleSignals() {
		
		// Handle Termination Signals
		// if(Deno.build.os === "linux") {
			
		// 	const sig = signal(
		// 		Deno.Signal.SIGINT,			// Interrupt: Control + C
		// 		Deno.Signal.SIGTERM,		// Standard 'kill' termination
		// 		Deno.Signal.SIGQUIT,		// Modified kill, generally designed to dump output.
		// 		// Deno.Signal.SIGUSR1,		// Custom User Signal
		// 	);
			
		// 	// If a termination signal is detected, run our graceful exit:
		// 	for await (const _ of sig) {
		// 		ServerMechanics.gracefulExit();
		// 	}
		// }
	}
	
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
