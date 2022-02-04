import Crypto from "../../core/Crypto.ts";
import { assert } from "../../deps.ts";

Deno.test("Verify Crypto.safeHash", async () => {
	console.log(await Crypto.safeHash("password", 32));
	assert(await Crypto.safeHash("password", 32) === "6adUhnNqVQr0/qhh4jeDBcSlVaBQlN7h", `Crypto.safeHash fails to match 'password'.`);
	assert(await Crypto.safeHash("password") === "6adUhnNqVQr0/qhh4jeDBcSlVaBQlN7h", `Crypto.safeHash default length changed. Must update.`);
});

Deno.test("Verify Crypto.simpleHash()", async () => {
	assert(await Crypto.simpleHash("password", 4) === "3MO1", `Crypto.simpleHash fails to match 'password'.`);
	assert(await Crypto.simpleHash("password", 16) === "3MO1qnZdYdgyfeuI", `Crypto.simpleHash fails to match 'password' of length 16.`);
});

Deno.test("Verify Crypto.convertToReadableHash()", () => {
	assert(Crypto.convertToReadableHash("6adUhnNqVQr0/qhh4jeDBcSlVaBQlN7h") === "GADVHNNQVQROQHHYJEDBCSLVABQLNRH", `Crypto.simpleHash fails to match 'password'.`);
});
