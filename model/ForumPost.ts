import Crypto from "../core/Crypto.ts";
import Mapp from "../core/Mapp.ts";
import RedisDB from "../core/RedisDB.ts";
import Validate from "../core/Validate.ts";
import { ensureDir } from "../deps.ts";

// Forum Posts Types / Tables
export const enum PostTable {
	Standard = "post",				// post:Forum:id				// A standard post. Added to the pagination set.
	Queued = "queued",				// queued:Forum:id				// Post is awaiting moderator approval. Delete entirely if rejected.
	Sponsored = "sponsored",		// sponsored:Forum:id			// A sponsored post. Fit into the regular posts where appropriate.
}

export const enum PostStatus {
	Hidden = 0,			// Hidden Post (was approved and entered into "Visible" at one point; closest we have to deleted)
	Visible = 1,		// Standard Visibility
	Sponsored = 3,		// Sponsored Post.
	Featured = 7,		// Featured Post; may get boosted visibility
	Sticky = 8,			// Sticky Post.
	Announced = 9,		// Announcement Post. Stickied at the top.
}

export class AwardList {
	public award1 = 0;		// $0.05 for a Award #1 (Seed?)
	public award2 = 0;		// $0.25 for a Award #2 (Plant?)
	public award3 = 0;		// $1.00 for a Award #3 (Tree?)
	public award4 = 0;		// $5.00 for a Award #4 (Druid?)
}

export class ForumPost {
	
	// Fixed Content
	private forum: string;
	private id: number;					// Tracks the ID of the post within its parent forum.
	private category: string;			// An optional sub-category designation within the forum.
	private url: string;				// Link to the Source URL (External Site)
	private authorId: number;
	private title: string;				// Title of the post.
	private content: string;			// Text content for the post.
	private img: string;				// Image Path for Object Storage, e.g. img-ID-HASH.webp
	private video: string;				// Video Path (URL or object storage).
	private w: number;					// The width of the media object (image or video).
	private h: number;					// The height of the media object (image or video).
	
	// Tracked Values
	private status: PostStatus;			// Post Status: Deleted, Denied, Hidden, Approval, Visible, Featured, Stickied, Announced
	private views = 0;					// Views (Impressions) this post has had.
	private clicks = 0;					// Clicks on this post.
	private comments = 0;				// Number of comments on this post.
	private timePosted = 0;				// Timestamp of when the post was created.
	private timeEdited = 0;				// Timestamp of the last edit, if applicable.
	
	// List of awards given to this post.
	private awards: AwardList = {
		award1: 0,
		award2: 0,
		award3: 0,
		award4: 0,
	};
	
	constructor(
		forum: string,
		id: number,
		category: string,
		url: string,
		authorId: number,
		title: string,
		content: string,
		img: string,
		video: string,
		w: number,
		h: number,
		status: PostStatus,
	) {
		this.forum = forum;
		this.id = id;
		this.category = category;
		this.url = url;
		this.authorId = authorId;
		this.title = title;
		this.content = content;
		this.img = img;
		this.video = video;
		this.w = w;
		this.h = h;
		this.status = status;
	}
	
	public static validatePostData(
		forum: string,
		category: string,
		url: string,
		authorId: number,
		title: string,
		content: string,
		status: PostStatus,
		hasMedia = false,		// Indicates that other media is being used (such as image or video)
	) {
		
		// Verify certain values exist:
		if(typeof forum !== "string" || !forum) { return "Must include a `forum` entry." }
		if(typeof url !== "string" || !url) { return "Must include a `url` entry." }
		
		// Validate authorId is not invalid.
		if(authorId < 0) { return "Invalid `authorId` entry."}
		
		// Must have one or more of the following: (1) Media, (2) Title, (3) Content, or (4) Comment
		if(hasMedia === false && title.length > 0 && content.length === 0) {
			return "Must provide content for this post.";
		}
		
		// Validate Title (if present)
		if(title.length > 0) {
			if(title.length < 3) { return "`title` is too short."; }
			if(title.length > 128) { return "`title` is too long."; }
		}
		
		// Validate Content (if present)
		if(content.length > 256) { return "`content` is too long." }
		
		// Quick pass for alphanumeric values:
		if(!forum.match(/^[a-z0-9]+$/i)) { return "`forum` is not valid." }
		if(category && !category.match(/^[a-z0-9 ]+$/i)) { return "`category` is not valid." }
		
		// Confirm that forum is valid:
		if(!Mapp.forums[forum]) { return "`forum` does not exist." }
		if(category && !Mapp.forums[forum].hasCategory(category) ) { return "`category` is not valid." }
		
		// URL Requirements
		if(url) {
			try {
				new URL(url);
			} catch {
				return "Invalid `url` entry.";
			}
		}
		
		// TODO: Make sure the author exists.
		
		// TODO: Verify user permissions.
		
		// TODO: Affect status based on permissions.
		if(status > PostStatus.Visible) { return "`status` cannot start above visible state." }
		
		return "";
	}
	
	// Create a comment that only has comments, no media.
	public static async buildCommentPost(
		forum: string,
		category: string,
		url: string,
		authorId: number,
		title: string,
		content: string,
		status: PostStatus,
	): Promise<ForumPost | string> {
		
		// Validate Generic Post Data
		const msg = ForumPost.validatePostData(forum, category, url, authorId, title, content, status);
		if(msg.length > 0) { return msg; }
		
		// Assign a new ID and make sure a post isn't already using it.
		const id = await RedisDB.nextForumPostId(forum);
		if(await ForumPost.checkIfPostExists(forum, id)) {
			return `Error creating ID ${id} in forum ${forum}. Please contact the administrator, this is a problem.`;
		}
		
		return new ForumPost(forum, id, category, url, authorId, title, content, "", "", 0, 0, status);
	}
	
	public static async buildMediaPost(
		forum: string,
		category: string,
		url: string,
		authorId: number,
		title: string,
		content: string,
		w: number,
		h: number,
		status: PostStatus,
		isVideo = false,
	): Promise<ForumPost | string> {
		
		// Validate Generic Post Data
		const msg = ForumPost.validatePostData(forum, category, url, authorId, title, content, status, true);
		if(msg.length > 0) { return msg; }
		
		// Validate Width & Height
		if(w < 64) {  return "Posting an image with too small of a width." }
		if(h < 32) {  return "Posting an image with too small of a height." }
		
		// Assign a new ID and make sure a post isn't already using it.
		const id = await RedisDB.nextForumPostId(forum);
		
		if(await ForumPost.checkIfPostExists(forum, id)) {
			return `Error creating ID ${id} in forum ${forum}. Please contact the administrator, this is a problem.`;
		}
		
		// Prepare Video
		if(isVideo) {
			// TODO: Add Video Media Option
		}
		
		// Prepare Image
		const hash = Crypto.simpleHash(forum + id + authorId + id + category);
		const img = `img-${id}-${hash}.webp`;
		
		return new ForumPost(forum, id, category, url, authorId, title, content, img, "", w, h, status);
	}
	
	public applyNewPost(status = PostStatus.Visible) {
		this.applyTrackedValues(status, Math.floor(Date.now() / 1000));
	}
	
	public applyTrackedValues(status = PostStatus.Visible, timePosted = 0, timeEdited = 0, views = 0, clicks = 0, comments = 0) {
		this.status = status;
		this.timePosted = timePosted;
		this.timeEdited = timeEdited;
		this.views = views;
		this.clicks = clicks;
		this.comments = comments;
	}
	
	public applyAwards(award1 = 0, award2 = 0, award3 = 0, award4 = 0) {
		this.awards.award1 = award1;
		this.awards.award2 = award2;
		this.awards.award3 = award3;
		this.awards.award4 = award4;
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
		const imgPage = Math.ceil(this.id/1000);
		const dir = `${this.forum}/${imgPage}`;
		ensureDir(`images/${dir}`);
		return dir;
	}
	
	public getImagePathName() { return this.img; }
	
	public setImage(path = "", w = 0, h = 0) {
		if(path.length > 0) { this.img = path; }
		if(w > 0) { this.w = w; }
		if(h > 0) { this.h = h; }
	}
	
	public static async checkIfPostExists(forum: string, id: number): Promise<boolean> {
		return (await Mapp.redis.exists(`post:${forum}:${id}`)) === 0 ? false : true;
	}
	
	public static async loadFromId(forum: string, id: number, table: PostTable): Promise<ForumPost|false> {
		const raw = await Mapp.redis.hmget(`${table}:${forum}:${id}`,
			
			// Fixed Content
			"forum",			// 0
			"id",				// 1
			"category",			// 2
			"url",				// 3
			"authorId",			// 4
			"title",			// 5
			"content",			// 6
			"img",				// 7
			"video",			// 8
			"w",				// 9
			"h",				// 10
			
			// Tracked Values
			"status",			// 11
			"timePosted",		// 12
			"timeEdited",		// 13
			"views",			// 14
			"clicks",			// 15
			"comments",			// 16
			
			// Awards
			"award1",
			"award2",
			"award3",
			"award4",
		);
		
		const post = new ForumPost(
			forum,								// forum
			Number(raw[1] as string),			// id
			raw[2] as string,					// category
			raw[3] as string,					// url
			Number(raw[4] as string),			// authorId
			raw[5] as string,					// title
			raw[6] as string,					// content
			raw[7] as string,					// img
			raw[8] as string,					// video
			Number(raw[9] as string),			// w
			Number(raw[10] as string),			// h
			Number(raw[11] as string),			// status (required for verification)
		);
		
		if(!post) { return false; }
		
		post.applyTrackedValues(
			Number(raw[11] as string),			// status
			Number(raw[12] as string),			// timePosted
			Number(raw[13] as string),			// timeEdited
			Number(raw[14] as string),			// views
			Number(raw[15] as string),			// clicks
			Number(raw[16] as string)			// comments
		);
		
		post.applyAwards(Number(raw[17] as string), Number(raw[18] as string), Number(raw[19] as string), Number(raw[20] as string));
		
		return post;
	}
	
	public saveToRedis(table: PostTable) {
		
		// TODO: Add TX Multi / Exec (Transaction) support.
			// See https://github.com/denodrivers/redis for full details
		// TODO: Only add indexes if the transaction succeeds.
		
		// TODO: hmset is deprecated, but hset (the designated alternative) won't function locally (probably due to Windows Redis)
		Mapp.redis.hmset(`${table}:${this.forum}:${this.id}`,
			
			// Fixed Content
			["forum", this.forum],
			["id", this.id],
			["category", this.category],
			["url", this.url],
			["authorId", this.authorId],
			["title", this.title],
			["content", this.content],
			["img", this.img],
			["video", this.video],
			["w", this.w],
			["h", this.h],
			
			// Tracked Values
			["status", this.status],
			["timePosted", this.timePosted],
			["timeEdited", this.timeEdited],
			["views", this.views],
			["clicks", this.clicks],
			["comments", this.comments],
			
			// Awards
			["award1", this.awards.award1],
			["award2", this.awards.award2],
			["award3", this.awards.award3],
			["award4", this.awards.award4],
		);
		
		// Add Appropriate Indexes
		RedisDB.addToIndex_Post_Forum(this.forum, this.id);
		if(this.category.length > 0) { RedisDB.addToIndex_Post_Forum_Category(this.forum, this.id, this.category); }
		RedisDB.addToIndex_Post_Primary(this.forum, this.id);
		
		return true;
	}
	
	// Validate Post Data
	public sanitizePostData() {
		this.content = Validate.safeText(this.content);
	}
}
