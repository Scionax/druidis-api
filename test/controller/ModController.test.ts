import ModController from "../../controller/ModController.ts";
import Conn from "../../core/Conn.ts";
import RedisDB from "../../core/RedisDB.ts";
import { assert } from "../../deps.ts";

await RedisDB.connect(); // Connect To Redis
const modController = new ModController();

Deno.test("Run /mod/reports", async () => {
	
	const request = Conn.createGetRequest("http://localhost/mod/reports?count=2");
	const conn = new Conn(request);
	
	await modController.getController(conn);
	
	const jsonObj = JSON.parse(conn.responseText) as Array<Record<string, unknown>> || [];
	
	assert(conn.url1 === "mod", `Issue with 'conn.url1' parsing when testing /mod/reports.`);
	assert(conn.url2 === "reports", `Issue with 'conn.url2' parsing when testing /mod/reports.`);
	assert(conn.status === 200, `/mod/reports failed to return a status 200.`);
	assert(typeof jsonObj === "object", `/mod/reports returned an invalid object.`);
	assert(jsonObj.length === 2, `/mod/reports?count=2 returned fewer than 2 results.`);
	assert(Number(jsonObj[0].modId) > 0, `/mod/reports returned an invalid modId.`);
	assert(Number(jsonObj[0].userId) > 0, `/mod/reports returned an invalid userId.`);
	assert(Number(jsonObj[0].time) > 0, `/mod/reports returned an invalid time.`);
	assert(typeof jsonObj[0].reason === "string", `/mod/reports returned an invalid reason.`);
	assert((jsonObj[0].reason as string).length > 0, `/mod/reports returned an empty reason.`);
});

Deno.test("Run /mod/actions", async () => {
	
	const request = Conn.createGetRequest("http://localhost/mod/actions?count=2");
	const conn = new Conn(request);
	
	await modController.getController(conn);
	
	const jsonObj = JSON.parse(conn.responseText) as Array<Record<string, unknown>> || [];
	
	assert(conn.url1 === "mod", `Issue with 'conn.url1' parsing when testing /mod/actions.`);
	assert(conn.url2 === "actions", `Issue with 'conn.url2' parsing when testing /mod/actions.`);
	assert(conn.status === 200, `/mod/actions failed to return a status 200.`);
	assert(typeof jsonObj === "object", `/mod/actions returned an invalid object.`);
	assert(jsonObj.length === 2, `/mod/actions?count=2 returned fewer than 2 results.`);
	assert(Number(jsonObj[0].modId) > 0, `/mod/actions returned an invalid modId.`);
	assert(Number(jsonObj[0].userId) > 0, `/mod/actions returned an invalid userId.`);
	assert(Number(jsonObj[0].time) > 0, `/mod/actions returned an invalid time.`);
	assert(typeof jsonObj[0].reason === "string", `/mod/actions returned an invalid reason.`);
	assert((jsonObj[0].reason as string).length > 0, `/mod/actions returned an empty reason.`);
});
