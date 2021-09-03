// deno run --allow-net --allow-write --allow-read --allow-run --allow-env --unstable playground.ts --runDirect

export default abstract class Playground {
	
	static runOnServerLoad() {
		
		return true;
	}
	
	static async runOnDirectLoad() {
		
		const { files } = await Deno.emit("../scripts/druidis.ts");
		for (const [fileName, text] of Object.entries(files)) {
			console.log(`emitted ${fileName} with a length of ${text}`);
		}
	}
}

if(Deno.args.indexOf("--runDirect") > -1) {
	await Playground.runOnDirectLoad();
}
