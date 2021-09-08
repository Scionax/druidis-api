import { exists, log, path } from "../deps.ts";

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

type CropRules = {
	crop: boolean;
	x: number;
	y: number;
	w: number;
	h: number;
}

export default abstract class ImageMod {
	
	static binFile: string;			// The file path to the `cwebp` binary. Gets initialized.
	
	static baseImageWidth = 400;
	static baseImageHeight = 308;	// Should be equal to baseImageWidth / 1.3
	
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
				log.critical("Error with cwebp: unable to identify platform `" + platform + "`.");
				return "";
		}
		
		ImageMod.binFile = path.resolve(binPath, binName);
		
		// Make sure the bin file exists.
		if(!(await exists(ImageMod.binFile))) {
			log.critical("Error with ImageMod.initialize(). Unable to verify that the bin file exists.");
			return;
		}
		
		// Make sure the bin file can be accessed.
		if(platform == "linux") {
			await Deno.chmod(ImageMod.binFile, 0o764);
		}
		
		log.info("Image & Webp Manipulation System Initialized.")
	}
	
	// Crop to 1.3:1 Aspect Ratios (Wide). If too short, can center on a background.
	static getWideAspectCrop(origWidth: number, origHeight: number): CropRules {
		
		let crop = false;
		let x = 0, y = 0, w = 0, h = 0;
		
		const xRatio = origWidth > origHeight ? Math.round(origWidth / origHeight * 100) / 100 : 1;
		const yRatio = origHeight > origWidth ? Math.round(origHeight / origWidth * 100) / 100 : 1;
		
		// For Extreme Wide Images (above 4:1), reduce to 4:1 ratio
		if(xRatio > 4) {
			crop = true;
			
			// Determine crop sizes for a 4:1 ratio.
			w = origHeight * 4;
			h = origHeight;
			
			// Determine crop coordinates (to center the image).
			x = Math.round((origWidth - w) / 2);
			y = 0;
		}
		
		// For Tall Images (Above 1:1.2)
		else if(yRatio >= 1.2) {
			crop = true;
			
			// Determine crop sizes for a 1.2:1 ratio.
			w = origWidth;
			h = Math.round(origWidth * 1.2);
			
			// Determine crop coordinates (to center the image).
			x = 0;
			y = Math.round((origHeight - h) / 2);
		}
		
		// Only crop if it is above an appropriate size to do so.
		if(crop && w && h && (origWidth > ImageMod.baseImageWidth || origHeight > ImageMod.baseImageHeight)) {
			return { crop, x, y, w, h };
		}
		
		return { crop: false, x: 0, y: 0, w: origWidth, h: origHeight };
	}
	
	static getResizeRules(cropRules: CropRules): CropRules {
		
		if(ImageMod.baseImageWidth > cropRules.w) {
			return { crop: cropRules.crop, x: cropRules.x, y: cropRules.y, w: cropRules.w, h: cropRules.h };
		}
		
		const div = ImageMod.baseImageWidth / cropRules.w;
		const newHeight = cropRules.h * div;
		
		return { crop: cropRules.crop, x: cropRules.x, y: cropRules.y, w: ImageMod.baseImageWidth, h: newHeight };
	}
	
	static async convert(inputPath: string, outputPath: string, cropRules: CropRules, origWidth: number, _origHeight: number) {
		
		let option = "";
		
		// Crop
		if(cropRules.crop) {
			option = `-crop ${cropRules.x} ${cropRules.y} ${cropRules.w} ${cropRules.h}`;
		}
		
		// Resize
		if(origWidth > ImageMod.baseImageWidth && cropRules.w > ImageMod.baseImageWidth) {
			option += (option === "" ? "" : " ") + `-resize ${ImageMod.baseImageWidth} 0`;
		}
		
		await ImageMod.convertFormal(inputPath, outputPath, option);
	}
	
	// Usage: cwebp [options] -q quality input.png -o output.webp
	// 	-q						Quality is between 0 (poor) to 100 (very good). Typical quality is 80. Default is 75.
	//	-o						Output. The file to create the result at.
	
	// Extra Options:
	//	-resize width height	Resize image to size width x height. Set one to 0 to preserve it's aspect-ratio.
	//	-crop x y w h			Crop from top left (x, y) with size (w, h).
	//	-noalpha				Discards the alpha channel.
	//	-metadata opt			Comma separated list of metadata to copy. Options: all, none, exif, icc, xmp, etc. Defaults to none.
	//	-lossless				Encode the image without any loss.
	static async convertFormal(inputPath: string, outputPath: string, option = "") {
		
		if(!ImageMod.binFile) { log.critical("Cannot find `cwebp` binary. See ImageMod class for details."); return; }
		
		// Make sure the input image exists:
		if(!(await exists(inputPath))) {
			log.warning("Error with ImageMod.convert(). Image does not exist.");
			return;
		}
		
		// Add quality rating and silence logging.
		// Also ensures the ...option param will run correctly.
		option += (option === "" ? "" : " ") + "-q 80 -quiet";
		
		// Convert the Image
		const params: string[] = [
			ImageMod.binFile,
			path.resolve(Deno.cwd(), inputPath),
			"-o",
			path.resolve(Deno.cwd(), outputPath),
			...option.split(" ")
		];
		
		return Deno.run({ cmd: params, stdout: "inherit", stderr: "inherit" }).status();
	}
}
