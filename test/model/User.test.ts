import { config } from "../../config.ts";
import RedisDB from "../../core/RedisDB.ts";
import { assert } from "../../deps.ts";
import { User } from "../../model/User.ts";

await RedisDB.connect(); // Connect To Redis

const userData = {
	handle: "_TestAcct__829",
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

Deno.test("Check if user can be created.", async () => {
	const canCreate = await User.canCreateUser(userData.handle, userData.password, userData.email, userProfile);
	assert(canCreate === "", `Failed to create user: ${canCreate}.`);
});

Deno.test("Check Local Druidis User.", async() => {
	if(config.prod) { return; } // Don't test this on production.
	
	const origUsername = "Druidis";
	const origPassword = "password";
	
	const id = await User.getId(origUsername);
	assert(id === 1, `Unable to retrieve ${origUsername} account.`);
	
	const username = await User.getUsername(id);
	assert(username === origUsername, `Unable to locate ${origUsername} account by ID.`);
	
	const usernameExists = await User.usernameExists(username);
	assert(usernameExists, `User.usernameExists("${username}") did not correctly identify "${username}".`);
	
	const idExists = await User.idExists(id);
	assert(idExists, `User.idExists("${id}") did not correctly identify "${id}" (the ${username} account).`);
	
	const password = await User.getPassword(id);
	assert(password.length > 10, `Failed to retrieve password for ${origUsername} account.`);
	
	const isCorrect = await User.isCorrectPassword(id, origPassword);
	assert(isCorrect, `Password (${origPassword}) was incorrect.`);
	
	const profile = await User.getProfile(id);
	assert(profile.email && profile.email.length > 0, `${username} should have an email tracked in their profile.`);
});

Deno.test("Verify that cookie tokens work.", async () => {
	if(config.prod) { return; } // Don't test this on production.
	
	const origUsername = "Druidis";
	const id = await User.getId(origUsername);
	
	const token = await User.getToken(id, true);
	assert(token.length > 0, `${origUsername} does not have a valid token assigned.`);
	
	const verified = await User.verifyLoginCookie(`${id}.${token}`);
	assert(verified === id, `Unable to verify the login cookie for ID ${id}.`);
});








