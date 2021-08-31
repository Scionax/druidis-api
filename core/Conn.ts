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
	public success = true;
	public errorReason = "";
	public headers = new Headers({
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json; charset=utf-8",
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
		this.success = false;
		this.errorReason = reason;
		return false;
	}
	
	// return await WebController.sendJson("Path successful!");
	sendJson( jsonObj: unknown ): Response {
		
		// Probably don't need these, but were used when I was having issues with production. Commented out 8/31/2021.
		// "Access-Control-Allow-Headers": "Content-Type",
		// "Access-Control-Allow-Credentials": "true",
		
		return new Response(JSON.stringify({ u: this.userObj, d: jsonObj }), { status: 200, headers: this.headers });
	}
	
	// return await WebController.sendBadRequest("So that error just happened.");
	async sendFail( reason = "Bad Request", status = 400 ): Promise<Response> {
		VerboseLog.verbose(`${this.url.pathname} :: sendFail(): ` + reason );
		return await new Response(`{"error": "${reason}"}`, { status: status, statusText: "Bad Request", headers: this.headers});
	}
	
	// ----- Cookie Handling ----- //
	
	// maxAge is seconds to expire
	cookieSet(name: string, value: string, maxAge: number, httpOnly = true, secure = config.prod) {
		this.headers.append("Set-Cookie", `${name}=${value}; Max-Age=${maxAge};` + (httpOnly ? " HttpOnly;" : "") + (secure ? " Secure;" : ""));
	}
	
	cookieDelete(name: string) {
		this.headers.append("Set-Cookie", `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT;`);
	}
	
	cookieGetAll() {
		getCookies(this.request);
	}
}
