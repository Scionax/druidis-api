
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
	
	static schema: { [id: string]: Forum } = {};
	
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
	
	// Validation
	public static exists(forum: string) { return forum && Forum.schema[forum]; }
	public hasChildForum(childForum: string) { return this.children[childForum] ? true : false; }
	
	// Routing
	public static get(name: string): Forum { return Forum.schema[name]; }
	
	public static getCompactForumSchema() {
		const response: {[id: string]: { parent?: string, children?: Array<string>}} = {};
		
		for (const [key, value] of Object.entries(Forum.schema)) {
			response[key] = {};
			
			if(Forum.schema[key].parent) { response[key].parent = value.parent; }
			
			const children = [];
			
			for(const [k, _v] of Object.entries(Forum.schema[key].children)) {
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
		
		Forum.schema["News"] = new Forum("News", "", ForumType.News).addChildren("Business", "Economic", "Environment", "Legal", "Politics", "Social Issues", "World News");
		
		Forum.schema["Business"] = new Forum("Business", "News", ForumType.News);
		Forum.schema["Economic"] = new Forum("Economic", "News", ForumType.News);
		Forum.schema["Environment"] = new Forum("Environment", "News", ForumType.News);
		Forum.schema["Legal"] = new Forum("Legal", "News", ForumType.News);
		Forum.schema["Politics"] = new Forum("Politics", "News", ForumType.News);
		Forum.schema["Social Issues"] = new Forum("Social Issues", "News", ForumType.News);
		Forum.schema["World News"] = new Forum("World News", "News", ForumType.News);
		
		/*
			Informative
				- Education
				- History
				- Science
				- Technology
		*/
		
		Forum.schema["Informative"] = new Forum("Informative", "", ForumType.News).addChildren("Education", "History", "Science", "Technology");
		
		Forum.schema["Education"] = new Forum("Education", "Informative", ForumType.Collect);
		Forum.schema["History"] = new Forum("History", "Informative", ForumType.Collect);
		Forum.schema["Science"] = new Forum("Science", "Informative", ForumType.News);
		Forum.schema["Technology"] = new Forum("Technology", "Informative", ForumType.News);
		
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
		
		Forum.schema["Entertainment"] = new Forum("Entertainment", "", ForumType.News).addChildren("Books", "Gaming", "Movies", "Music", "People", "Shows", "Sports", "Tabletop Games", "Virtual Reality");
		
		Forum.schema["Books"] = new Forum("Books", "Entertainment", ForumType.Mixed);
		Forum.schema["Gaming"] = new Forum("Gaming", "Entertainment", ForumType.News);
		Forum.schema["Movies"] = new Forum("Movies", "Entertainment", ForumType.News);
		Forum.schema["Music"] = new Forum("Music", "Entertainment", ForumType.News);
		Forum.schema["People"] = new Forum("People", "Entertainment", ForumType.News);
		Forum.schema["Shows"] = new Forum("Shows", "Entertainment", ForumType.News);
		Forum.schema["Sports"] = new Forum("Sports", "Entertainment", ForumType.News);
		Forum.schema["Tabletop Games"] = new Forum("Tabletop Games", "Entertainment", ForumType.Mixed);
		Forum.schema["Virtual Reality"] = new Forum("Virtual Reality", "Entertainment", ForumType.Mixed);
		
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
		
		Forum.schema["Lifestyle"] = new Forum("Lifestyle", "", ForumType.Collect).addChildren("Fashion", "Fitness", "Food", "Health", "Recipes", "Social Life", "Relationships", "Travel");
		
		Forum.schema["Fashion"] = new Forum("Fashion", "Lifestyle", ForumType.Mixed);
		Forum.schema["Fitness"] = new Forum("Fitness", "Lifestyle", ForumType.Collect);
		Forum.schema["Food"] = new Forum("Food", "Lifestyle", ForumType.Collect);
		Forum.schema["Health"] = new Forum("Health", "Lifestyle", ForumType.Collect);
		Forum.schema["Recipes"] = new Forum("Recipes", "Lifestyle", ForumType.Collect);
		Forum.schema["Relationships"] = new Forum("Relationships", "Lifestyle", ForumType.Collect);
		Forum.schema["Social Life"] = new Forum("Social Life", "Lifestyle", ForumType.Collect);
		Forum.schema["Travel"] = new Forum("Travel", "Lifestyle", ForumType.Mixed);
		
		/*
			Fun
				- Ask (community questions)
				- Cosplay
				- Cute
				- Forum Games (choose X or Y)
				- Funny
		*/
		
		Forum.schema["Fun"] = new Forum("Fun", "", ForumType.Collect).addChildren("Ask", "Cosplay", "Cute", "Forum Games", "Funny", );
		
		Forum.schema["Ask"] = new Forum("Ask", "Fun", ForumType.Collect);
		Forum.schema["Cosplay"] = new Forum("Cosplay", "Fun", ForumType.Collect);
		Forum.schema["Cute"] = new Forum("Cute", "Fun", ForumType.Collect);
		Forum.schema["Forum Games"] = new Forum("Forum Games", "Fun", ForumType.Collect);
		Forum.schema["Funny"] = new Forum("Funny", "Fun", ForumType.Collect);
		
		/*
			Creative
				- Artwork
				- Crafts
				- Design
				- Writing
		*/
		
		Forum.schema["Creative"] = new Forum("Creative", "", ForumType.Collect).addChildren("Artwork", "Crafts", "Design", "Writing");
		
		Forum.schema["Artwork"] = new Forum("Artwork", "Creative", ForumType.Collect);
		Forum.schema["Crafts"] = new Forum("Crafts", "Creative", ForumType.Collect);
		Forum.schema["Design"] = new Forum("Design", "Creative", ForumType.Collect);
		Forum.schema["Writing"] = new Forum("Writing", "Creative", ForumType.Collect);
		
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
