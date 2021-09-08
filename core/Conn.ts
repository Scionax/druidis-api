import { config } from "../config.ts";
import { User } from "../model/User.ts";
import { log } from "../deps.ts";

export default class Conn {
	
	// Core Values
	public requestEvent: Deno.RequestEvent;
	public request: Request;
	public url: URL;
	
	// URL Segments
	public url1: string;
	public url2: string;
	public url3: string;
	
	// Login Data
	public id = 0;			// The user's ID
	
	// Response
	public errorMessage = "";
	public headers = new Headers({
		"Content-Type": "application/json; charset=utf-8",
		// "Access-Control-Allow-Origin": "*",						// Required for CORS (but is insecure, so need to update)
		// "Access-Control-Allow-Headers": "Content-Type",			// Required for CORS Pre-Flight
		// "Access-Control-Allow-Credentials": "true",				// Required for CORS Pre-Flight (but is insecure, so need to update)
	});
	
	constructor(requestEvent: Deno.RequestEvent) {
		this.requestEvent = requestEvent;
		this.request = this.requestEvent.request;
		this.url = new URL(requestEvent.request.url);
		
		// Prepare URL Segments
		const seg = decodeURI(this.url.pathname).split("/");		// e.g. ["", "api", "post"]
		this.url1 = seg.length >= 2 ? seg[1] : "";
		this.url2 = seg.length >= 3 ? seg[2] : "";
		this.url3 = seg.length >= 4 ? seg[3] : "";
	}
	
	error(reason = ""): false {
		this.errorMessage = reason;
		return false;
	}
	
	// ----- Process Active Users ----- //
	
	async processActiveUser() {
		
		// Get the 'login' cookie from User, if applicable.
		const cookies = this.cookieGet();
		if(!cookies.login) { return; }
		
		// Verify that the 'login' cookie is valid. Assign an ID if so.
		this.id = await User.verifyLoginCookie(cookies.login);
		if(!this.id) { return; }
	}
	
	// ------------------------ //
	// ----- API Response ----- //
	// ------------------------ //
	
	// return await WebController.sendJson("Path successful!");
	sendJson( jsonObj: unknown ): Response {
		return new Response(JSON.stringify(jsonObj), { status: 200, headers: this.headers });
	}
	
	// return await WebController.sendBadRequest("So that error just happened.");
	sendFail( reason = "Bad Request", status = 400 ): Response {
		log.debug(`${this.url.pathname} :: sendFail(): ${reason}`);
		return new Response(`{"error": "${reason}"}`, { status: status, statusText: "Bad Request", headers: this.headers});
	}
	
	// ------------------------- //
	// ----- API Post Data ----- //
	// ------------------------- //
	
	async getPostData(): Promise<{ [id: string]: FormDataEntryValue }> {
		
		// Verify Correct Content-Type
		const contentType = this.request.headers.get("content-type");
		
		if(!contentType) {
			this.error("Invalid 'Content-Type' Header");
			return {};
		}
		
		// Handle JSON data.
		if(contentType.includes("application/json")) {
			try {
				return await this.request.json();
			} catch {
				this.error("Improperly Formatted JSON Object");
				return {};
			}
		}
		
		// Handle Form Data
		else if(contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
			try {
				const reqData = await this.request.formData();
				const formData: { [id: string]: FormDataEntryValue } = {};
				for (const [key, value] of reqData.entries()) {
					formData[key] = value;
				}
				return formData;
			} catch {
				this.error("Invalid Form Data");
				return {};
			}
		}
		
		return {};
	}
	
	// ----- Cookie Handling ----- //
	
	// maxAge is seconds to expire
	cookieSet(name: string, value: string, maxAge: number, secure = config.prod, httpOnly = false, path = "/") {
		this.headers.append("Set-Cookie", `${name}=${value}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax;` + (httpOnly ? " HttpOnly;" : "") + (secure ? " Secure;" : ""));
	}
	
	cookieDelete(name: string, path = "/") {
		this.headers.append("Set-Cookie", `${name}=deleted; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`);
	}
	
	cookieGet(): Record<string, string> {
		const cookie = this.request.headers.get("cookie");
		if (cookie != null) {
			const out: Record<string, string> = {};
			const c = cookie.split(";");
			for (const kv of c) {
				const [cookieKey, ...cookieVal] = kv.split("=");
				if(cookieKey != null) {
					const key = cookieKey.trim();
					out[key] = cookieVal.join("=");
				}
			}
			return out;
		}
		return {};
	}
}
