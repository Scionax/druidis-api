import Mapp from "../core/Mapp.ts";
import { Curation } from "./Forum.ts";

/*
	Only Druidis can create communities. Must have an official curator in charge of it.
	
	Some Communities are very broad, like Game Development, Creative Writing, etc.
	Other communities are much more narrow, like RWBY and Genshin Impact.
		- But may also be more active than something like Game Development.
		
	There may be a few community archetypes, which can have fairly expected categories / divisions:
		Video Game > Guides, Discussion, Art, Clips
		Series (Book, Film, Show, etc) > Fan Art, Discussion (can include theories & questions), Fan Fiction (Vetted)
		Craft or Trade (Metalwork, Woodwork, Tailoring, Programming) > Guide, Discussion, Showcase
		Activity (Activism, Dance) > ???
	
	How do you keep a Community Engaged?
		- Content has to keep active. If it falls too low, do something? Encourage posting? Focus elsewhere?
*/

export class Community {
	
	// Forum Traits
	private name: string;								// Forum Name: Alphanumeric, no spaces, possibly underscores or dashes.
	private related: { [id: string]: string };			// List of Related Communities
	private desc: string;								// Full description of the forum.
	
	// Rules & Curation: Restrictions for interacting with the forum (e.g. Public, TrustedUsers, ModApproval, Curated, etc).
	private rules: {
		view: Curation,				// Permissions to view the forum.
		post: Curation,				// Permissions to post.
		comment: Curation,			// Permissions to comment.
	};
	
	constructor(name: string) {
		this.name = name;
		this.related = {};
		this.desc = "";
		this.rules = {
			view: Curation.Public,
			post: Curation.Curated,
			comment: Curation.TrustedUser,
		};
	}
	
	// Add costs for posting and commenting.
	private setRules(view: Curation, post: Curation, comment: Curation) {
		this.rules.view = view;
		this.rules.post = post;
		this.rules.comment = comment;
	}
	
	// Add descriptions for the culture.
	private addDescription(desc: string) { this.desc = desc; }
	
	// Validation
	public static exists(forum: string) { return forum && Mapp.forums[forum]; }
	
	// Initialize Forums at Server Start
	public static initialize() {
		
		// // Entertainment News
		// Mapp.forums["Gaming"] = new Community("Gaming").addCategories("News", "Events", "Showoff", "Releases");
		// Mapp.forums["Anime"] = new Community("Anime").addCategories();
		// Mapp.forums["Music"] = new Community("Music").addCategories();
		// Mapp.forums["Sports"] = new Community("Sports").addCategories();
		
		// // Special News
		// Mapp.forums["UpliftingNews"] = new Community("UpliftingNews").addCategories();
		// Mapp.forums["QualityJournalism"] = new Community("QualityJournalism").addCategories();
		
		// // Science News
		// Mapp.forums["Environment"] = new Community("Environment").addCategories();
		// Mapp.forums["Programming"] = new Community("Programming").addCategories();
		// Mapp.forums["Science"] = new Community("Science").addCategories("Astronomy", "Anthropology", "Biology", "Chemistry", "EarthScience", "Economics", "Environment", "Geology",
		// "Health", "Mathematics", "Medicine", "Neuroscience", "Physics", "Psychology", "SocialScience");
		// Mapp.forums["Technology"] = new Community("Technology").addCategories();
		
		// // ---------------------------- //
		// // ----- Community Forums ----- //
		// // ---------------------------- //
		
		// Mapp.forums["Writing"] = new Community("Writing").addCategories();
		// Mapp.forums["WorldBuilding"] = new Community("WorldBuilding").addCategories();
		// Mapp.forums["GameDev"] = new Community("GameDev").addCategories();
		
		// // ----------------------------- //
		// // ----- Collection Forums ----- //
		// // ----------------------------- //
		
		// Mapp.forums["Travel"] = new Community("Travel").addCategories();
		// Mapp.forums["FoodPics"] = new Community("FoodPics").addCategories();
		// Mapp.forums["Recipes"] = new Community("Recipes").addCategories();
		// Mapp.forums["Vehicles"] = new Community("Vehicles").addCategories();
		// Mapp.forums["Books"] = new Community("Books").addCategories();
		
		// // Arts & Crafts
		// Mapp.forums["Art"] = new Community("Art").addCategories("Drawing", "DigitalArt", "Painting");
		// Mapp.forums["Textiles"] = new Community("Textiles").addCategories("Embroidery", "Quilting");
		// Mapp.forums["Metalwork"] = new Community("Metalwork").addCategories();
		// Mapp.forums["Woodwork"] = new Community("Woodwork").addCategories();
		
		// // Games
		// Mapp.forums["ActionGames"] = new Community("ActionGames").addCategories("Arcade", "BattleRoyale", "FPS", "Horror", "Racing", "Shooter", "Sports", "Stealth", "Survival");
		// Mapp.forums["BrainGames"] = new Community("BrainGames").addCategories("Educational", "Programming", "Puzzle", "Trivia", "WordGames");
		// Mapp.forums["CasualGames"] = new Community("CasualGames").addCategories("Cards", "Cooking", "Farming", "LifeSim");
		// Mapp.forums["StoryGames"] = new Community("StoryGames").addCategories("Adventure", "RPG", "VisualNovel");
		// Mapp.forums["StrategyGames"] = new Community("StrategyGames").addCategories("CCG", "Deckbuilding", "Mystery", "RTS", "Tactics", "TowerDefense", "WorldBuilder");
		
		// Mapp.forums["GamingMemes"] = new Community("GamingMemes").addCategories();
		// Mapp.forums["GamingAchievements"] = new Community("GamingAchievements").addCategories();
		
		// Mapp.forums["BoardGames"] = new Community("BoardGames").addCategories();
		// Mapp.forums["RPG"] = new Community("RPG").addCategories();
		
		// // Cute
		// Mapp.forums["Cute"] = new Community("Cute").addCategories("Bird", "Canine", "Exotic", "Feline", "Wildlife");
		// Mapp.forums["Cosplay"] = new Community("Cosplay").addCategories();
		
		// // Humor
		// Mapp.forums["Jokes"] = new Community("Jokes").addCategories();
		// Mapp.forums["Funny"] = new Community("Funny").addCategories();
		// Mapp.forums["Comics"] = new Community("Comics").addCategories();
		// Mapp.forums["ContagiousLaughter"] = new Community("ContagiousLaughter").addCategories();
		
		// // Console Display
		// console.log("Forums Initialized.");
	}
}
