
export interface ArticleSection {
	html: () => string,					// Outputs the section into HTML.
	json: () => ArticleSectionJson		// Outputs the section into a JSON object.
	markup: () => string				// Outputs the section into a markup object.
}

export enum ArticleVideoSource {
	YouTube = "YouTube",
}

export type ArticleSectionJson = {
	type: string,
	text: string,
	url?: string,
	source?: string,
}

// A standard block of text.
export class ArticleText implements ArticleSection {
	readonly text: string;
	
	constructor(text: string) {
		this.text = text;
	}
	
	public html() { return `<p>${this.text}</p>`; }
	public json() { return { "type": "text", "text": this.text }; }
	public markup() { return `\n${this.text}`; }
}

// An emphasized block of text. Generally a smaller amount of text. Used for skimming, breaking up larger parts.
export class ArticleBold implements ArticleSection {
	readonly text: string;
	
	constructor(text: string) {
		this.text = text;
	}
	
	public html() { return `<p class="bold">${this.text}</p>`; }
	public json(): ArticleSectionJson { return { "type": "bold", "text": this.text }; }
	public markup() { return `\n**${this.text}**`; }
}

// A different-styled quote block. May be italicized.
export class ArticleQuote implements ArticleSection {
	readonly text: string;
	
	constructor(text: string) {
		this.text = text;
	}
	
	public html() { return `<div class="quote">${this.text}</div>`; }
	public json(): ArticleSectionJson { return { "type": "quote", "text": this.text }; }
	public markup() { return `\n> ${this.text}`; }
}

// A rounded image with an optional quote beneath it.
export class ArticleImage implements ArticleSection {
	readonly img: string;
	readonly text: string;
	
	constructor(img: string, text: string) {
		this.img = img;
		this.text = text;
	}
	
	public html() {
		return `
		<div class="image">
			<amp-img src="${this.img}"></amp-img>
		</div>`;
	}
	
	public json(): ArticleSectionJson { return { "type": "image", "url": this.img, "text": this.text }; }
	public markup() { return `\n![](${this.img})\n${this.text}`; }
}

// A simple video implemented into a view.
export class ArticleVideo implements ArticleSection {
	readonly video: string;
	readonly source: ArticleVideoSource;
	readonly text: string;
	
	constructor(video: string, source: ArticleVideoSource, text: string) {
		this.video = video;
		this.source = source;
		this.text = text;
	}
	
	public html() {
		
		// YouTube link:
		if(this.source === ArticleVideoSource.YouTube) {
			return `
			<div class="video">
				Add YouTube Link: ${this.video}
			</div>`;
		}
		
		return ``;
	}
	
	public json(): ArticleSectionJson { return { "type": "video", "url": this.video, "text": this.text }; }
	public markup() { return `\n`; }
}

// A header to split up massive sections. Generally unused.
export class ArticleH1 implements ArticleSection {
	readonly title: string;
	
	constructor(title: string) {
		this.title = title;
	}
	
	public html() { return `<h1>${this.title}</h1>`; }
	public json(): ArticleSectionJson { return { "type": "h1", "text": this.title }; }
	public markup() { return `\n#${this.title}`; }
}

// A header to split up large sections.
export class ArticleH2 implements ArticleSection {
	readonly title: string;
	
	constructor(title: string) {
		this.title = title;
	}
	
	public html() { return `<h2>${this.title}</h2>`; }
	public json(): ArticleSectionJson { return { "type": "h2", "text": this.title }; }
	public markup() { return `\n##${this.title}`; }
}

// A header to split up moderate sections.
export class ArticleH3 implements ArticleSection {
	readonly title: string;
	
	constructor(title: string) {
		this.title = title;
	}
	
	public html() { return `<h3>${this.title}</h3>`; }
	public json(): ArticleSectionJson { return { "type": "h3", "text": this.title }; }
	public markup() { return `\n###${this.title}`; }
}

// A header to split up small sections.
export class ArticleH4 implements ArticleSection {
	readonly title: string;
	
	constructor(title: string) {
		this.title = title;
	}
	
	public html() { return `<h4>${this.title}</h4>`; }
	public json(): ArticleSectionJson { return { "type": "h4", "text": this.title }; }
	public markup() { return `\n####${this.title}`; }
}
