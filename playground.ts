// deno run --allow-net --allow-write --allow-read --allow-run --allow-env --unstable playground.ts --runDirect

import { log } from "./deps.ts";

export default abstract class Playground {
	
	static runOnServerLoad() {
		
		return true;
	}
	
	static async runOnDirectLoad() {
		
		const { files } = await Deno.emit("../scripts/druidis.ts");
		for (const [fileName, text] of Object.entries(files)) {
			log.info(`emitted ${fileName} with a length of ${text}`);
		}
	}
}

if(Deno.args.indexOf("--runDirect") > -1) {
	await Playground.runOnDirectLoad();
}
