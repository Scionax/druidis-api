import Mapp from "../core/Mapp.ts";

const enum Curation {
	Public = 0,
	TrustedUser = 2,		// Is trusted by the site.
	VerifiedUser = 4,		// Is a VIP or verified user.
	ApprovedUser = 6,		// Are an approved poster on this forum.
	ModApproval = 7,		// Each post or comment must be approved individually.
	ModsOnly = 8,			// Only mods of the forum can post.
	Curated = 9,			// Only curated by designated owner(s).
}

export class Forum {
	
	// Forum Traits
	private name: string;								// Forum Name: Alphanumeric, no spaces, possibly underscores or dashes.
	private categories: { [id: string]: string };		// Sub-categories { "categoryName": "cssClass" }, where cssClass is used to display.
	private related: { [id: string]: string };			// List of Related Forums
	private desc: string;								// Full description of the forum.
	
	// Rules
	// [0] Post Curation - Restrictions for posting to the forum (e.g. Public, TrustedUsers, ModApproval, Curated).
	// [1] Comment Curation - Restrictions for commenting on the forum.
	// [2] Post Cost - # of seeds to post (in addition to other requirements).
	// [3] Comment Cost - # of seeds to comment (in addition to other requirements).
	private rules: [Curation, Curation, number, number];
	
	constructor(name: string) {
		this.name = name;
		this.categories = {};
		this.related = {};
		this.desc = "";
		this.rules = [Curation.Curated, Curation.TrustedUser, 0, 0];
	}
	
	// Add categories to the forum.
	private addCategories(...args: string[] ) {
		for(let i = 0; i < args.length; i++) {
			this.categories[args[i]] = args[i];
		}
		return this;
	}
	
	// Add costs for posting and commenting.
	private setRules(postCuration: Curation, commentCuration: Curation, postCost: number, commentCost = 0) {
		this.rules[0] = postCuration;
		this.rules[1] = commentCuration;
		this.rules[2] = postCost;
		this.rules[3] = commentCost;
	}
	
	// Add descriptions for the forum.
	private addDescription(desc: string) { this.desc = desc; }
	
	// Validation
	public static exists(forum: string) { return forum && Mapp.forums[forum]; }
	public hasCategory(category: string) { return this.categories[category] ? true : false; }
	
	// Routing
	public static get(name: string): Forum {
		return Mapp.forums[name];
	}
	
	// Initialize Forums at Server Start
	public static initialize() {
		
		// ----------------------- //
		// ----- News Forums ----- //
		// ----------------------- //
		
		Mapp.forums["QualityJournalism"] = new Forum("QualityJournalism").addCategories();
		Mapp.forums["Environment"] = new Forum("Environment").addCategories();
		Mapp.forums["Entertainment"] = new Forum("Entertainment").addCategories();
		Mapp.forums["Movies"] = new Forum("Movies").addCategories();
		Mapp.forums["Shows"] = new Forum("Shows").addCategories();
		Mapp.forums["Anime"] = new Forum("Anime").addCategories();
		Mapp.forums["Videos"] = new Forum("Videos").addCategories();
		Mapp.forums["Documentaries"] = new Forum("Documentaries").addCategories();
		Mapp.forums["Music"] = new Forum("Music").addCategories();
		Mapp.forums["Programming"] = new Forum("Programming").addCategories();
		Mapp.forums["Sports"] = new Forum("Sports").addCategories();
		Mapp.forums["Technology"] = new Forum("Technology").addCategories();
		Mapp.forums["UpliftingNews"] = new Forum("UpliftingNews").addCategories();
		
		Mapp.forums["Gaming"] = new Forum("Gaming").addCategories();
		
		Mapp.forums["Science"] = new Forum("Science").addCategories("Astronomy", "Anthropology", "Biology", "Chemistry", "EarthScience", "Economics", "Environment", "Geology",
		"Health", "Mathematics", "Medicine", "Neuroscience", "Physics", "Psychology", "SocialScience");
		
		// ---------------------------- //
		// ----- Community Forums ----- //
		// ---------------------------- //
		
		Mapp.forums["Writing"] = new Forum("Writing").addCategories();
		Mapp.forums["WorldBuilding"] = new Forum("WorldBuilding").addCategories();
		Mapp.forums["GameDev"] = new Forum("GameDev").addCategories();
		
		// ----------------------------- //
		// ----- Collection Forums ----- //
		// ----------------------------- //
		
		Mapp.forums["Travel"] = new Forum("Travel").addCategories();
		Mapp.forums["FoodPics"] = new Forum("FoodPics").addCategories();
		Mapp.forums["Recipes"] = new Forum("Recipes").addCategories();
		Mapp.forums["Vehicles"] = new Forum("Vehicles").addCategories();
		Mapp.forums["Books"] = new Forum("Books").addCategories();
		
		// Games
		Mapp.forums["ActionGames"] = new Forum("ActionGames").addCategories("Arcade", "BattleRoyale", "FPS", "Horror", "Racing", "Shooter", "Sports", "Stealth", "Survival");
		Mapp.forums["BrainGames"] = new Forum("BrainGames").addCategories("Educational", "Programming", "Puzzle", "Trivia", "WordGames");
		Mapp.forums["CasualGames"] = new Forum("CasualGames").addCategories("Cards", "Cooking", "Farming", "LifeSim");
		Mapp.forums["CoopGames"] = new Forum("CoopGames").addCategories();
		Mapp.forums["StoryGames"] = new Forum("StoryGames").addCategories("Adventure", "RPG", "VisualNovel");
		Mapp.forums["StrategyGames"] = new Forum("StrategyGames").addCategories("CCG", "Deckbuilding", "Mystery", "RTS", "Tactics", "TowerDefense", "WorldBuilder");
		
		Mapp.forums["GamingMemes"] = new Forum("GamingMemes").addCategories();
		Mapp.forums["GamingAchievements"] = new Forum("GamingAchievements").addCategories();
		
		// Cute
		Mapp.forums["Cute"] = new Forum("Cute").addCategories();
		Mapp.forums["Cosplay"] = new Forum("Cosplay").addCategories();
		
		// Humor
		Mapp.forums["Jokes"] = new Forum("Jokes").addCategories();
		Mapp.forums["Funny"] = new Forum("Funny").addCategories();
		Mapp.forums["Comics"] = new Forum("Comics").addCategories();
		Mapp.forums["ContagiousLaughter"] = new Forum("ContagiousLaughter").addCategories();
		
		// Console Display
		console.log("Forums Initialized.");
	}
}
