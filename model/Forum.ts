import Mapp from "../core/Mapp.ts";

export const enum Curation {
	Public = 0,
	Registered = 1,			// Registered on the site.
	TrustedUser = 2,		// Is trusted by the site.
	VerifiedUser = 4,		// Is a verified user.
	VIPUser = 5,			// A VIP member.
	ApprovedUser = 6,		// An approved poster; given permission by moderator.
	ModApproval = 7,		// Must be approved by a moderator or curator.
	ModsOnly = 8,			// Restricted to moderators of the forum.
	Curated = 9,			// Restricted to designated curators.
	Admin = 10,				// Limited to admins.
}

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
	
	// Forum Traits
	readonly name: string;								// Forum Name
	readonly type: string;								// Forum Type (News, Collect, Mixed)
	readonly parent: string;							// Parent Forum Name
	private children: { [id: string]: string };			// Sub-Forums
	private related: string[];							// Related Forums
	private communities: string[];						// Related Communities
	private desc: string;								// Full description of the forum.
	
	// Curation Restrictions: Permissions for interacting with the forum (e.g. Public, TrustedUsers, ModApproval, Curated, etc).
	private curation: {
		view: Curation,				// Permissions to view the forum.
		post: Curation,				// Permissions to post.
		comment: Curation,			// Permissions to comment.
	};
	
	// Custom Rules
	private rules: string[];
	
	constructor(name: string, parent: string, type: ForumType) {
		this.name = name;
		this.type = type;
		this.parent = parent;
		this.children = {};
		this.related = [];
		this.communities = [];
		this.desc = "";
		this.curation = {
			view: Curation.Public,
			post: Curation.Curated,
			comment: Curation.TrustedUser,
		};
		this.rules = [];
	}
	
	public static getPostRow(forum: string, postId: number) { return `post:${forum}:${postId}`; }
	
	// Validation
	public static exists(forum: string) { return forum && Mapp.forums[forum]; }
	public hasChildForum(childForum: string) { return this.children[childForum] ? true : false; }
	
	// Routing
	public static get(name: string): Forum { return Mapp.forums[name]; }
	
	public static getCompactForumData() {
		const response: {[id: string]: { parent?: string, children?: Array<string>}} = {};
		
		for (const [key, value] of Object.entries(Mapp.forums)) {
			response[key] = {};
			
			if(Mapp.forums[key].parent) { response[key].parent = value.parent; }
			
			const children = [];
			
			for(const [k, _v] of Object.entries(Mapp.forums[key].children)) {
				children.push(k);
			}
			
			if(children.length > 0) {
				response[key].children = children;
			}
		}
		
		return response;
	}
	
	// Initialize Forums at Server Start
	public static initialize() {
		
		/*
			News
				- Business
				- Economic
				- Environment
				- Legal
				- Politics
				- Social Issues
				- World News
		*/
		
		Mapp.forums["News"] = new Forum("News", "", ForumType.News).addChildren("Business", "Economic", "Environment", "Legal", "Politics", "Social Issues", "World News");
		
		Mapp.forums["Business"] = new Forum("Business", "News", ForumType.News);
		Mapp.forums["Economic"] = new Forum("Economic", "News", ForumType.News);
		Mapp.forums["Environment"] = new Forum("Environment", "News", ForumType.News);
		Mapp.forums["Legal"] = new Forum("Legal", "News", ForumType.News);
		Mapp.forums["Politics"] = new Forum("Politics", "News", ForumType.News);
		Mapp.forums["Social Issues"] = new Forum("Social Issues", "News", ForumType.News);
		Mapp.forums["World News"] = new Forum("World News", "News", ForumType.News);
		
		/*
			Informative
				- Education
				- History
				- Science
				- Technology
		*/
		
		Mapp.forums["Informative"] = new Forum("Informative", "", ForumType.News).addChildren("Education", "History", "Science", "Technology");
		
		Mapp.forums["Education"] = new Forum("Education", "Informative", ForumType.Collect);
		Mapp.forums["History"] = new Forum("History", "Informative", ForumType.Collect);
		Mapp.forums["Science"] = new Forum("Science", "Informative", ForumType.News);
		Mapp.forums["Technology"] = new Forum("Technology", "Informative", ForumType.News);
		
		/*
			Entertainment
				- Books
				- Gaming
				- Movies
				- Music
				- People
				- Shows
				- Sports
				- Tabletop Games
				- Virtual Reality
		*/
		
		Mapp.forums["Entertainment"] = new Forum("Entertainment", "", ForumType.News).addChildren("Books", "Gaming", "Movies", "Music", "People", "Shows", "Sports", "Tabletop Games", "Virtual Reality");
		
		Mapp.forums["Books"] = new Forum("Books", "Entertainment", ForumType.Mixed);
		Mapp.forums["Gaming"] = new Forum("Gaming", "Entertainment", ForumType.News);
		Mapp.forums["Movies"] = new Forum("Movies", "Entertainment", ForumType.News);
		Mapp.forums["Music"] = new Forum("Music", "Entertainment", ForumType.News);
		Mapp.forums["People"] = new Forum("People", "Entertainment", ForumType.News);
		Mapp.forums["Shows"] = new Forum("Shows", "Entertainment", ForumType.News);
		Mapp.forums["Sports"] = new Forum("Sports", "Entertainment", ForumType.News);
		Mapp.forums["Tabletop Games"] = new Forum("Tabletop Games", "Entertainment", ForumType.Mixed);
		Mapp.forums["Virtual Reality"] = new Forum("Virtual Reality", "Entertainment", ForumType.Mixed);
		
		/*
			Lifestyle
				- Fashion
				- Fitness
				- Food
				- Health
				- Recipes
				- Social Life
				- Relationships
				- Travel
		*/
		
		Mapp.forums["Lifestyle"] = new Forum("Lifestyle", "", ForumType.Collect).addChildren("Fashion", "Fitness", "Food", "Health", "Recipes", "Social Life", "Relationships", "Travel");
		
		Mapp.forums["Fashion"] = new Forum("Fashion", "Lifestyle", ForumType.Mixed);
		Mapp.forums["Fitness"] = new Forum("Fitness", "Lifestyle", ForumType.Collect);
		Mapp.forums["Food"] = new Forum("Food", "Lifestyle", ForumType.Collect);
		Mapp.forums["Health"] = new Forum("Health", "Lifestyle", ForumType.Collect);
		Mapp.forums["Recipes"] = new Forum("Recipes", "Lifestyle", ForumType.Collect);
		Mapp.forums["Relationships"] = new Forum("Relationships", "Lifestyle", ForumType.Collect);
		Mapp.forums["Social Life"] = new Forum("Social Life", "Lifestyle", ForumType.Collect);
		Mapp.forums["Travel"] = new Forum("Travel", "Lifestyle", ForumType.Mixed);
		
		/*
			Fun
				- Ask (community questions)
				- Cosplay
				- Cute
				- Forum Games (choose X or Y)
				- Funny
		*/
		
		Mapp.forums["Fun"] = new Forum("Fun", "", ForumType.Collect).addChildren("Ask", "Cosplay", "Cute", "Forum Games", "Funny", );
		
		Mapp.forums["Ask"] = new Forum("Ask", "Fun", ForumType.Collect);
		Mapp.forums["Cosplay"] = new Forum("Cosplay", "Fun", ForumType.Collect);
		Mapp.forums["Cute"] = new Forum("Cute", "Fun", ForumType.Collect);
		Mapp.forums["Forum Games"] = new Forum("Forum Games", "Fun", ForumType.Collect);
		Mapp.forums["Funny"] = new Forum("Funny", "Fun", ForumType.Collect);
		
		/*
			Creative
				- Artwork
				- Crafts
				- Design
				- Writing
		*/
		
		Mapp.forums["Creative"] = new Forum("Creative", "", ForumType.Collect).addChildren("Artwork", "Crafts", "Design", "Writing");
		
		Mapp.forums["Artwork"] = new Forum("Artwork", "Creative", ForumType.Collect);
		Mapp.forums["Crafts"] = new Forum("Crafts", "Creative", ForumType.Collect);
		Mapp.forums["Design"] = new Forum("Design", "Creative", ForumType.Collect);
		Mapp.forums["Writing"] = new Forum("Writing", "Creative", ForumType.Collect);
		
		// Console Display
		console.log("Forums Initialized.");
	}
	
	// ----- Initialize Forums ----- //
	
	private addChildren(...args: string[] ) {
		for(let i = 0; i < args.length; i++) {
			this.children[args[i]] = args[i];
		}
		return this;
	}
	
	private addRelated(...args: string[] ) {
		for(let i = 0; i < args.length; i++) {
			this.related.push(args[i]);
		}
		return this;
	}
	
	private setPermissions(view: Curation, post: Curation, comment: Curation) {
		this.curation.view = view;
		this.curation.post = post;
		this.curation.comment = comment;
	}
	
	private setDescription(desc: string) { this.desc = desc; }
	
	private addRule(rule: string) {
		this.rules.push(rule);
	}
}
