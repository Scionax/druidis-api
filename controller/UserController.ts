import Conn from "../core/Conn.ts";
import Crypto from "../core/Crypto.ts";
import { MonthInSeconds } from "../core/Types.ts";
import { getCookies } from "../deps.ts";
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
		
		return await conn.sendFail("Invalid API.");
	}
	
	async runLogin(conn: Conn, rawData: { [id: string]: FormDataEntryValue} ) {
		
		console.log("wtf");
		const cookies = getCookies(conn.request);
		console.log(cookies);
		
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
		
		// The password has cleared. Build the necessary tokens.
		// id - the id of the user
		// rand - a random value, assigned when the cookie is set
		// token - a hash of ${rand}.${passHash}
		const rand = Math.random().toString(16).substr(2, 8);
		const token = Crypto.safeHash(`${rand}.${passHash}`, 20);
		
		// Return login cookie.
		conn.cookieSet("login", `${id}.${rand}.${token}`, MonthInSeconds, false);
		
		return await conn.sendJson(`${id}.${rand}.${token}`);
		// return await conn.sendJson(`${id}.${rand}.${token}`);
	}
	
	async runSignUp(conn: Conn, rawData: { [id: string]: FormDataEntryValue} ) {
		rawData.extra = "Received from sign-up.";
		return await conn.sendJson(rawData);
	}
}