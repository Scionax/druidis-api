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

/*
	Druidis uses a small and simple set of categories to foster discovery, knowledge, and general browsing.
		- To foster more specific interests, people will gravitate to specific cultures.
*/

export class Forum {
	
	// Forum Traits
	private name: string;								// Forum Name
	private parent: string;								// Parent Forum Name
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
	
	constructor(name: string, parent: string) {
		this.name = name;
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
		
		Mapp.forums["News"] = new Forum("News", "").addChildren("Business", "Economic", "Environment", "Legal", "Politics", "Social Issues", "World News");
		
		Mapp.forums["Business"] = new Forum("Business", "News");
		Mapp.forums["Economic"] = new Forum("Economic", "News");
		Mapp.forums["Environment"] = new Forum("Environment", "News");
		Mapp.forums["Legal"] = new Forum("Legal", "News");
		Mapp.forums["Politics"] = new Forum("Politics", "News");
		Mapp.forums["Social Issues"] = new Forum("Social Issues", "News");
		Mapp.forums["World News"] = new Forum("World News", "News");
		
		/*
			Informative
				- Education
				- History
				- Science
				- Technology
		*/
		
		Mapp.forums["Informative"] = new Forum("Informative", "").addChildren("Education", "History", "Science", "Technology");
		
		Mapp.forums["Education"] = new Forum("Education", "Informative");
		Mapp.forums["History"] = new Forum("History", "Informative");
		Mapp.forums["Science"] = new Forum("Science", "Informative");
		Mapp.forums["Technology"] = new Forum("Technology", "Informative");
		
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
		
		Mapp.forums["Entertainment"] = new Forum("Entertainment", "").addChildren("Books", "Gaming", "Movies", "Music", "People", "Shows", "Sports", "Tabletop Games", "Virtual Reality");
		
		Mapp.forums["Books"] = new Forum("Books", "Entertainment");
		Mapp.forums["Gaming"] = new Forum("Gaming", "Entertainment");
		Mapp.forums["Movies"] = new Forum("Movies", "Entertainment");
		Mapp.forums["Music"] = new Forum("Music", "Entertainment");
		Mapp.forums["People"] = new Forum("People", "Entertainment");
		Mapp.forums["Shows"] = new Forum("Shows", "Entertainment");
		Mapp.forums["Sports"] = new Forum("Sports", "Entertainment");
		Mapp.forums["Tabletop Games"] = new Forum("Tabletop Games", "Entertainment");
		Mapp.forums["Virtual Reality"] = new Forum("Virtual Reality", "Entertainment");
		
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
		
		Mapp.forums["Lifestyle"] = new Forum("Lifestyle", "").addChildren("Fashion", "Fitness", "Food", "Health", "Recipes", "Social Life", "Relationships", "Travel");
		
		Mapp.forums["Fashion"] = new Forum("Fashion", "Lifestyle");
		Mapp.forums["Fitness"] = new Forum("Fitness", "Lifestyle");
		Mapp.forums["Food"] = new Forum("Food", "Lifestyle");
		Mapp.forums["Health"] = new Forum("Health", "Lifestyle");
		Mapp.forums["Recipes"] = new Forum("Recipes", "Lifestyle");
		Mapp.forums["Relationships"] = new Forum("Relationships", "Lifestyle");
		Mapp.forums["Social Life"] = new Forum("Social Life", "Lifestyle");
		Mapp.forums["Travel"] = new Forum("Travel", "Lifestyle");
		
		/*
			Fun
				- Ask (community questions)
				- Cosplay
				- Cute
				- Forum Games (choose X or Y)
				- Funny
		*/
		
		Mapp.forums["Fun"] = new Forum("Fun", "").addChildren("Ask", "Cosplay", "Cute", "Forum Games", "Funny", );
		
		Mapp.forums["Ask"] = new Forum("Ask", "Fun");
		Mapp.forums["Cosplay"] = new Forum("Cosplay", "Fun");
		Mapp.forums["Cute"] = new Forum("Cute", "Fun");
		Mapp.forums["Forum Games"] = new Forum("Forum Games", "Fun");
		Mapp.forums["Funny"] = new Forum("Funny", "Fun");
		
		/*
			Creative
				- Artwork
				- Crafts
				- Design
				- Writing
		*/
		
		Mapp.forums["Creative"] = new Forum("Creative", "").addChildren("Artwork", "Crafts", "Design", "Writing");
		
		Mapp.forums["Artwork"] = new Forum("Artwork", "Creative");
		Mapp.forums["Crafts"] = new Forum("Crafts", "Creative");
		Mapp.forums["Design"] = new Forum("Design", "Creative");
		Mapp.forums["Writing"] = new Forum("Writing", "Creative");
		
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
