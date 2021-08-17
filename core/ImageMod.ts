import { exists, path } from "../deps.ts";
import VerboseLog from "./VerboseLog.ts";

/*
	This class modifies images into webp format.
	
	// Details and parameter options about cwebp are available here:
		https://developers.google.com/speed/webp/docs/cwebp
	
	1. To get the cwebp binaries (linux, windows, etc), go to:
		https://storage.googleapis.com/downloads.webmproject.org/releases/webp/index.html
	
	2. Copy it to /bin/cwebp_linux, /bin/cwebp_windows.exe, etc.
	
	3. You must run ImageMod.initialize() when the server starts to register the path.
	
	4. Run an example to test it:
		ImageMod.convert("./test-image.jpeg", "./test-image.webp", "-q 80");
*/

export default abstract class ImageMod {
	
	static binFile: string;			// The file path to the `cwebp` binary.
	
	static async initialize() {
		
		const platform = Deno.build.os;							// linux, windows, darwin (mac)
		const binPath = path.resolve(Deno.cwd(), "bin");		// The path to the '/bin' that contains the cwebp binary.
		let binName = "";										// The binary name, e.g. cwebp_linux, cwebp_win64.exe, etc.
		
		// Determine the OS
		switch(platform) {
			case "linux": binName = "cwebp_linux"; break;
			case "windows": binName = "cwebp_windows.exe"; break;
			case "darwin": binName = "cwebp_osx"; break;
			default:
				console.error("Error with cwebp: unable to identify platform `" + platform + "`.");
				return "";
		}
		
		ImageMod.binFile = path.resolve(binPath, binName);
		
		// Make sure the bin file exists.
		if(!(await exists(ImageMod.binFile))) {
			console.error("Error with ImageMod.initialize(). Unable to verify that the bin file exists.");
			return;
		}
		
		// Make sure the bin file can be accessed.
		if(platform == "linux") {
			await Deno.chmod(ImageMod.binFile, 0o764);
		}
		
		console.log("Image & Webp Manipulation System Initialized.")
	}
	
	// Usage: cwebp [options] -q quality input.png -o output.webp
	// Quality is between 0 (poor) to 100 (very good). Typical quality is around 80.
	static async convert(inputImage: string, outputImage: string, option: string, logging = "-quiet") {
		
		if(!ImageMod.binFile) { console.error("Cannot find `cwebp` binary. See ImageMod class for details."); return; }
		
		// Make sure the input image exists:
		if(!(await exists(inputImage))) {
			VerboseLog.log("Error with ImageMod.convert(). Image does not exist.");
			return;
		}
		
		// Convert the Image
		const params: string[] = [
			ImageMod.binFile,
			path.resolve(Deno.cwd(), inputImage),
			"-o",
			path.resolve(Deno.cwd(), outputImage),
			...option.split(" "),
			logging,
		];
		
		return Deno.run({ cmd: params, stdout: "inherit", stderr: "inherit" }).status()
	}
}
