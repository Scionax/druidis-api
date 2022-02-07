import { config } from "../config.ts";
import { User } from "../model/User.ts";
import { log } from "../deps.ts";

export default class Conn {
	
	// Request Values
	public readonly request: Request;
	
	// URL Segments
	public readonly url: URL;
	public readonly url1: string;
	public readonly url2: string;
	public readonly url3: string;
	
	// Login Data
	public id = 0;					// The user's ID
	
	// Header Notes
	// "Access-Control-Allow-Origin": "*",						// Required for CORS (but is insecure, so need to update)
	// "Access-Control-Allow-Headers": "Content-Type",			// Required for CORS Pre-Flight
	// "Access-Control-Allow-Credentials": "true",				// Required for CORS Pre-Flight (but is insecure, so need to update)
	
	constructor(request: Request) {
		this.request = request;
		this.url = new URL(request.url);
		const seg = decodeURI(this.url.pathname).split("/");		// e.g. ["", "api", "post"]
		this.url1 = seg.length >= 2 ? seg[1] : "";
		this.url2 = seg.length >= 3 ? seg[2] : "";
		this.url3 = seg.length >= 4 ? seg[3] : "";
	}
	
	// ----- Create Testing Connection ----- //
	
	/*
		// Example of creating a GET test connection:
		const request = Conn.createGetRequest("http://localhost/api/somePath");
		const conn = new Conn(request);
	*/
	
	// const request = Conn.createGetRequest("http://localhost/api/somePath");
	static createGetRequest(urlPath: string) {
		const reqInit: RequestInit = {
			"cache": "no-cache",
			"credentials": "same-origin",
			"method": "GET",
			"redirect": "follow",
			"headers": {
				"content-type": "application/json",
			}
		};
		return new Request(urlPath, reqInit);
	}
	
	// const postBody = { "message": "Hello World!"; }
	// const request = Conn.createPostRequest("http://localhost/api/somePath", postContents);
	static createPostRequest(urlPath: string, postBody: Record<string, string>) {
		const reqInit: RequestInit = {
			"body": JSON.stringify(postBody),
			"cache": "no-cache",
			"credentials": "same-origin",
			"method": "POST",
			"redirect": "follow",
			"headers": {
				"content-type": "application/json",
			}
		};
		return new Request(urlPath, reqInit);
	}
	
	// ----- API Response Types ----- //
	
	// return conn.sendHTML("<div>Some Page!</div>");
	sendHTML( html: string ): Response {
		return new Response(html, { status: 200, headers: {
			"Content-Type": "text/html; charset=utf-8",
		}});
	}
	
	// return conn.sendJSON("Path successful!");
	sendJSON( jsonObj: unknown ): Response {
		return new Response(JSON.stringify(jsonObj), { status: 200, headers: {
			"Content-Type": "application/json; charset=utf-8",
		}});
	}
	
	// return conn.sendCustom("Some Data", 200, {"Content-Type": "text/html; charset=utf-8"}, true);
	sendCustom( content: unknown, status: number, headers: Headers, isJson = true ): Response {
		if(isJson) { return new Response(JSON.stringify(content), { status: status, headers }); }
		return new Response(content as string, { status: status, headers });
	}
	
	// return conn.badRequest("So that error just happened.");
	badRequest( reason = "Bad Request", status = 400 ): Response {
		if(config.local) { log.debug(`${this.url.pathname} :: Bad Request: ${reason}`); }
		return new Response(`{"error": "${reason}"}`, {
			status: status,
			statusText: reason,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
		}});
	}
	
	// return conn.notFound("<div>Some Page!</div>");
	notFound(): Response {
		if(config.local) { log.debug(`${this.url.pathname} :: 404 Not Found`); }
		return new Response(`{"error": "404 Page Not Found"}`, { status: 404, headers: {
			"Content-Type": "text/html; charset=utf-8",
		}});
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
	
	// ------------------------- //
	// ----- API Post Data ----- //
	// ------------------------- //
	
	async getPostData(): Promise<Response|{ [id: string]: FormDataEntryValue; }> {
		
		// Verify Correct Content-Type
		const contentType = this.request.headers.get("content-type");
		
		if(!contentType) {
			return this.badRequest("Invalid 'Content-Type' Header");
		}
		
		// Handle JSON data.
		if(contentType.includes("application/json")) {
			try {
				return await this.request.json();
			} catch {
				return this.badRequest("Improperly Formatted JSON Object");
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
				return this.badRequest("Invalid Form Data");
			}
		}
		
		return {};
	}
	
	// ----- Cookie Handling ----- //
	
	// maxAge is seconds to expire
	// const headers = new Headers({"Content-Type": "application/json; charset=utf-8"});
	// conn.cookieSet(headers, "login", `${id}.${token}`, MonthInSeconds);
	cookieSet(headers: Headers, name: string, value: string, maxAge: number, secure = config.prod, httpOnly = false, path = "/") {
		headers.append("Set-Cookie", `${name}=${value}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax;` + (httpOnly ? " HttpOnly;" : "") + (secure ? " Secure;" : ""));
	}
	
	// const headers = new Headers({"Content-Type": "application/json; charset=utf-8"});
	// conn.cookieDelete(headers, "login");
	cookieDelete(headers: Headers, name: string, path = "/") {
		headers.append("Set-Cookie", `${name}=deleted; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`);
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
