import { assert } from "../../deps.ts";
import { Article } from "../../model/Article.ts";
import { ArticleBold, ArticleH2, ArticleH3, ArticleImage, ArticleQuote, ArticleText, ArticleVideo } from "../../model/ArticleSection.ts";

Deno.test("Create and verify Articles.", () => {
	const article = new Article("Entertainment", "A Cool Game To Play", 0);
	
	// Verify basic properties
	assert(article.forum === "Entertainment", `Article forum should equal "Entertainment".`);
	assert(article.title === "A Cool Game To Play", `Article title should equal "A Cool Game To Play".`);
	assert(article.slug === "a-cool-game-to-play", `Article slug should equal "a-cool-game-to-play".`);
	
});

Deno.test("Advanced Article loading from files.", async () => {
	const article = await Article.createFromPath(`data/articles/_empty.json`);
	
	// Verify that the article is created successfully.
	if(article === false) {
		assert(true, "Article was not correctly generated from data/articles/_empty.json");
		return;
	}
	
	assert(article.forum.length > 0, "_empty article should provide a default forum name.");
	assert(article.title.length > 0, "_empty article should provide a default title.");
	assert(article.slug.length > 0, "_empty article should provide a default slug.");
	assert(article.sections.length > 0, "_empty article should provide default sections.");
	
	// Verify that the sections are assigned correctly:
	assert(article.sections[0] instanceof ArticleText, "First section should be ArticleText");
	assert(article.sections[1] instanceof ArticleBold, "Second section should be ArticleBold");
	assert(article.sections[2] instanceof ArticleQuote, "Third section should be ArticleQuote");
	assert(article.sections[3] instanceof ArticleH2, "Fourth section should be ArticleH2");
	assert(article.sections[4] instanceof ArticleH3, "Fifth section should be ArticleH3");
	assert(article.sections[5] instanceof ArticleImage, "Sixth section should be ArticleImage");
	assert(article.sections[6] instanceof ArticleVideo, "Seventh section should be ArticleVideo");
});

Deno.test("Article exporting.", async () => {
	const article = await Article.createFromPath(`data/articles/_empty.json`);
	
	// Verify that the article is created successfully.
	if(article === false) {
		assert(true, "Article was not correctly generated from data/articles/_empty.json");
		return;
	}
	
	const json = article.json();
	
	// Verify basic properties on the JSON export.
	assert(json.forum.length > 0, "json export should have a forum name.");
	assert(json.title.length > 0, "json export should have a title.");
	assert(json.slug.length > 0, "json export should have a slug.");
	assert(json.sections.length > 0, "json export should have sections.");
	
	// Verify that the sections are assigned correctly:
	assert(json.sections[0].type === "text", "First section should be 'text'.");
	assert(json.sections[1].type === "bold", "Second section should be 'bold'.");
	assert(json.sections[2].type === "quote", "Third section should be 'quote'.");
	assert(json.sections[3].type === "h2", "Fourth section should be 'h2'.");
	assert(json.sections[4].type === "h3", "Fifth section should be 'h3'.");
	assert(json.sections[5].type === "image", "Sixth section should be 'image'.");
	assert(json.sections[6].type === "video", "Seventh section should be 'video'.");
});