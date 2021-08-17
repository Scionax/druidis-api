import Conn from "../core/Conn.ts";
import Mapp from "../core/Mapp.ts";
import Validate from "../core/Validate.ts";
import Web from "../core/Web.ts";

export class AwardList {
	public druid = 0;		// $5.00 for a Druid Award
	public tree = 0;		// $1.00 for a Tree Award
	public plant = 0;		// $0.25 for a Plant Award
	public seed = 0;		// $0.05 for a Seed Award
}

export const enum ForumPostStatus {
	Deleted = 0,		// Deleted Post
	Denied = 1,			// Post was denied Moderator Approval.
	Hidden = 2,			// Hidden Post
	Automatic = 3,		// Posting the status automatically, system can decide what to do.
	Approval = 4,		// Post is waiting for Moderator Approval.
	Visible = 5,		// Standard Visibility
	Featured = 6,		// Featured Post; may get boosted visibility
	Stickied = 8,		// Sticky Post
	Announced = 9,		// Announcement Post that goes above Stickies
}

export class ForumPost {
	
	// Fixed Content
	private forum: string;
	private category: string;
	private title: string;
	
	private image: string;				// Image Slug URL (our internal slug)
	private url: string;				// Link to the Source URL (External Site)
	private slug: string;				// Our internal URL / path / slug.
	private authorId: number;
	
	private content: string;			// Text content for the post.
	
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
		forum: string,
		category: string,
		title: string,
		image: string,
		url: string,
		authorId: number,
		status: ForumPostStatus,
		content: string = "",
		slug: string = "",
	) {
		this.forum = forum;
		this.category = category;
		this.title = title;
		this.image = image;
		this.url = url;
		this.authorId = authorId;
		this.status = status;
		this.content = content;
		this.slug = !slug ? Web.getSlugFromTitle(this.title) : slug;		// Automatically Generate the URL from the Title
	}
	
	public static buildPost(
		conn: Conn,
		forum: string,
		category: string,
		title: string,
		image: string,
		url: string,
		authorId: number,
		status: ForumPostStatus,
		content = "",
		slug = "",
	): ForumPost | false {
		
		// Verify certain values exist:
		if(typeof forum !== "string" || !forum) { return conn.error("Must include a `forum` entry."); }
		if(typeof title !== "string" || !title) { return conn.error("Must include a `title` entry."); }
		if(typeof url !== "string" || !url) { return conn.error("Must include a `url` entry."); }
		if(typeof image !== "string" || !image) { return conn.error("Must include an `image` entry."); }
		
		// Size Limits
		if(title.length < 3) { return conn.error("`title` is too short."); }
		if(title.length > 128) { return conn.error("`title` is too long."); }
		if(content && content.length > 2048) { return conn.error("`content` is too long."); }
		
		// Quick pass for alphanumeric values:
		if(!forum.match(/^[a-z0-9]+$/i)) { return conn.error("`forum` is not valid."); }
		if(category && !category.match(/^[a-z0-9 ]+$/i)) { return conn.error("`category` is not valid."); }
		
		// Confirm that forum is valid:
		if(!Mapp.forums[forum]) { return conn.error("`forum` does not exist."); }
		if(category && !Mapp.forums[forum].hasCategory(category) ) { return conn.error("`category` is not valid."); }
		
		// Status Requirements
		if(status < ForumPostStatus.Automatic) { return conn.error("`status` cannot begin in a denied state."); }
		
		// TODO: Make conditional based on user permissions (e.g. mods and admins can expand beyond 
		if(status > ForumPostStatus.Visible) { return conn.error("`status` cannot start above visible state."); }
		
		// URL Requirements
		if(url) {
			try {
				new URL(url);
			} catch {
				return conn.error("Invalid `url` entry.");
			}
		}
		
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
		if(Mapp.redis.hget("post:" + forum + ":" + slug, "slug")) {
			
			// TODO: 
			// If we are overwriting an existing URL, we need to modify it a bit.
		}
		
		return new ForumPost(forum, category, title, image, url, authorId, status, content, slug);
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
	
	public static async loadFromSlug(conn: Conn, forum: string, slug: string): Promise<ForumPost | false> {
		const p = await Mapp.redis.hmget("post:" + forum + ":" + slug,
		
			// Fixed Content
			"category",			// 0
			"title",			// 1
			"image",			// 2
			"url",				// 3
			"authorId",			// 4
			"content",			// 5
			"slug",				// 6
			
			// Tracked Values
			"status",			// 7
			"timePosted",		// 8
			"timeEdited",		// 9
			"views",			// 10
			"clicks",			// 11
			"comments",			// 12
			
			// Awards
			"awards.druid",
			"awards.tree",
			"awards.plant",
			"awards.seed",
		);
		
		if(typeof p[1] !== "string") { return conn.error("Entry loaded is invalid."); }
		
		const post = ForumPost.buildPost(
			conn,
			forum,
			p[0] as string,
			p[1] as string,
			p[2] as string,
			p[3] as string,
			Number(p[4] as string),
			Number(p[7] as string),
			p[5] as string,
			slug
		);
		
		if(!post) { return false; }
		
		post.applyTrackedValues(
			Number(p[7] as string),
			Number(p[8] as string),
			Number(p[9] as string),
			Number(p[10] as string),
			Number(p[11] as string),
			Number(p[12] as string)
		);
		
		post.applyAwards(Number(p[13] as string), Number(p[14] as string), Number(p[15] as string), Number(p[16] as string));
		
		return post;
	}
	
	public saveToRedis() {
		Mapp.redis.hmset("post:" + this.forum + ":" + this.slug,
			
			// Fixed Content
			["category", this.category],
			["title", this.title],
			["image", this.image],
			["url", this.url],
			["authorId", this.authorId],
			["content", this.content],
			["timePosted", this.timePosted],
			["slug", this.slug],
			
			// ----- Commonly Updated Values ----- //
			["status", this.status],
			
			// Awards
			["awards.druid", this.awards.druid],
			["awards.tree", this.awards.tree],
			["awards.plant", this.awards.plant],
			["awards.seed", this.awards.seed],
			
			// Tracked Values
			["timeEdited", this.timeEdited],
			["views", this.views],
			["clicks", this.clicks],
			["comments", this.comments],
		);
	}
	
	// Validate Post Data
	public sanitizePostData() {
		this.title = Validate.safeText(this.title);
		this.content = Validate.safeText(this.content);
	}
	
	// GET API
	public static get(forum: string, slug: string) {
		// Mapp.redis.hgetall("post:" + forum + ":" + slug);
	}
}

