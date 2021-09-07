import { ArticleSection } from "./ArticleSection.ts";

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
	private sections: ArticleSection[];
	
	constructor(title: string, authorId: number) {
		this.title = title;
		this.authorId = authorId;
		this.sections = [];
	}
	
	appendSection(section: ArticleSection) {
		this.sections.push(section);
	}
}
