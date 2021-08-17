import OpenGraph from "../core/OpenGraph.ts";
import Validate from "./Validate.ts";
import Conn from "./Conn.ts";

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
}
