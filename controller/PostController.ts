import { config } from "../config.ts";
import Conn from "../core/Conn.ts";
import ImageMod from "../core/ImageMod.ts";
import ObjectStorage from "../core/ObjectStorage.ts";
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
		
		// If there is no image data, prevent the post.
		// TODO: Allow video submissions (eventually).
		if(!rawData.image) {
			return await conn.sendFail("Must include: image, imageWidth, imageHeight.");
		}
		
		if(!rawData.imageWidth || !rawData.imageHeight || typeof rawData.imageWidth !== "number" || typeof rawData.imageHeight !== "number") {
			return await conn.sendFail("Must include a valid `imageWidth` and `imageHeight`.");
		}
		
		// Convert Raw Data to ForumPost
		const post = ForumPost.buildPost(
			conn,
			rawData.forum && typeof rawData.forum === "string" ? rawData.forum : "",
			0, // Assign to 0 for new posts.
			rawData.category && typeof rawData.category === "string" ? rawData.category : "",
			rawData.title && typeof rawData.title === "string"? rawData.title : "",
			rawData.url && typeof rawData.url === "string" ? rawData.url : "",
			rawData.authorId && typeof rawData.authorId === "string" ? Number(rawData.authorId) : 0,
			rawData.status && typeof rawData.status === "string" ? Number(rawData.status) : ForumPostStatus.Automatic,
			rawData.content && typeof rawData.content === "string" ? rawData.content : "",
		);
		
		// On Failure
		if(post == false || !conn.success) { return await conn.sendFail(conn.errorReason); }
		
		post.applyNewPost();	// Post Successful. Update NEW POST values.
		post.saveToRedis();		// Save To Database
		
		// Prepare Directory & Image Name
		const imageDir = post.getImageDir();
		const imagePath = post.getImagePath();
		
		// Download Image
		if(typeof rawData.image === "string") {
			const downloadedImage = await Web.download(imageDir, imagePath, rawData.image);
			
			if(downloadedImage === false) {
				return await conn.sendFail("Unable to retrieve source image.");
			}
		}
		
		// TODO: if(typeof rawData.image === "File") // No need to download from an external page.
		else {
			return await conn.sendFail("Must provide an image source URL.");
		}
		
		// Crop and Resize the image as needed, convert it to webp.
		const fullImagePath = `${Deno.cwd()}/${imageDir}/${imagePath}`;
		await ImageMod.convert(fullImagePath, fullImagePath, rawData.imageWidth, rawData.imageHeight);
		
		// Save Image to Object Storage
		try {
			const fileContents = await Deno.readFile(fullImagePath);
			ObjectStorage.putObject(config.objectStore.bucket, `${imageDir}/${imagePath}`, fileContents);
		} catch {
			return await conn.sendFail("Server error on image transfer.");
		}
		
		// Return Success
		return await conn.sendJson(post);
	}
}