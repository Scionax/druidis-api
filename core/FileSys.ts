// This class provides helper functions for modifying data.

export default abstract class FileSys {
	
	// Deno's exist() is deprecated due to potential race conditions / exploits.
	// See: https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
	// This achieves the same result in a safe way, though probably less efficiently.
	public static async exists(file: string) {
		try {
			await Deno.stat(file);
		}
		
		catch(e) {
			if(e instanceof Deno.errors.NotFound) {
				return false;
			}
		}
		
		return true;
	}
	
	static async getFilesRecursive(baseDir: string, relativeDir = ""): Promise<string[]> {
		const path = `${Deno.cwd()}/${baseDir}${relativeDir}`;
		let files: string[] = [];
		
		for await (const dirEntry of Deno.readDir(path)) {
			if(dirEntry.isFile) {
				files.push(`${relativeDir}/${dirEntry.name}`);
			} else if(dirEntry.isDirectory) {
				files = files.concat(await FileSys.getFilesRecursive(baseDir, `${relativeDir}/${dirEntry.name}`));
			}
		}
		
		return files;
	}
}