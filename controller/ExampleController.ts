import WebController from "./WebController.ts";

export default class ExampleController extends WebController {
	
	async runHandler(requestEvent: Deno.RequestEvent, url: URL, urlSegments: Array<string>): Promise<Response> {
		
		if(requestEvent.request.method == "GET") {
			return await this.getController(urlSegments);
		}
		
		return await WebController.invalidMethod();
	}
	
	async getController(urlSegments: Array<string>): Promise<Response> {
		
		if(urlSegments.length > 1 && urlSegments[1] == "Test") {
			return await WebController.sendJson("Handling /Test");
		}
		
		return await WebController.sendJson("Path successful!");
	}
}