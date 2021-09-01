import Conn from "../core/Conn.ts";
import Crypto from "../core/Crypto.ts";
import { MonthInSeconds } from "../core/Types.ts";
import { User } from "../model/User.ts";
import WebController from "./WebController.ts";

export default class UserController extends WebController {
	
	async runHandler(conn: Conn): Promise<Response> {
		
		if(conn.request.method === "GET") {
			return await this.getController(conn);
		}
		
		else if(conn.request.method === "POST") {
			return await this.postController(conn);
		}
		
		else if(conn.request.method === "OPTIONS") {
			return await conn.sendJson("SUCCESS");
		}
		
		return await conn.sendFail("Method Not Allowed", 405);
	}
	
	// GET /user
	async getController(conn: Conn): Promise<Response> {
		return await conn.sendFail();
	}
	
	// POST /user/login
	// POST /user/sign-up
	async postController(conn: Conn): Promise<Response> {
		
		// Retrieve Post Data
		const rawData = await conn.getPostData();
		if(conn.errorMessage) { return await conn.sendFail(conn.errorMessage); }
		
		if(conn.url2 === "login") { return await this.runLogin(conn, rawData); }
		if(conn.url2 === "sign-up") { return await this.runSignUp(conn, rawData); }
		if(conn.url2 === "logout") { return await this.runLogOut(conn, rawData); }
		
		return await conn.sendFail("Invalid API.");
	}
	
	async runLogin(conn: Conn, rawData: { [id: string]: FormDataEntryValue} ) {
		
		// Validate the information sent.
		const username = rawData.user as string;
		const password = rawData.pass as string;
		
		if(!username || username.length === 0) { return conn.sendFail("Invalid username provided."); }
		if(!password || password.length === 0) { return conn.sendFail("Invalid password provided."); }
		
		// Confirm ID Exists
		const id = await User.getId(username);
		if(!id) { return conn.sendFail("Server Error: Issue with retrieving user. May need to contact webmaster."); }
		
		// Attemept to validate the login:
		const passHash = await User.getPassword(id);
		const passed = (passHash === Crypto.safeHash(password));
		if(!passed) { return conn.sendFail("Unable to log in. User or password was not valid."); }
		
		// The password has cleared. Build the necessary cookie tokens.
		// id - the id of the user
		// token - a random token generated by the user
		const token = await User.getToken(id, true);
		
		// Return login cookie.
		conn.cookieSet("login", `${id}.${token}`, MonthInSeconds);
		
		return await conn.sendJson("Login successful.");
	}
	
	async runSignUp(conn: Conn, rawData: { [id: string]: FormDataEntryValue} ) {
		
		// Validate the information sent.
		const username = rawData.user as string;
		const password = rawData.pass as string;
		const email = rawData.email as string;
		const tos = rawData.tos === "true" ? true : false;
		const privacy = rawData.privacy === "true" ? true : false;
		
		if(!username || username.length === 0) { return conn.sendFail("Invalid username provided."); }
		if(!password || password.length === 0) { return conn.sendFail("Invalid password provided."); }
		if(!email || email.length === 0) { return conn.sendFail("Invalid email provided."); }
		if(!tos) { return conn.sendFail("Must agree to the terms of service."); }
		if(!privacy) { return conn.sendFail("Must agree to the privacy policy."); }
		
		// Determine if the system can create user with the given parameters:
		const createError = await User.canCreateUser(username, password, email, {});
		if(createError !== "") { return conn.sendFail(createError); }
		
		// Verification passed. Create the user.
		const id = await User.createUser(username, password, email, {})
		
		// Log the user in. Build the necessary cookie tokens.
		const token = await User.getToken(id, true);
		
		// Return login cookie.
		conn.cookieSet("login", `${id}.${token}`, MonthInSeconds);
		
		// Respond with success.
		return await conn.sendJson({ id: id, success: true });
	}
	
	async runLogOut(conn: Conn, rawData: { [id: string]: FormDataEntryValue} ) {
		
		// Check if the user is logged in.
		const cookies = conn.cookieGet();
		
		if(!cookies.login) { return await conn.sendJson("Already logged out."); }
		
		const id = await User.verifyLoginCookie(cookies.login);
		
		return await conn.sendJson({ id, cookies });
	}
}