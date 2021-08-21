import Conn from "../core/Conn.ts";
import Crypto from "../core/Crypto.ts";
import Mapp from "../core/Mapp.ts";
import Validate from "../core/Validate.ts";
import { ensureDir } from "../deps.ts";

// Forum Posts Types / Tables
export const enum ForumPostTable {
	Standard = "post",				// post:Forum:id				// A standard post. Added to the pagination set.
	Queued = "queued",				// queued:Forum:id				// Post is awaiting moderator approval. Delete entirely if rejected.
	Featured = "featured",			// featured:Forum:id			// A featured post. Might be historical content, interesting content to cycle in, etc.
	Sponsored = "sponsored",		// sponsored:Forum:id			// A sponsored post. Fit into the regular posts where appropriate.
}

export const enum ForumPostStatus {
	Hidden = 0,			// Hidden Post (was approved and entered into "Visible" at one point; closest we have to deleted)
	Visible = 1,		// Standard Visibility
	Featured = 4,		// Featured Post; may get boosted visibility
	Sticky = 7,			// Sticky Post.
	Announced = 9,		// Announcement Post. Stickied at the top.
}

export class AwardList {
	public druid = 0;		// $5.00 for a Druid Award
	public tree = 0;		// $1.00 for a Tree Award
	public plant = 0;		// $0.25 for a Plant Award
	public seed = 0;		// $0.05 for a Seed Award
}

export class ForumPost {
	
	// Fixed Content
	private forum: string;
	private id: number;					// Tracks the ID of the post within its parent forum.
	private category: string;
	private title: string;
	private url: string;				// Link to the Source URL (External Site)
	private authorId: number;
	private hash: string;				// Hash (for image and object storage)
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
		id: number,
		category: string,
		title: string,
		url: string,
		authorId: number,
		status: ForumPostStatus,
		content: string = "",
	) {
		this.forum = forum;
		this.id = id;
		this.category = category;
		this.title = title;
		this.url = url;
		this.authorId = authorId;
		this.status = status;
		this.content = content;
		this.hash = Crypto.simpleHash(this.forum + this.id + this.authorId + this.id + this.category);
	}
	
	public static async buildPost(
		conn: Conn,
		forum: string,
		id: number,					// Set to 0 if you're creating a new post.
		category: string,
		title: string,
		url: string,
		authorId: number,
		status: ForumPostStatus,
		content = "",
	): Promise<ForumPost | false> {
		
		// Verify certain values exist:
		if(typeof id !== "number") { return conn.error("Invalid `id` entry."); }
		if(typeof forum !== "string" || !forum) { return conn.error("Must include a `forum` entry."); }
		if(typeof title !== "string" || !title) { return conn.error("Must include a `title` entry."); }
		if(typeof url !== "string" || !url) { return conn.error("Must include a `url` entry."); }
		
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
		
		// TODO: Make sure the author exists.
		
		// TODO: Verify user permissions.
		
		// TODO: Determine status (such as if the user can make it featured)
		
		// Determine Next Available ID
		if(id === 0) {
			id = await Mapp.redis.incr(`post:nextId:${forum}`);
			
			// Make sure this id isn't already taken:
			if(await ForumPost.checkIfPostExists(forum, id)) {
				return conn.error(`Error creating ID ${id}. Please contact the administrator, this is a problem.`);
			}
		}
		
		return new ForumPost(forum, id, category, title, url, authorId, status, content);
	}
	
	public applyNewPost(status = ForumPostStatus.Visible) {
		this.applyTrackedValues(status, Math.floor(Date.now() / 1000));
	}
	
	public applyTrackedValues(status = ForumPostStatus.Visible, timePosted = 0, timeEdited = 0, views = 0, clicks = 0, comments = 0) {
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
	
	// Image Functions
	public getImageDir() {
		const idPage = Math.ceil(this.id/1000);
		const dir = `images/${this.forum}/${idPage}`;
		ensureDir(`${Deno.cwd()}/${dir}`);
		return dir;
	}
	
	public getImagePath() {
		return `post-${this.id}-${this.hash}.webp`;
	}
	
	public static async checkIfPostExists(forum: string, id: number): Promise<boolean> {
		return (await Mapp.redis.exists(`post:${forum}:${id}`)) === 0 ? false : true;
	}
	
	public static async loadFromId(conn: Conn, forum: string, id: number, table: ForumPostTable): Promise<ForumPost | false> {
		const raw = await Mapp.redis.hmget(`${table}:${forum}:${id}`,
		
			// Fixed Content
			"forum",			// 0
			"id",				// 1
			"category",			// 2
			"title",			// 3
			"url",				// 4
			"authorId",			// 5
			"hash",				// 6
			"content",			// 7
			
			// Tracked Values
			"status",			// 8
			"timePosted",		// 9
			"timeEdited",		// 10
			"views",			// 11
			"clicks",			// 12
			"comments",			// 13
			
			// Awards
			"awards.druid",
			"awards.tree",
			"awards.plant",
			"awards.seed",
		);
		
		if(typeof raw[1] !== "string") { return conn.error("Entry loaded is invalid."); }
		
		const post = await ForumPost.buildPost(
			conn,
			forum,								// forum
			Number(raw[1] as string),			// id
			raw[2] as string,					// category
			raw[3] as string,					// title
			raw[4] as string,					// url
			Number(raw[5] as string),			// authorId
												// hash (no need to send)
			Number(raw[8] as string),			// status (required for verification)
			raw[7] as string,					// content
		);
		
		if(!post) { return false; }
		
		post.applyTrackedValues(
			Number(raw[8] as string),			// status
			Number(raw[9] as string),			// timePosted
			Number(raw[10] as string),			// timeEdited
			Number(raw[11] as string),			// views
			Number(raw[12] as string),			// clicks
			Number(raw[13] as string)			// comments
		);
		
		post.applyAwards(Number(raw[13] as string), Number(raw[14] as string), Number(raw[15] as string), Number(raw[16] as string));
		
		return post;
	}
	
	public saveToRedis(table: ForumPostTable) {
		
		// TODO: hmset is deprecated, but hset (the supposed alternative) is not functioning. Wait until fixed.
		return Mapp.redis.hmset(`${table}:${this.forum}:${this.id}`,
			
			// Fixed Content
			["forum", this.forum],
			["id", this.id],
			["category", this.category],
			["title", this.title],
			["url", this.url],
			["authorId", this.authorId],
			["hash", this.hash],
			["content", this.content],
			
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
	
	// Validate Post Data
	public sanitizePostData() {
		this.title = Validate.safeText(this.title);
		this.content = Validate.safeText(this.content);
	}
}
