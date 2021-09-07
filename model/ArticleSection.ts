
export interface ArticleSection {
	html: () => string,
}

enum VideoSource {
	YouTube = "YouTube",
}

// A standard block of text.
export class ArticleText implements ArticleSection {
	readonly text: string;
	
	constructor(text: string) {
		this.text = text;
	}
	
	public html() { return `<p>${this.text}</p>`; }
}

// An emphasized block of text. Generally a smaller amount of text. Used for skimming, breaking up larger parts.
export class ArticleBold implements ArticleSection {
	readonly text: string;
	
	constructor(text: string) {
		this.text = text;
	}
	
	public html() { return `<p class="bold">${this.text}</p>`; }
}

// A different-styled quote block. May be italicized.
export class ArticleQuote implements ArticleSection {
	readonly text: string;
	
	constructor(text: string) {
		this.text = text;
	}
	
	public html() { return `<div class="quote">${this.text}</div>`; }
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
}

// A simple video implemented into a view.
export class ArticleVideo implements ArticleSection {
	readonly video: string;
	readonly source: VideoSource;
	readonly text: string;
	
	constructor(video: string, source: VideoSource, text: string) {
		this.video = video;
		this.source = source;
		this.text = text;
	}
	
	public html() {
		
		// YouTube link:
		if(this.source === VideoSource.YouTube) {
			return `
			<div class="video">
				Add YouTube Link: ${this.video}
			</div>`;
		}
		
		return ``;
	}
}

// A header to split up large sections.
export class ArticleH2 implements ArticleSection {
	readonly title: string;
	
	constructor(title: string) {
		this.title = title;
	}
	
	public html() { return `<h2>${this.title}</h2>`; }
}

// A header to split up moderate sections.
export class ArticleH3 implements ArticleSection {
	readonly title: string;
	
	constructor(title: string) {
		this.title = title;
	}
	
	public html() { return `<h3>${this.title}</h3>`; }
}
