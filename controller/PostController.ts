import Conn from "../core/Conn.ts";
import ImageMod from "../core/ImageMod.ts";
import Validate from "../core/Validate.ts";
import Web from "../core/Web.ts";
import { Forum } from "../model/Forum.ts";
import { ForumPost, ForumPostStatus } from "../model/ForumPost.ts";
import WebController from "./WebController.ts";

export default class PostController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method == "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method == "POST") {
			return await this.postController(conn);
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	// GET /post/:forum							// Returns recent posts that the user hasn't acquired yet.
	// GET /post/:forum/:id						// Returns a specific post based on an id.
	async getController(conn: Conn): Promise<Response> {
		
		// Make sure the forum exists
		if(!conn.url2 || !Forum.exists(conn.url2)) {
			return await conn.sendFail("Post Request: Forum does not exist.");
		}
		
		// If we're checking IDs, e.g. GET /post/:forum/:id
		if(conn.url3) {
			
			// Make sure the slug is valid:
			if(!Validate.isValidSlug(conn.url3)) { return await conn.sendFail("Post Request: Invalid post url."); }
			
			// Retrieve the post
			const post = await ForumPost.loadFromId(conn, conn.url2, Number(conn.url3));
			
			if(post) {
				return await conn.sendJson(post);
			}
		}
		
		return await conn.sendFail(conn.errorReason);
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await WebController.getPostValues(conn);
		if(!conn.success) { return await conn.sendFail(conn.errorReason); }
		
		// Convert Raw Data to ForumPost
		const post = ForumPost.buildPost(
			conn,
			rawData.forum && typeof rawData.forum === "string" ? rawData.forum : "",
			rawData.id && typeof rawData.id === "number" ? rawData.id : 0,
			rawData.category && typeof rawData.category === "string" ? rawData.category : "",
			rawData.title && typeof rawData.title === "string"? rawData.title : "",
			rawData.url && typeof rawData.url === "string" ? rawData.url : "",
			rawData.authorId && typeof rawData.authorId === "string" ? Number(rawData.authorId) : 0,
			rawData.status && typeof rawData.status === "string" ? Number(rawData.status) : ForumPostStatus.Automatic,
			rawData.content && typeof rawData.content === "string" ? rawData.content : "",
		);
		
		// On Failure
		if(post == false || !conn.success) { return await conn.sendFail(conn.errorReason); }
		
		// Post Successful. Update NEW POST values.
		post.applyNewPost();
		
		// Save To Database
		post.saveToRedis();
		
		
		// TODO: REMOVE
		// TODO: REMOVE
		// TODO: REMOVE
		// TODO: REMOVE
		// console.log("DOWNLOADING IMAGE");
		// const val = await Web.download("data", "image-test.png", "https://www.mozilla.org/media/protocol/img/logos/firefox/logo-md.7b8726d9ecb1.png");
		// console.log("IMAGE HAS BEEN DOWNLOADED");
		
		// const imageUse = ;
		// ImageMod.convert("data/image-test.png", "data/image-result.webp", 96, 96);
		// ImageMod.convert("data/image-test2.webp", "data/image-result.webp", 1125, 750);
		// ImageMod.convert("data/image-test3.jpeg", "data/image-result.webp", 500, 750);
		ImageMod.convert("data/image-test4.jpeg", "data/image-result.webp", 500, 550);
		console.log("CONVERTING IMAGE");
		
		
		
		if(!post) {
			return await conn.sendFail(conn.errorReason);
		}
		
		// Return Success
		return await conn.sendJson(post);
	}
}