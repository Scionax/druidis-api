
// Handle Exit Signals
// const sig = onSignal(Deno.Signal.SIGINT, () => {
// 	console.log("Received SIGINT");
// 	sig.dispose(); // De-register from receiving further events.
// });

import { Feed } from "../model/Feed.ts";

// const sig = signal(
// 	Deno.Signal.SIGUSR1,
// 	Deno.Signal.SIGINT
// );

// setTimeout(() => {}, 5000) // Prevents exiting immediately

// for await (const _ of sig) {
// 	console.log("interrupt or usr1 signal");
// }

// Deno.exit();

const PeriodicUpdates = 1000 * 15;		// # of milliseconds until the next periodic update cycle.

export default abstract class ServerMechanics {
	
	static async runOnExit() {
		console.log("Exited System");
	}
	
	// deno-lint-ignore require-await
	static async runScheduledUpdates() {
		
		Feed.runNextScheduledRebuild();
		
		// Repeatedly run the Periodic Updater
		setTimeout(() => { ServerMechanics.runScheduledUpdates(); }, PeriodicUpdates);
	}
}
