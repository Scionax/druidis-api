// This class provides helper functions for modifying data.

export default abstract class Data {
	
	static async getFilesRecursive(baseDir: string, relativeDir = ""): Promise<string[]> {
		const path = `${Deno.cwd()}/${baseDir}${relativeDir}`;
		let files: string[] = [];
		
		for await (const dirEntry of Deno.readDir(path)) {
			if(dirEntry.isFile) {
				files.push(`${relativeDir}/${dirEntry.name}`);
			} else if(dirEntry.isDirectory) {
				files = files.concat(await Data.getFilesRecursive(baseDir, `${relativeDir}/${dirEntry.name}`));
			}
		}
		
		return files;
	}
	
	static shuffle(arrayToShuffle: Array<unknown>) {
		let last = arrayToShuffle.length;
		let n;
		while(last > 0) {
			n = Data.randInteger(last);
			Data._arraySwap(arrayToShuffle, n, --last);
		}
	}
	
	static randInteger(maxNum: number) {
		return Math.floor(Math.random() * maxNum);
	}
	
	private static _arraySwap(arr: Array<unknown>, i: number, j: number) {
		let q = arr[i];
		arr[i] = arr[j];
		arr[j] = q;
		return arr;
	}
}
