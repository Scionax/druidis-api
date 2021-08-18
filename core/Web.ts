import OpenGraph from "../core/OpenGraph.ts";
import Validate from "./Validate.ts";
import Conn from "./Conn.ts";
import { Buffer } from "../deps.ts";

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
		let slug: string = title.replace(/[^a-zA-Z0-9]/g, " ").trim().replace(/\s+/g, '-').substr(0, 50);
		
		// Find nearest position of whitespace below 50 characters.
		// Cut the URL, but make sure it ends at a space so that it's whole words being used.
		if(slug.length > 49) {
			for(let i = slug.length; i > 35; i--) {
				if(slug[i] == "-") {
					slug = slug.substr(0, i);
					break;
				}
			}
		}
		
		return slug.toLowerCase();
	}
	
	static async fetchHTML( url: string ): Promise<string> {
		
		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "text/plain" },
		});
		
		// Retrieve the site's HTML
		return await response.text()
	}
	
	static async fetchOGData( conn: Conn, url: string ): Promise<void> {
		
		// If there was not a valid URL provided, end here:
		if(!url || !Validate.isValidURL(url)) { conn.sendFail("Must provide a valid URL."); return; }
		
		// Retrieve the site's HTML
		const html = await Web.fetchHTML(url);
		
		if(!html) {
			conn.sendFail("No HTML to return."); return;
		}
		
		// Retrieve OpenGraph (og:) tags:
		const ogData = OpenGraph.getOGData(html);
		
		// Return OpenGraph Tags through API
		conn.sendJson( ogData );
	}
	
	// Download From URL
	static async download ( dir: string, file: string, url: string|URL, options?: RequestInit ): Promise<DownlodedFile> {
		
		const response = await fetch(url, options);
		
		if(response.status != 200){
			return Promise.reject(new Deno.errors.Http(`status ${response.status}-'${response.statusText}' received instead of 200`));
		}
		
		const blob = await response.blob();
		const size = blob.size; // Size in Bytes
		const buffer = await blob.arrayBuffer();
		const unit8arr = new Buffer(buffer).bytes();
		const fullPath = `${dir}/${file}`;
		
		// TODO: Implement 'ensureDir' once it's stable.
		// https://deno.land/std@0.105.0/fs/README.md
		
		try {
			await Deno.writeFile(fullPath, unit8arr, {create: true, mode: 0o755, append: false});
		} catch {
			console.error("Unable to write to: " + fullPath);
		}
		
		return Promise.resolve({file, dir, fullPath, size});
	}
}
