

// Handle Exit Signals
// const sig = onSignal(Deno.Signal.SIGINT, () => {
// 	console.log("Received SIGINT");
// 	sig.dispose(); // De-register from receiving further events.
// });

// const sig = signal(
// 	Deno.Signal.SIGUSR1,
// 	Deno.Signal.SIGINT
// );

// setTimeout(() => {}, 5000) // Prevents exiting immediately

// for await (const _ of sig) {
// 	console.log("interrupt or usr1 signal");
// }

// Deno.exit();

export default abstract class ServerMechanics {
	
	static async runOnExit() {
		console.log("Exited System");
	}
}
