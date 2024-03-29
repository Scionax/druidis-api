import Conn from "../core/Conn.ts";
import ImageMod from "../core/ImageMod.ts";
import ObjectStorage from "../core/ObjectStorage.ts";
import Validate from "../core/Validate.ts";
import Web from "../core/Web.ts";
import { Forum } from "../model/Forum.ts";
import { ForumPost, PostStatus, TableType } from "../model/ForumPost.ts";
import WebController from "./WebController.ts";

type TrackRecentPost = { title: string; url: string; lastPost: number; }

export default class PostController extends WebController {
	
	static recentPosts: { [authorId: number]: TrackRecentPost } = {};		// Used to prevent re-submitting same material.
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn);
		}
		
		else if(conn.request.method === "OPTIONS") {
			return conn.sendJSON("SUCCESS");
		}
		
		return conn.badRequest("Method Not Allowed", 405);
	}
	
	// GET /post/:forum							// Returns recent posts that the user hasn't acquired yet.
	// GET /post/:forum/:id						// Returns a specific post based on an id.
	async getController(conn: Conn): Promise<Response> {
		
		// Make sure the forum exists
		if(!conn.url2 || !Forum.exists(conn.url2)) {
			return conn.badRequest("Post Request: Forum does not exist.");
		}
		
		// If we're checking IDs, e.g. GET /post/:forum/:id
		if(conn.url3) {
			
			// Make sure the slug is valid:
			if(!Validate.isValidSlug(conn.url3)) { return conn.badRequest("Post Request: Invalid post url."); }
			
			// Retrieve the post
			const post = await ForumPost.loadFromId(conn.url2, Number(conn.url3), TableType.Post);
			
			if(post) {
				return conn.sendJSON(post);
			} else {
				return conn.badRequest("Post Request: Invalid post.");
			}
		}
		
		return conn.badRequest("Bad Request");
	}
	
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		if(rawData instanceof Response) { return rawData; }
		
		// Make sure the author hasn't re-submitted the same content (such as accidentally clicking twice).
		const authorId = 0; // TODO: Change authorID based on the Connection.
		
		if(PostController.recentPosts[authorId]) {
			if(
				PostController.recentPosts[authorId].title === rawData.title ||
				PostController.recentPosts[authorId].url === rawData.url ||
				PostController.recentPosts[authorId].lastPost > Math.floor(Date.now() / 1000) - 5		// Posted within last five seconds.
			) {
				return conn.badRequest(`Resubmission Error. Already posted "${rawData.title}" at ${rawData.url}, or a re-submission was attempted too quickly.`);
			}
		} else {
			PostController.recentPosts[authorId] = { lastPost: 0, title: "", url: "" };
		}
		
		PostController.recentPosts[authorId].lastPost = Math.floor(Date.now() / 1000);
		
		// If there is no image data, prevent the post.
		// TODO: Allow video submissions (eventually).
		if(!rawData.origImg) {
			return conn.badRequest("Must include: origImg, w, and h.");
		}
		
		if(!rawData.w || !rawData.h || typeof rawData.w !== "number" || typeof rawData.h !== "number") {
			return conn.badRequest("Must include a valid `w` (image width) and `h` (image height).");
		}
		
		const width = Number(rawData.w as string);
		const height = Number(rawData.h as string);
		
		// Convert Raw Data to ForumPost
		const post = await ForumPost.buildMediaPost(
			rawData.forum && typeof rawData.forum === "string" ? rawData.forum : "",
			rawData.url && typeof rawData.url === "string" ? rawData.url : "",
			authorId,
			rawData.title && typeof rawData.title === "string"? rawData.title : "",
			rawData.content && typeof rawData.content === "string" ? rawData.content : "",
			width,
			height,
			rawData.status && typeof rawData.status === "string" ? Number(rawData.status) : PostStatus.Visible,
			false, // [isVideo] TODO: Allow video if applicable above.
		);
		
		// On Failure
		if(typeof post === "string") { return conn.badRequest(post); }
		
		// Prepare Directory & Image Name
		const imageDir = post.getImageDir();
		const imagePath = post.getImagePathName();
		
		// Download Image
		if(typeof rawData.origImg === "string") {
			const downloadedImage = await Web.download(`images/${imageDir}`, imagePath, rawData.origImg);
			
			if(downloadedImage === false) {
				return conn.badRequest("Unable to retrieve source image.");
			}
		}
		
		// TODO: if(typeof rawData.origImg === "File") // No need to download from an external page.
		else {
			return conn.badRequest("Must provide an image source URL.");
		}
		
		post.applyNewPost();							// Post Successful. Update NEW POST values.
		
		// We need to identify the final resize so the web displays sizes correctly.
		const cropRules = ImageMod.getWideAspectCrop(width, height);
		const resizeRules = ImageMod.getResizeRules(cropRules);
		
		post.setImageSize(resizeRules.w, resizeRules.h);
		
		// TODO: author permissions should decide how this is saved.
		post.saveToRedis(TableType.Post);		// Save To Database
		
		// The post was at least partially successful. Update the author's submission data to catch recent posts.
		PostController.recentPosts[authorId].title = rawData.title as string;
		PostController.recentPosts[authorId].url = rawData.url as string;
		
		// Crop and Resize the image as needed, convert it to webp.
		const fullImagePath = `images/${imageDir}/${imagePath}`;
		
		await ImageMod.convert(fullImagePath, fullImagePath, cropRules, width, height);
		
		// Save Image to Object Storage
		try {
			const fileContents = await Deno.readFile(fullImagePath);
			ObjectStorage.save(imageDir, imagePath, fileContents, "image/webp");
		} catch(e) {
			return conn.badRequest(`Error on image transfer: ${(e as Error).message}`);
		}
		
		// Return Success
		return conn.sendJSON(post);
	}
}