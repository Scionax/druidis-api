import OpenGraph from "../core/OpenGraph.ts";
import Validate from "./Validate.ts";
import Conn from "./Conn.ts";
import { Buffer, ensureDir, log } from "../deps.ts";

export interface DownlodedFile {
	file: string,
	dir: string,
	fullPath: string,
	size: number
}

export default abstract class Web {
	
	// Convert Title to URL
	static getSlugFromTitle(title: string): string {
		
		// Removes all extra whitespace and special symbols. Replaces whitespace with dashes to make it url safe.
		let slug: string = title.replace(/[^a-zA-Z0-9]/g, " ").trim().replace(/\s+/g, '-').substring(0, 50);
		
		// Find nearest position of whitespace below 50 characters.
		// Cut the URL, but make sure it ends at a space so that it's whole words being used.
		if(slug.length > 49) {
			for(let i = slug.length; i > 35; i--) {
				if(slug[i] == "-") {
					slug = slug.substring(0, i);
					break;
				}
			}
		}
		
		return slug.toLowerCase();
	}
	
	static async fetchHTML( url: string ): Promise<string> {
		
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: { "Content-Type": "text/plain" },
			});
			
			// Retrieve the site's HTML
			return await response.text()
		}
		
		catch {
			log.debug(`Failed a fetch() call with url: ${url}`);
			return Promise.reject("Failed HTML Fetch.");
		}
	}
	
	static async fetchOGData( conn: Conn, url: string ): Promise<void> {
		
		// If there was not a valid URL provided, end here:
		if(!url || !Validate.isValidURL(url)) { conn.badRequest("Must provide a valid URL."); return; }
		
		// Retrieve the site's HTML
		const html = await Web.fetchHTML(url);
		
		if(!html) {
			conn.badRequest("No HTML to return."); return;
		}
		
		// Retrieve OpenGraph (og:) tags:
		const ogData = OpenGraph.getOGData(html);
		
		// Return OpenGraph Tags through API
		conn.sendJSON( ogData );
	}
	
	// Download From URL
	static async download( dir: string, file: string, url: string|URL, options?: RequestInit ): Promise<DownlodedFile | false> {
		let response: Response;
		
		try {
			response = await fetch(url, options);
		} catch {
			log.warning("URL Fetch Failed. Likely the result of a malformed URL.");
			return false;
		}
		
		if(response.status != 200){
			log.warning(`Web.download() returned status ${response.status}-'${response.statusText}'`);
			return false;
		}
		
		const blob = await response.blob();
		const size = blob.size; // Size in Bytes
		const buffer = await blob.arrayBuffer();
		const unit8arr = new Buffer(buffer).bytes();
		const fullPath = `${dir}/${file}`;
		
		// Make sure the directory exists.
		await ensureDir(dir);
		
		try {
			await Deno.writeFile(fullPath, unit8arr, {create: true, mode: 0o755, append: false});
		} catch {
			log.error(`Web.download() unable to write to: ${fullPath}`);
			return false;
		}
		
		return Promise.resolve({file, dir, fullPath, size});
	}
}
