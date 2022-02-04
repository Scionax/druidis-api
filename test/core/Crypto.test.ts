import Crypto from "../../core/Crypto.ts";
import { assert } from "../../deps.ts";

Deno.test("Verify Crypto.safeHash", async () => {
	assert(await Crypto.safeHash("password", 32) === "sQnzu7wkTrgkQZF+0G1hi5AI3Qmzvv0b", `Crypto.safeHash fails to match 'password'.`);
	assert(await Crypto.safeHash("password") === "sQnzu7wkTrgkQZF+0G1hi5AI3Qmzvv0b", `Crypto.safeHash default length changed. Must update.`);
});

Deno.test("Verify Crypto.simpleHash()", async () => {
	assert(await Crypto.simpleHash("password", 4) === "ph5M", `Crypto.simpleHash fails to match 'password'.`);
	assert(await Crypto.simpleHash("password", 16) === "ph5Mm5Pz8GgiULbP", `Crypto.simpleHash fails to match 'password' of length 16.`);
});

Deno.test("Verify Crypto.convertToReadableHash()", () => {
	assert(Crypto.convertToReadableHash("6adUhnNqVQr0/qhh4jeDBcSlVaBQlN7h") === "GADVHNNQVQROQHHYJEDBCSLVABQLNRH", `Crypto.simpleHash fails to match 'password'.`);
});
