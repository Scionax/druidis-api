import { config } from "../config.ts";
import Crypto from "../core/Crypto.ts";
import RedisDB from "../core/RedisDB.ts";
import Validate from "../core/Validate.ts";
import { ensureDir } from "../deps.ts";
import { Forum } from "./Forum.ts";
import { User } from "./User.ts";

export const enum TableType {
	Home = "home",
	Post = "post",				// post:{forum}:{id}				// Standard Post. Added to the pagination set.
	Queue = "queue",			// queue:{forum}:{id}				// Queued Post. Awaiting moderator approval. Delete entirely if rejected.
	Sponsor = "sponsor",		// sponsor:{forum}:{id}				// Sponsored Post. Fit into the regular posts where appropriate.
}

export const enum PostStatus {
	Hidden = 0,			// Hidden Post (was approved and entered into "Visible" at one point; closest we have to deleted)
	Visible = 1,		// Standard Visibility
	Sponsored = 3,		// Sponsored Post.
	Featured = 7,		// Featured Post; may get boosted visibility
	Sticky = 8,			// Sticky Post.
	Announced = 9,		// Announcement Post. Stickied at the top.
}

export class ForumPost {
	
	// Fixed Content
	private forum: string;
	private id: number;					// Tracks the ID of the post within its parent forum.
	private url: string;				// Link to the Source URL (External Site)
	private authorId: number;
	private title: string;				// Title of the post.
	private content: string;			// Text content for the post.
	private img: string;				// Image Path for Object Storage, e.g. img-ID-HASH.webp (or local-ID-HASH.webp for local)
	private video: string;				// Video Path (URL or object storage).
	private w: number;					// The width of the media object (image or video).
	private h: number;					// The height of the media object (image or video).
	
	// Tracked Values
	private status: PostStatus;			// Post Status: Deleted, Denied, Hidden, Approval, Visible, Featured, Stickied, Announced
	private views = 0;					// Views (Impressions) this post has had.
	private clicks = 0;					// Clicks on this post.
	private comments = 0;				// Number of comments on this post.
	private created = 0;				// Timestamp of when the post was created.
	private edited = 0;					// Timestamp of the last edit, if applicable.
	
	// List of awards given to this post.
	private awards: number[] = [0, 0, 0, 0];
		// [0]				$0.05 for a Award #1 (Seed?)
		// [1]				$0.25 for a Award #2 (Plant?)
		// [2]				$1.00 for a Award #3 (Tree?)
		// [3]				$5.00 for a Award #4 (Druid?)
	
	constructor(
		forum: string,
		id: number,
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
	
	public static async validatePostData(
		forum: string,
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
		
		// Make sure the author exists.
		const userExists = await User.idExists(authorId);
		if(userExists !== true) { return "Invalid `authorId`."}
		
		// Must have one or more of the following: (1) Media, (2) Title, (3) Content, or (4) Comment
		if(hasMedia === false && title.length > 0 && content.length === 0) {
			return "Must provide content for this post.";
		}
		
		// Validate Title (if present)
		if(title.length < 3) { return "`title` is too short."; }
		if(title.length > 128) { return "`title` is too long."; }
		
		// Validate Content (if present)
		if(content.length > 256) { return "`content` is too long." }
		
		// Confirm that forum is valid:
		if(!forum.match(/^[a-z0-9 ]+$/i)) { return "`forum` is not valid." }
		
		const forumSchema = Forum.schema[forum];
		
		if(!forumSchema) { return "`forum` does not exist." }
		
		// URL Requirements
		if(url) {
			try {
				new URL(url);
			} catch {
				return "Invalid `url` entry.";
			}
		}
		
		// Verify author's permissions.
		const role = await User.getRole(authorId);
		
		if(!forumSchema.canPost(role)) {
			return `User does not have permission to post on this forum.`;
		}
		
		// TODO: Affect status based on permissions.
		if(status > PostStatus.Visible) { return "`status` cannot start above visible state." }
		
		return "";
	}
	
	// Create a comment that only has comments, no media.
	public static async buildCommentPost(
		forum: string,
		url: string,
		authorId: number,
		title: string,
		content: string,
		status: PostStatus,
	): Promise<ForumPost | string> {
		
		// Validate Generic Post Data
		const msg = await ForumPost.validatePostData(forum, url, authorId, title, content, status);
		if(msg.length > 0) { return msg; }
		
		// Make sure the forum exists:
		if(!Forum.schema[forum]) { return `Error: The submitted forum does not exist.`; }
		
		// Assign a new ID and make sure a post isn't already using it.
		const id = await RedisDB.incrementCounter(`post:${forum}`);
		if(await ForumPost.checkIfPostExists(forum, id)) {
			return `Error creating ID ${id} in forum ${forum}. Please contact the administrator, this is a problem.`;
		}
		
		return new ForumPost(forum, id, url, authorId, title, content, "", "", 0, 0, status);
	}
	
	public static async buildMediaPost(
		forum: string,
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
		const msg = await ForumPost.validatePostData(forum, url, authorId, title, content, status, true);
		if(msg.length > 0) { return msg; }
		
		// Validate Width & Height
		if(w < 64) {  return "Posting an image with too small of a width." }
		if(h < 32) {  return "Posting an image with too small of a height." }
		
		// Make sure the forum exists:
		if(!Forum.schema[forum]) { return `Error: The submitted forum does not exist.`; }
		
		// Assign a new ID and make sure a post isn't already using it.
		const id = await RedisDB.incrementCounter(`post:${forum}`);
		
		if(await ForumPost.checkIfPostExists(forum, id)) {
			return `Error creating ID ${id} in forum ${forum}. Please contact the administrator, this is a problem.`;
		}
		
		// Prepare Video
		if(isVideo) {
			// TODO: Add Video Media Option
		}
		
		// Prepare Image
		const hash = Crypto.simpleHash(forum + id + authorId + id);
		const img = (config.local ? "local" : "img") + `-${id}-${hash}.webp`;
		
		return new ForumPost(forum, id, url, authorId, title, content, img, "", w, h, status);
	}
	
	public applyNewPost(status = PostStatus.Visible) {
		this.applyTrackedValues(status, Math.floor(Date.now() / 1000));
	}
	
	public applyTrackedValues(status = PostStatus.Visible, created = 0, edited = 0, views = 0, clicks = 0, comments = 0) {
		this.status = status;
		this.created = created;
		this.edited = edited;
		this.views = views;
		this.clicks = clicks;
		this.comments = comments;
	}
	
	public applyAwards(award1 = 0, award2 = 0, award3 = 0, award4 = 0) {
		this.awards = [this.awards[0] + award1, this.awards[1] + award2, this.awards[2] + award3, this.awards[3] + award4];
	}
	
	// Apply an Edit
	public applyEdit(authorId: number): boolean {
		
		// Restrict edits to the original author.
		if(authorId != this.authorId) {
			return false;
		}
		
		this.edited = Math.floor(Date.now() / 1000);
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
	
	public setImageSize(width: number, height: number) {
		this.w = width;
		this.h = height;
	}
	
	public static async checkIfPostExists(forum: string, id: number): Promise<boolean> {
		return (await RedisDB.db.exists(`post:${forum}:${id}`)) === 0 ? false : true;
	}
	
	// post:{forum}:{id}			// Uses count:post:{forum}.
	// sponsor:{forum}:{id}			// Uses count:sponsor:{forum}.
	// queue:{forum}:{id}			// Uses count:queue:{forum}.
	public static async loadFromId(forum: string, id: number, tableType: TableType): Promise<ForumPost|false> {
		const raw = await RedisDB.db.hmget(`${tableType}:${forum}:${id}`,
			
			// Fixed Content
			"forum",			// 0
			"id",				// 1
			"url",				// 2
			"authorId",			// 3
			"title",			// 4
			"content",			// 5
			"img",				// 6
			"video",			// 7
			"w",				// 8
			"h",				// 9
			
			// Tracked Values
			"status",			// 10
			"created",			// 11
			"edited",			// 12
			"views",			// 13
			"clicks",			// 14
			"comments",			// 15
			"awards",			// 16 (split by '.'; e.g. 4.3.0.0)
		);
		
		const post = new ForumPost(
			forum,								// forum
			Number(raw[1] as string),			// id
			raw[2] as string,					// url
			Number(raw[3] as string),			// authorId
			raw[4] as string,					// title
			raw[5] as string,					// content
			raw[6] as string,					// img
			raw[7] as string,					// video
			Number(raw[8] as string),			// w
			Number(raw[9] as string),			// h
			Number(raw[10] as string),			// status (required for verification)
		);
		
		if(!post) { return false; }
		
		post.applyTrackedValues(
			Number(raw[10] as string),			// status
			Number(raw[11] as string),			// created
			Number(raw[12] as string),			// edited
			Number(raw[13] as string),			// views
			Number(raw[14] as string),			// clicks
			Number(raw[15] as string)			// comments
		);
		
		const awards = (raw[16] as string).split(".");
		post.applyAwards(Number(awards[0]) || 0, Number(awards[1]) || 0, Number(awards[2]) || 0, Number(awards[3]) || 0);
		
		return post;
	}
	
	// post:{forum}:{id}			// Uses count:post:{forum}.
	// sponsor:{forum}:{id}			// Uses count:sponsor:{forum}.
	// queue:{forum}:{id}			// Uses count:queue:{forum}.
	public static async getPostDataForUser(forum: string, id: number, tableType: TableType): Promise<Record<string, string|number>> {
		const raw = await RedisDB.db.hmget(`${tableType}:${forum}:${id}`,
			
			// Fixed Content
			"forum",			// 0
			"id",				// 1
			"url",				// 2
			"authorId",			// 3
			"title",			// 4
			"content",			// 5
			"img",				// 6
			"video",			// 7
			"w",				// 8
			"h",				// 9
			
			// Tracked Values
			"status",			// 10
			"comments",			// 11
			"awards",			// 12 (split by '.'; e.g. 4.3.0.0)
		);
		
		if(!raw) { return {}; }
		
		return {
			"forum": forum,
			"id": Number(raw[1] as string),				// id
			"url": raw[2] as string,					// url
			"authorId": Number(raw[3] as string),		// authorId
			"title": raw[4] as string,					// title
			"content": raw[5] as string,				// content
			"img": raw[6] as string,					// img
			"video": raw[7] as string,					// video
			"w": Number(raw[8] as string),				// w
			"h": Number(raw[9] as string),				// h
			"status": Number(raw[10] as string),		// status (required for verification)
			"comments": Number(raw[11] as string) || 0,	// 
			"awards": raw[12] as string || "",			// 
		};
	}
	
	// post:{forum}:{id}			// Uses count:post:{forum}.
	// sponsor:{forum}:{id}			// Uses count:sponsor:{forum}.
	// queue:{forum}:{id}			// Uses count:queue:{forum}.
	public async saveToRedis(tableType: TableType) {
		
		// TODO: Add TX Multi / Exec (Transaction) support.
			// See https://github.com/denodrivers/redis for full details
		// TODO: Only add indexes if the transaction succeeds.
		
		// TODO: hmset is deprecated, but hset requires >= version 4.00 (probably not available on Windows Redis)
		await RedisDB.db.hmset(`${tableType}:${this.forum}:${this.id}`,
			
			// Fixed Content
			["forum", this.forum],
			["id", this.id],
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
			["created", this.created],
			["edited", this.edited],
			["views", this.views],
			["clicks", this.clicks],
			["comments", this.comments],
			
			// Awards
			["awards", this.awards.join(".")],
		);
		
		return true;
	}
	
	// Validate Post Data
	public sanitizePostData() {
		this.content = Validate.safeText(this.content);
	}
}
