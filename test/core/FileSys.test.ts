import FileSys from "../../core/FileSys.ts";
import { assert } from "../../deps.ts";

Deno.test("Verify FileSys.exists()", async () => {
	assert(await FileSys.exists("log.txt"), `FileSys.exists fails to locate log.txt.`);
	assert(await FileSys.exists("deps.ts"), `FileSys.exists fails to locate deps.ts.`);
	assert(await FileSys.exists("./model/User.ts"), `FileSys.exists fails to locate ./model/User.ts.`);
	assert(await FileSys.exists("blah.doesnt.exist") === false, `FileSys.exists incorrectly located blah.doesnt.exist.`);
});
