
export default abstract class FileSystem {
	
	static async writeJson( path: string, data: unknown ): Promise<string> {
		try {
			await Deno.writeTextFile(path, JSON.stringify(data));
			return "success";
		} catch (e) {
			return e.message;
		}
	}
	
	static async readJson( path:string ): Promise<string> {
		return await Deno.readTextFile(path);
	}
	
	static async getJson( path:string ): Promise<unknown> {
		const data = await Deno.readTextFile(path);
		return JSON.parse(data);
	}
}