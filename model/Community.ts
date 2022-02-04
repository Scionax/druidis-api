import { Forum } from "./Forum.ts";
import { UserRole } from "./User.ts";

/*
	Only Druidis can create communities.
	
	Some Communities are very broad, like Game Development, Creative Writing, etc.
	Other communities are much more narrow, like RWBY and Genshin Impact.
		- But may also be more active than something like Game Development.
	
	There may be a few community archetypes, which can have fairly expected categories / divisions:
	
	Community Types:
		Activism (only 3-5 types, to improve activism coordination): Environment, Social, Economic
		Work/Business/Finance (Stocks), Science Fields, Hobby Overlaps Elsewhere (Cars), Fan Clubs (Tesla)
		Gaming: Multiple Video Game Communities (WOW, LOL, NMS, etc) / (Video Games, Guides, Discussion, Art, Clips)
		Series (Film / Shows / Books): Fan Art, Discussion (can include theories & questions), Fan Fiction (Vetted)
		Crafts or Trade (Metalwork, Woodwork, Tailoring, Programming) > Guide, Discussion, Showcase
		Education: Science Fields
		Activity: Dance?
		Other: Gadgets (tech products), [____] Products
	
	Rules:
		- Removed if discussing politics, inaccurate science, or disinformation.
		- Optional: Mod post confirmation / approval. Approved posters. Trusted posters. Limit to posts/comments.
	
	How do you keep a Community Engaged?
		- Content has to keep active. If it falls too low, do something? Encourage posting? Focus elsewhere?
*/

export class Community {
	
	// Forum Traits
	private name: string;								// Forum Name: Alphanumeric, no spaces, possibly underscores or dashes.
	private related: { [id: string]: string };			// List of Related Communities
	private desc: string;								// Full description of the forum.
	
	// Rules & Curation: Restrictions for interacting with the forum (e.g. Public, TrustedUsers, ModApproval, Curated, etc).
	private permissions: {
		view: UserRole,				// Permissions to view the forum.
		post: UserRole,				// Permissions to post.
		comment: UserRole,			// Permissions to comment.
	};
	
	constructor(name: string) {
		this.name = name;
		this.related = {};
		this.desc = "";
		this.permissions = {
			view: UserRole.Guest,
			post: UserRole.TrustMid,
			comment: UserRole.TrustLow,
		};
	}
	
	// Add costs for posting and commenting.
	private setRules(view: UserRole, post: UserRole, comment: UserRole) {
		this.permissions.view = view;
		this.permissions.post = post;
		this.permissions.comment = comment;
	}
	
	// Add descriptions for the culture.
	private addDescription(desc: string) { this.desc = desc; }
	
	// Validation
	public static exists(forum: string) { return forum && Forum.schema[forum]; }
	
	// Initialize Forums at Server Start
	public static initialize() {
		
		// // Entertainment News
		// Forum.schema["Gaming"] = new Community("Gaming").addCategories("News", "Events", "Showoff", "Releases");
		// Forum.schema["Anime"] = new Community("Anime").addCategories();
		// Forum.schema["Music"] = new Community("Music").addCategories();
		// Forum.schema["Sports"] = new Community("Sports").addCategories();
		
		// // Special News
		// Forum.schema["UpliftingNews"] = new Community("UpliftingNews").addCategories();
		// Forum.schema["QualityJournalism"] = new Community("QualityJournalism").addCategories();
		
		// // Science News
		// Forum.schema["Environment"] = new Community("Environment").addCategories();
		// Forum.schema["Programming"] = new Community("Programming").addCategories();
		// Forum.schema["Science"] = new Community("Science").addCategories("Astronomy", "Anthropology", "Biology", "Chemistry", "EarthScience", "Economics", "Environment", "Geology",
		// "Health", "Mathematics", "Medicine", "Neuroscience", "Physics", "Psychology", "SocialScience");
		// Forum.schema["Technology"] = new Community("Technology").addCategories();
		
		// // ---------------------------- //
		// // ----- Community Forums ----- //
		// // ---------------------------- //
		
		// Forum.schema["Writing"] = new Community("Writing").addCategories();
		// Forum.schema["WorldBuilding"] = new Community("WorldBuilding").addCategories();
		// Forum.schema["GameDev"] = new Community("GameDev").addCategories();
		
		// // ----------------------------- //
		// // ----- Collection Forums ----- //
		// // ----------------------------- //
		
		// Forum.schema["Travel"] = new Community("Travel").addCategories();
		// Forum.schema["FoodPics"] = new Community("FoodPics").addCategories();
		// Forum.schema["Recipes"] = new Community("Recipes").addCategories();
		// Forum.schema["Vehicles"] = new Community("Vehicles").addCategories();
		// Forum.schema["Books"] = new Community("Books").addCategories();
		
		// // Arts & Crafts
		// Forum.schema["Art"] = new Community("Art").addCategories("Drawing", "DigitalArt", "Painting");
		// Forum.schema["Textiles"] = new Community("Textiles").addCategories("Embroidery", "Quilting");
		// Forum.schema["Metalwork"] = new Community("Metalwork").addCategories();
		// Forum.schema["Woodwork"] = new Community("Woodwork").addCategories();
		
		// // Games
		// Forum.schema["ActionGames"] = new Community("ActionGames").addCategories("Arcade", "BattleRoyale", "FPS", "Horror", "Racing", "Shooter", "Sports", "Stealth", "Survival");
		// Forum.schema["BrainGames"] = new Community("BrainGames").addCategories("Educational", "Programming", "Puzzle", "Trivia", "WordGames");
		// Forum.schema["CasualGames"] = new Community("CasualGames").addCategories("Cards", "Cooking", "Farming", "LifeSim");
		// Forum.schema["StoryGames"] = new Community("StoryGames").addCategories("Adventure", "RPG", "VisualNovel");
		// Forum.schema["StrategyGames"] = new Community("StrategyGames").addCategories("CCG", "Deckbuilding", "Mystery", "RTS", "Tactics", "TowerDefense", "WorldBuilder");
		
		// Forum.schema["GamingMemes"] = new Community("GamingMemes").addCategories();
		// Forum.schema["GamingAchievements"] = new Community("GamingAchievements").addCategories();
		
		// Forum.schema["BoardGames"] = new Community("BoardGames").addCategories();
		// Forum.schema["RPG"] = new Community("RPG").addCategories();
		
		// // Cute
		// Forum.schema["Cute"] = new Community("Cute").addCategories("Bird", "Canine", "Exotic", "Feline", "Wildlife");
		// Forum.schema["Cosplay"] = new Community("Cosplay").addCategories();
		
		// // Humor
		// Forum.schema["Jokes"] = new Community("Jokes").addCategories();
		// Forum.schema["Funny"] = new Community("Funny").addCategories();
		// Forum.schema["Comics"] = new Community("Comics").addCategories();
		// Forum.schema["ContagiousLaughter"] = new Community("ContagiousLaughter").addCategories();
		
		// // Console Display
		// log.info("Forums Initialized.");
	}
}
