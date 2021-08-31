import VerboseLog from "./VerboseLog.ts";
import { getCookies, setCookie, deleteCookie } from "../deps.ts";
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
		return new Response(JSON.stringify({ u: this.userObj, d: jsonObj }), { status: 200, headers: {
			"Access-Control-Allow-Origin": "*",
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Credentials": "true",
		}});
	}
	
	// return await WebController.sendBadRequest("So that error just happened.");
	async sendFail( reason = "Bad Request", status = 400 ): Promise<Response> {
		VerboseLog.verbose(`${this.url.pathname} :: sendFail(): ` + reason );
		return await new Response(`{"error": "${reason}"}`, {
			status: status,
			statusText: "Bad Request",
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Content-Type": "application/json; charset=utf-8",
		}});
	}
	
	// ----- Cookie Handling ----- //
	
	cookieSet(cookieName: string, value: string) {
		// setCookie(response, {name: cookieName, value: value, httpOnly: true, secure: config.prod, maxAge: 1000 * 3600 * 24 * 365 });
	}
	
	cookieDelete(cookieName: string) {
		// deleteCookie(response, cookieName);
	}
	
	cookieGetAll() {
		getCookies(this.request);
	}
}
