import Conn from "../core/Conn.ts";
import Mapp from "../core/Mapp.ts";
import Validate from "../core/Validate.ts";
import Web from "../core/Web.ts";
import { AwardList, ForumPostStatus } from "./ForumPost.ts";

/*


	// READ THIS FIRST
	// READ THIS FIRST
	// READ THIS FIRST
	
	
	
	
	Articles should be posted on a SquareSpace Blog.
	
		- This distributes load. Not a part of our direct burden.
		
		- SquareSpace already has the tools in place.
		
			- Simple collaboration, no need for any manual work on our part.
			
			- Content system is exceptional.
			
			- They'll handle all of the image burdens, etc.
			
			- Easy to set up.
			
			- Includes easy SEO, marketing, emails, etc.
			
		
		
		- In other words, let's NOT build this class out, and just use what's already in place.







*/



export class Article {
	
	// Fixed Content
	private category: string;			// Article Category, such as "tech". Is part of the slug, e.g. /article/tech/our-article-slug
	private slug: string;				// Our internal URL / path / slug.
	
	private title: string;
	private image: string;				// Image Slug URL (our internal slug)
	private authorId: number;
	
	// CONTENT:
	// Content blocks stored separately, then get added to article parent.
	
	// Tracked Values
	private status: ForumPostStatus;	// Post Status: Deleted, Denied, Hidden, Approval, Visible, Featured, Stickied, Announced
	private views = 0;					// Views (Impressions) this post has had.
	private clicks = 0;					// Clicks on this post.
	private comments = 0;				// Number of comments on this post.
	private timePosted = 0;				// Timestamp of when the post was created.
	private timeEdited = 0;				// Timestamp of the last edit, if applicable.
	
	// List of awards given to this post.
	private awards: AwardList = {
		druid: 0,
		tree: 0,
		plant: 0,
		seed: 0,
	};
	
	constructor(
		category: string,
		title: string,
		image: string,
		authorId: number,
		status: ForumPostStatus,
		slug: string = "",
	) {
		this.category = category;
		this.title = title;
		this.image = image;
		this.authorId = authorId;
		this.status = status;
		this.slug = !slug ? Web.getSlugFromTitle(this.title) : slug;		// Automatically Generate the URL from the Title
	}
	
	public static buildPost(
		conn: Conn,
		category: string,
		title: string,
		image: string,
		authorId: number,
		status: ForumPostStatus,
		slug = "",
	): Article | false {
		
		// Verify certain values exist:
		if(typeof title !== "string" || !title) { return conn.error("Must include a `title` entry."); }
		if(typeof image !== "string" || !image) { return conn.error("Must include an `image` entry."); }
		
		// Size Limits
		if(title.length < 3) { return conn.error("`title` is too short."); }
		if(title.length > 128) { return conn.error("`title` is too long."); }
		
		// Quick pass for alphanumeric values:
		if(!category.match(/^[a-z0-9]+$/i)) { return conn.error("`category` is not valid."); }
		
		// Status Requirements
		if(status < ForumPostStatus.Automatic) { return conn.error("`status` cannot begin in a denied state."); }
		
		// TODO: Make conditional based on user permissions (e.g. mods and admins can expand beyond 
		if(status > ForumPostStatus.Visible) { return conn.error("`status` cannot start above visible state."); }
		
		// Image Requirements
		if(!image.match(/^[\w\W]+(\.)+(jpg|jpeg|png|webp)$/i)) {
			return conn.error("Invalid `image` mime-type used.");
		}
		
		// If we're retrieving a full image URL, we'll need to run this:
		// try {
		// 	new URL(image);
		// } catch {
		// 	return conn.error("Invalid `image` url.");
		// }
		
		// TODO: Make sure the author exists.
		
		// TODO: Verify user permissions.
		
		// TODO: Determine status (such as if the user can make it featured)
		
		// Make sure we're not overwriting an existing URL.
		if(Mapp.redis.hget("article:" + category + ":" + slug, "slug")) {
			
			// TODO: 
			// If we are overwriting an existing URL, we need to modify it a bit.
		}
		
		return new Article(category, title, image, authorId, status, slug);
	}
	
	public applyNewPost(status = ForumPostStatus.Automatic) {
		this.applyTrackedValues(status, Math.floor(Date.now() / 1000));
	}
	
	public applyTrackedValues(status = ForumPostStatus.Automatic, timePosted = 0, timeEdited = 0, views = 0, clicks = 0, comments = 0) {
		this.status = status;
		this.timePosted = timePosted;
		this.timeEdited = timeEdited;
		this.views = views;
		this.clicks = clicks;
		this.comments = comments;
	}
	
	public applyAwards(druid = 0, tree = 0, plant = 0, seed = 0) {
		this.awards.druid = druid;
		this.awards.tree = tree;
		this.awards.plant = plant;
		this.awards.seed = seed;
	}
	
	// Apply an Edit
	public applyEdit(authorId: number): boolean {
		
		// Restrict edits to the original author.
		if(authorId != this.authorId) {
			return false;
		}
		
		this.timeEdited = Math.floor(Date.now() / 1000);
		return true;
	}
	
	public static async loadFromSlug(conn: Conn, category: string, slug: string): Promise<Article | false> {
		const raw = await Mapp.redis.hmget("article:" + category + ":" + slug,
		
			// Fixed Content
			"category",			// 0
			"title",			// 1
			"image",			// 2
			"authorId",			// 3
			"slug",				// 4
			
			// Tracked Values
			"status",			// 
			"timePosted",		// 
			"timeEdited",		// 
			"views",			// 
			"clicks",			// 
			"comments",			// 
			
			// Awards
			"awards.druid",
			"awards.tree",
			"awards.plant",
			"awards.seed",
		);
		
		if(typeof raw[1] !== "string") { return conn.error("Entry loaded is invalid."); }
		
		const article = Article.buildPost(
			conn,
			raw[0] as string,
			raw[1] as string,
			raw[2] as string,
			Number(raw[3] as string),
			Number(raw[5] as string),
			slug
		);
		
		if(!article) { return false; }
		
		article.applyTrackedValues(
			Number(raw[5] as string),
			Number(raw[6] as string),
			Number(raw[7] as string),
			Number(raw[8] as string),
			Number(raw[9] as string),
			Number(raw[10] as string)
		);
		
		article.applyAwards(Number(raw[13] as string), Number(raw[14] as string), Number(raw[15] as string), Number(raw[16] as string));
		
		return article;
	}
	
	public saveToRedis() {
		Mapp.redis.hmset("article:" + this.category + ":" + this.slug,
			
			// Fixed Content
			["category", this.category],
			["title", this.title],
			["image", this.image],
			["authorId", this.authorId],
			["timePosted", this.timePosted],
			["slug", this.slug],
			
			// Tracked Values
			["status", this.status],
			["timePosted", this.timePosted],
			["timeEdited", this.timeEdited],
			["views", this.views],
			["clicks", this.clicks],
			["comments", this.comments],
			
			// Awards
			["awards.druid", this.awards.druid],
			["awards.tree", this.awards.tree],
			["awards.plant", this.awards.plant],
			["awards.seed", this.awards.seed],
		);
	}
	
	// Validate Article Data
	public sanitizeData() {
		this.title = Validate.safeText(this.title);
	}
	
	// GET API
	public static get(forum: string, slug: string) {
		// Mapp.redis.hgetall("article:" + forum + ":" + slug);
	}
}

