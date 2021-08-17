import { DOMParser } from "../deps.ts";

// OpenGraph Data, parsed from HTML text
export class OGData {
	
	url: string;
	title: string;
	image: MetaVisual;
	video: MetaVisual;
	description: string;
	determiner: string;			// Word that appears before object's title in a sentence. Enum of (a, an, the, "", auto).
	locale: string;
	site_name: string;
	type: string;
	// mediaClass: null,		// [[[May create later]]] Contains data related to the 'type' property. (for article, book, etc)
	
	constructor() {
		this.url = "";
		this.title = "";
		this.image = new MetaVisual();
		this.video = new MetaVisual();
		this.description = "";
		this.determiner = "";
		this.locale = "";
		this.site_name = "";
		this.type = "";
	}
}

// Tracks Image and Video MetaData for OGData
class MetaVisual {
	
	url: string;
	mimeType: string;
	width: number;
	height: number;
	alt: string;
	locked: boolean;
	
	constructor() {
		this.url = "";
		this.mimeType = "";
		this.width = 0;
		this.height = 0;
		this.alt = "";
		this.locked = false;
	}
	
	setUrl(url: string) { this.url = url; }
	setMimeType(mimeType: string) { this.mimeType = mimeType; }
	setWidth(width: number) { this.width = width; }
	setHeight(height: number) { this.height = height; }
	setAlt(alt: string) { this.alt = alt; }
	
	lock() { this.locked = true; }
	
	isSmall() {
		if(this.width && this.width < 300) { return true; }
		if(this.height && this.height < 200) { return true; }
		return false;
	}
}

export default abstract class OpenGraph {
	
	static getOGData(html: string): OGData {
		
		const ogData = new OGData();
		const document = new DOMParser().parseFromString(html, "text/html")!;
		
		// Trackers
		let scanForType = "";	// As we loop through meta tags, some are based on the last ones located (such as 'image' and 'video'), so track the 'current' set.
		
		// Loop through every meta value.
		for (let b = document.getElementsByTagName("meta"), a = 0; a < b.length; a++) {
			
			// Get the MetaTag Data
			const metaVals = b[a];
			const metaName = metaVals.getAttribute("property") ? metaVals.getAttribute("property") : metaVals.tagName;
			const metaContent = metaVals.getAttribute('content');
			
			if(!metaName || !metaContent) { continue; }
			
			// Split to detect sets:
			const s = metaName.split(":");		// Splits into 2 or 3 parts. Ex: "og:image:width" -> ['og', 'image', 'width']
			const name = s[1];
			const nameProp = s[2];
			
			// Apply Detected Content to Values
			if(name == "url") { ogData.url = metaContent; scanForType = ""; }
			if(name == "title") { ogData.title = metaContent; scanForType = ""; }
			if(name == "description") { ogData.description = metaContent; scanForType = ""; }
			if(name == "determiner") { ogData.determiner = metaContent; scanForType = ""; }
			if(name == "locale") { ogData.locale = metaContent; scanForType = ""; }
			if(name == "site_name") { ogData.site_name = metaContent; scanForType = ""; }
			
			// Special Image & Video Behaviors
			// If the visual (image or video) is locked, it cannot be changed. This happens because we've cycled to the NEXT image or video.
			if((name == "image" || name == "video")) {
				const curVisual = name == "image" ? ogData.image : ogData.video;
				
				// If this metaData type is locked, we already have the image/video we need; don't take in another.
				if(curVisual.locked) { continue; }
				
				// If there is a property attached to the name (such as image.width), then we need to consider the previous meta tag.
				if(nameProp) {
					if(nameProp == "url") { curVisual.setUrl(metaContent); }
					if(nameProp == "secure_url" && !curVisual.url) { curVisual.setUrl(metaContent); }
					if(nameProp == "type") { curVisual.setMimeType(metaContent); }
					if(nameProp == "width") { curVisual.setWidth(parseInt(metaContent + '*1', 10)); }
					if(nameProp == "height") { curVisual.setHeight(parseInt(metaContent + '*1', 10)); }
					if(nameProp == "alt") { curVisual.setAlt(metaContent); }
				} else {
					
					// Make sure we didn't switch to a new visual (image or video). If we did, lock this one so it can't change now.
					if(scanForType == name) { curVisual.lock(); }
					
					// Otherwise, assign the URL.
					else { curVisual.setUrl(metaContent); }
				}
				
				scanForType = name;	// The next tags might be properties of the same metatag type (image or video), so we have to track this.
			}
		}
		
		return ogData;
	}
}