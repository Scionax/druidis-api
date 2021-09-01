import VerboseLog from "./VerboseLog.ts";
import { getCookies } from "../deps.ts";
import { config } from "../config.ts";

export default class Conn {
	
	// Core Values
	public requestEvent: Deno.RequestEvent;
	public request: Request;
	public url: URL;
	
	// URL Segments
	public url1: string;
	public url2: string;
	public url3: string;
	
	// Response
	public errorMessage = "";
	public headers = new Headers({
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json; charset=utf-8",
		"Access-Control-Allow-Headers": "Content-Type",			// Required for CORS Pre-Flight
		"Access-Control-Allow-Credentials": "true",				// Required for CORS Pre-Flight (but is insecure, so need to update)
	});
	
	// User Object
	public userObj = {};
	
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
	
	public error(reason = ""): false {
		this.errorMessage = reason;
		return false;
	}
	
	// return await WebController.sendJson("Path successful!");
	sendJson( jsonObj: unknown ): Response {
		console.log(this.headers);
		return new Response(JSON.stringify({ u: this.userObj, d: jsonObj }), { status: 200, headers: this.headers });
	}
	
	// return await WebController.sendBadRequest("So that error just happened.");
	async sendFail( reason = "Bad Request", status = 400 ): Promise<Response> {
		VerboseLog.verbose(`${this.url.pathname} :: sendFail(): ` + reason );
		return await new Response(`{"error": "${reason}"}`, { status: status, statusText: "Bad Request", headers: this.headers});
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
	cookieSet(name: string, value: string, maxAge: number, httpOnly = true, secure = config.prod) {
		this.headers.append("Set-Cookie", `${name}="${value}"; Max-Age=${maxAge};` + (httpOnly ? " HttpOnly;" : "") + (secure ? " Secure;" : ""));
	}
	
	cookieDelete(name: string) {
		this.headers.append("Set-Cookie", `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT;`);
	}
	
	cookieGetAll() {
		getCookies(this.request);
	}
}
