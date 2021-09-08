import ObjectStorage from "../core/ObjectStorage.ts";
import Web from "../core/Web.ts";
import { ArticleSectionJson, ArticleSection, ArticleText, ArticleBold, ArticleQuote, ArticleVideo, ArticleVideoSource, ArticleImage, ArticleH2, ArticleH3 } from "./ArticleSection.ts";

/*
	Articles consist of a few main details (title, author, etc), and then an array of ArticleSections (See ArticleSection Class).
	Each ArticleSection is themed with consistent CSS.
	
	Article Sections:
		- Text				// A standard block of text.
		- Bold				// An emphasized block of text. Generally a smaller amount of text. Used for skimming, breaking up larger parts.
		- Quote				// A different-styled quote block. May be italicized.
		- Image				// A rounded image with an optional quote beneath it.
		- Video				// A simple video implemented into a view.
		- H2				// A header to split up large sections.
		- H3				// A header to split up moderate sections.
*/

export class Article {
	
	readonly title: string;
	readonly authorId: number;
	private slug: string;					// A URL slug based on the title, e.g. "my-super-cool-article"
	private sections: ArticleSection[];
	
	constructor(title: string, authorId: number) {
		this.title = title;
		this.authorId = authorId;
		this.sections = [];
		this.slug = Web.getSlugFromTitle(this.title);
	}
	
	appendSection(section: ArticleSection) {
		this.sections.push(section);
	}
	
	save() {
		ObjectStorage.putObject("druidis-cdn", `articles/${this.slug}.html`, this.html(), "text/html")
		ObjectStorage.putObject("druidis-cdn", `data/articles/${this.slug}.json`, this.html(), "application/json")
	}
	
	// Output the article as HTML.
	html() {
		let html = "";
		
		// Loop through each section and output the corresponding HTML.
		for(let i = 0; i < this.sections.length; i++) {
			html += `
			${this.sections[i].html()}`;
		}
		
		return html;
	}
	
	// Output the article as JSON.
	json() {
		const json: ArticleSectionJson[] = [];
		
		// Loop through each section and attach the corresponding JSON.
		for(let i = 0; i < this.sections.length; i++) {
			json.push(this.sections[i].json());
		}
		
		return json;
	}
	
	static buildSectionFromJson(json: ArticleSectionJson) {
		
		switch(json.type) {
			case "text": return new ArticleText(json.text);
			case "bold": return new ArticleBold(json.text);
			case "quote": return new ArticleQuote(json.text);
			case "image": return new ArticleImage(json.url as string, json.text);
			case "video": return new ArticleVideo(json.url as string, json.source as ArticleVideoSource, json.text);
			case "h2": return new ArticleH2(json.text);
			case "h3": return new ArticleH3(json.text);
		}
		
		// If the previous sections failed to build, just provide a default text block.
		return new ArticleText(json.text);
	}
}
