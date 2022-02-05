import Data from "../core/Data.ts";
import FileSys from "../core/FileSys.ts";
import ObjectStorage from "../core/ObjectStorage.ts";
import Web from "../core/Web.ts";
import { ensureDir, log } from "../deps.ts";
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
	
	readonly forum: string;					// A forum that the article is most closely associated with.
	readonly title: string;
	readonly authorId: number;
	readonly slug: string;					// A URL slug based on the title, e.g. "my-super-cool-article"
	readonly initUTC: string;				// UTC of when the article was initialized (not same as date posted).
	
	public sections: ArticleSection[];
	
	constructor(forum: string, title: string, authorId: number, utc = "") {
		this.forum = forum;
		this.title = title;
		this.authorId = authorId;
		this.sections = [];
		this.slug = Web.getSlugFromTitle(this.title);
		
		// Prepare Initialization Date
		if(utc) {
			this.initUTC = utc;
		} else {
			const date = new Date();
			this.initUTC = date.toUTCString();
		}
	}
	
	// Creates an Article Instance from a file.
	static async createFromPath(path: string): Promise<Article|false> {
		if(!(await FileSys.exists(path))) { return false; }
		
		const content = await Deno.readTextFile(path);
		const json = JSON.parse(content);
		
		if(!json.forum || !json.title) { return false; }
		
		const article = new Article(json.forum, json.title, json.authorId || 0, json.initDate || "");
		
		// Loop through each section, retrieve it's 'ArticleSection' class, and append it to the article.
		for(let i = 0; i < json.sections.length; i++) {
			const section = Article.buildSectionFromJson(json.sections[i]);
			article.appendSection(section);
		}
		
		return article;
	}
	
	static getArticleList(forum: string, initYear = 0) {
		return Data.getFilesRecursive(`data/articles/${forum}` + (initYear ? `/${initYear}` : ""));
	}
	
	appendSection(section: ArticleSection) {
		this.sections.push(section);
	}
	
	async save(): Promise<boolean> {
		
		const date = new Date(this.initUTC);
		const initYear = date.getFullYear();
		
		const dir = `data/articles/${this.forum}/${initYear}`;
		const fullPath = `${dir}/${this.slug}.json`;
		
		// Make sure the directory exists.
		await ensureDir(`data/articles/${this.forum}`);
		
		try {
			await Deno.writeTextFile(fullPath, JSON.stringify(this.json()));
		} catch {
			log.error(`Article.save() unable to write to: ${fullPath}`);
			return false;
		}
		
		return true;
	}
	
	publish() {
		ObjectStorage.save("articles/", `${this.slug}.html`, this.html(), "text/html");
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
		
		const json: {
			forum: string,
			title: string,
			authorId: number,
			slug: string,
			initUTC: string,
			sections: ArticleSectionJson[],
		} = {
			forum: this.forum,
			title: this.title,
			authorId: this.authorId,
			slug: this.slug,
			initUTC: this.initUTC,
			sections: [],
		};
		
		// Loop through each section and attach the corresponding JSON.
		for(let i = 0; i < this.sections.length; i++) {
			json.sections.push(this.sections[i].json());
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
