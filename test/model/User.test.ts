import { config } from "../../config.ts";
import { assert } from "../../deps.ts";
import { User } from "../../model/User.ts";

const userData = {
	handle: "TestAccount",
	password: "testPassword",
	email: "example@email.com",
};

const userProfile = {
	email: userData.email,
	firstName: "Joe",
	lastName: "Smith",
	country: "United States",
	state: "Florida",
	city: "Miami",
	zip: "55555",
	dobYear: 1985,
	dobMonth: 4,
	dobDay: 22,
	website: "http://example.com",
};

Deno.test("Create and verify User.", async () => {
	
	// Don't test this on production.
	if(!config.local) { return; }
	
	const canCreate = await User.canCreateUser(userData.handle, userData.password, userData.email, userProfile);
	
	// Verify basic properties
	assert(canCreate === "", `Should be able to create user.`);
	
});
