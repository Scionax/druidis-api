import { log } from "../deps.ts";
import { UserRole } from "./User.ts";

export const enum ForumType {
	News = "News",			// Means the forum is based on current events. Should retrieve entries based on recency.
	Collect = "Collect",	// Means the forum is a collection of timeless entries. Can retrieve these at any point.
	Mixed = "Mixed",		// Means the forum is a collection, but usually weighted toward time-sensitive material.
}

/*
	Druidis uses a small and simple set of categories to foster discovery, knowledge, and general browsing.
		- To foster more specific interests, people will gravitate to specific cultures.
*/

export class Forum {
	
	// Contains a full list of Forums
	static schema: { [id: string]: Forum } = {};
	
	// Forum Traits
	readonly name: string;								// Forum Name
	readonly type: ForumType;							// Forum Type (News, Collect, Mixed)
	readonly feed: string;								// Parent Forum Name
	private related: string[];							// Related Forums
	private communities: string[];						// Related Communities
	private desc: string;								// Full description of the forum.
	
	// Curation Restrictions: Permissions for interacting with the forum (e.g. Public, TrustedUsers, ModApproval, Curated, etc).
	private permissions: {
		view: UserRole,				// Permissions to view the forum.
		post: UserRole,				// Permissions to post.
		comment: UserRole,			// Permissions to comment.
	};
	
	// Custom Rules
	private rules: string[];
	
	constructor(name: string, feed: string, type: ForumType) {
		this.name = name;
		this.type = type;
		this.feed = feed;
		this.related = [];
		this.communities = [];
		this.desc = "";
		this.permissions = {
			view: UserRole.Guest,
			post: UserRole.TrustMid,
			comment: UserRole.TrustLow,
		};
		this.rules = [];
	}
	
	public static exists(forum: string) { return forum && Forum.schema[forum]; }
	
	public static get(name: string): Forum { return Forum.schema[name]; }
	
	public static getCompactSchema() {
		const response: {[forum: string]: string} = {};
		
		for (const [key, value] of Object.entries(Forum.schema)) {
			response[key] = value.feed;
		}
		
		return response;
	}
	
	// Initialize Forums at Server Start
	public static initialize() {
		
		// News Feed
		Forum.schema["Business"] = new Forum("Business", "News", ForumType.News);
		Forum.schema["Economic"] = new Forum("Economic", "News", ForumType.News);
		Forum.schema["Environment"] = new Forum("Environment", "News", ForumType.News);
		Forum.schema["Legal"] = new Forum("Legal", "News", ForumType.News);
		Forum.schema["Politics"] = new Forum("Politics", "News", ForumType.News);
		Forum.schema["Social Issues"] = new Forum("Social Issues", "News", ForumType.News);
		Forum.schema["World News"] = new Forum("World News", "News", ForumType.News);
		
		// Informative Feed
		Forum.schema["Education"] = new Forum("Education", "Informative", ForumType.Collect);
		Forum.schema["History"] = new Forum("History", "Informative", ForumType.Collect);
		Forum.schema["Science"] = new Forum("Science", "Informative", ForumType.News);
		Forum.schema["Technology"] = new Forum("Technology", "Informative", ForumType.News);
		
		// Entertainment Feed
		Forum.schema["Books"] = new Forum("Books", "Entertainment", ForumType.Mixed);
		Forum.schema["Gaming"] = new Forum("Gaming", "Entertainment", ForumType.News);
		Forum.schema["Movies"] = new Forum("Movies", "Entertainment", ForumType.News);
		Forum.schema["Music"] = new Forum("Music", "Entertainment", ForumType.News);
		Forum.schema["People"] = new Forum("People", "Entertainment", ForumType.News);
		Forum.schema["Shows"] = new Forum("Shows", "Entertainment", ForumType.News);
		Forum.schema["Sports"] = new Forum("Sports", "Entertainment", ForumType.News);
		Forum.schema["Tabletop Games"] = new Forum("Tabletop Games", "Entertainment", ForumType.Mixed);
		Forum.schema["Virtual Reality"] = new Forum("Virtual Reality", "Entertainment", ForumType.Mixed);
		
		// Lifestyle Feed
		Forum.schema["Fashion"] = new Forum("Fashion", "Lifestyle", ForumType.Mixed);
		Forum.schema["Fitness"] = new Forum("Fitness", "Lifestyle", ForumType.Collect);
		Forum.schema["Food"] = new Forum("Food", "Lifestyle", ForumType.Collect);
		Forum.schema["Health"] = new Forum("Health", "Lifestyle", ForumType.Collect);
		Forum.schema["Recipes"] = new Forum("Recipes", "Lifestyle", ForumType.Collect);
		Forum.schema["Relationships"] = new Forum("Relationships", "Lifestyle", ForumType.Collect);
		Forum.schema["Social Life"] = new Forum("Social Life", "Lifestyle", ForumType.Collect);
		Forum.schema["Travel"] = new Forum("Travel", "Lifestyle", ForumType.Mixed);
		
		// Fun Feed
		Forum.schema["Ask"] = new Forum("Ask", "Fun", ForumType.Collect);
		Forum.schema["Cosplay"] = new Forum("Cosplay", "Fun", ForumType.Collect);
		Forum.schema["Cute"] = new Forum("Cute", "Fun", ForumType.Collect);
		Forum.schema["Forum Games"] = new Forum("Forum Games", "Fun", ForumType.Collect);
		Forum.schema["Funny"] = new Forum("Funny", "Fun", ForumType.Collect);
		
		// Creative Feed
		Forum.schema["Artwork"] = new Forum("Artwork", "Creative", ForumType.Collect);
		Forum.schema["Crafts"] = new Forum("Crafts", "Creative", ForumType.Collect);
		Forum.schema["Design"] = new Forum("Design", "Creative", ForumType.Collect);
		Forum.schema["Writing"] = new Forum("Writing", "Creative", ForumType.Collect);
		
		// Console Display
		log.info("Forums Initialized.");
	}
	
	// ----- Initialize Forums ----- //
	
	private addRelated(...args: string[] ) {
		for(let i = 0; i < args.length; i++) {
			this.related.push(args[i]);
		}
		return this;
	}
	
	private setDescription(desc: string) { this.desc = desc; }
	
	private addRule(rule: string) {
		this.rules.push(rule);
	}
	
	// ----- Permissions ----- //
	
	public canView(role: UserRole) { return this.permissions.view <= role; }
	public canPost(role: UserRole) { return this.permissions.post <= role; }
	public canComment(role: UserRole) { return this.permissions.comment <= role; }
	
	private setPermissions(view: UserRole, post: UserRole, comment: UserRole) {
		this.permissions.view = view;
		this.permissions.post = post;
		this.permissions.comment = comment;
	}
	
}
