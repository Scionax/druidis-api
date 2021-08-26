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
				- World News
				- Politics
				- Social Issues
				- Environment
				- Business
				- Economic
				- Legal
		*/
		
		Mapp.forums["News"] = new Forum("News", "").addChildren("World News", "Politics", "Environment", "Social Issues", "Business", "Economic", "Legal");
		
		Mapp.forums["World News"] = new Forum("World News", "News");
		Mapp.forums["Politics"] = new Forum("Politics", "News");
		Mapp.forums["Environment"] = new Forum("Environment", "News");
		Mapp.forums["Social Issues"] = new Forum("Social Issues", "News");
		Mapp.forums["Business"] = new Forum("Business", "News");
		Mapp.forums["Economic"] = new Forum("Economic", "News");
		Mapp.forums["Legal"] = new Forum("Legal", "News");
		
		/*
			Science
			Technology
		*/
		
		Mapp.forums["Science"] = new Forum("Science", "");
		Mapp.forums["Technology"] = new Forum("Technology", "");
		
		/*
			Entertainment
				- Sports
				- People
				- Movies
				- Shows
				- Music
				- Books
				- Gaming
				- Tabletop Games
				- Virtual Reality
				- Products
		*/
		
		Mapp.forums["Entertainment"] = new Forum("Entertainment", "").addChildren("Sports", "People", "Movies", "Shows", "Music", "Books", "Gaming", "Tabletop Games", "Virtual Reality");
		
		Mapp.forums["Sports"] = new Forum("Sports", "Entertainment");
		Mapp.forums["People"] = new Forum("People", "Entertainment");
		Mapp.forums["Movies"] = new Forum("Movies", "Entertainment");
		Mapp.forums["Shows"] = new Forum("Shows", "Entertainment");
		Mapp.forums["Music"] = new Forum("Music", "Entertainment");
		Mapp.forums["Books"] = new Forum("Books", "Entertainment");
		Mapp.forums["Gaming"] = new Forum("Gaming", "Entertainment");
		Mapp.forums["Tabletop Games"] = new Forum("Tabletop Games", "Entertainment");
		Mapp.forums["Virtual Reality"] = new Forum("Virtual Reality", "Entertainment");
		Mapp.forums["Products"] = new Forum("Virtual Reality", "Entertainment");
		
		/*
			Lifestyle
				- Travel
				- Fitness
				- Fashion
				- Food
				- Recipes
				- Social Life
				- Relationships
				- Health
		*/
		
		Mapp.forums["Lifestyle"] = new Forum("Lifestyle", "").addChildren("Travel", "Fitness", "Fashion", "Food", "Recipes", "Social Life", "Relationships", "Health");
		
		Mapp.forums["Travel"] = new Forum("Travel", "Lifestyle");
		Mapp.forums["Fitness"] = new Forum("Fitness", "Lifestyle");
		Mapp.forums["Fashion"] = new Forum("Fashion", "Lifestyle");
		Mapp.forums["Food"] = new Forum("Food", "Lifestyle");
		Mapp.forums["Recipes"] = new Forum("Recipes", "Lifestyle");
		Mapp.forums["Social Life"] = new Forum("Social Life", "Lifestyle");
		Mapp.forums["Relationships"] = new Forum("Relationships", "Lifestyle");
		Mapp.forums["Health"] = new Forum("Health", "Lifestyle");
		
		/*
			Fun
				- Funny
				- Cute
				- Cosplay
				- Ask (community questions)
				- Playful (choose X or Y)
		*/
		
		Mapp.forums["Fun"] = new Forum("Fun", "").addChildren("Funny", "Cute", "Cosplay", "Ask", "Playful");
		
		Mapp.forums["Funny"] = new Forum("Funny", "Fun");
		Mapp.forums["Cute"] = new Forum("Cute", "Fun");
		Mapp.forums["Cosplay"] = new Forum("Cosplay", "Fun");
		Mapp.forums["Ask"] = new Forum("Ask", "Fun");
		Mapp.forums["Playful"] = new Forum("Playful", "Fun");
		
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
