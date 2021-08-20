
export const config = {
	serverLocal: {
		// POSSIBLE: Using hostname: "localhost" rejects access because BINDING or some $#!^. Leaving it empty works.
		port: 8080,		// A different port is used on local so we don't conflict with nginx.
		certFile: "",
		keyFile: "",
	},
	server: {
		// POSSIBLE: Using hostname: "localhost" rejects access because BINDING or some $#!^. Leaving it empty works.
		port: 80,
		certFile: "",
		keyFile: "",
	},
	redis: {
		hostname: "127.0.0.1", 		// "96.126.120.19", "127.0.0.1",
		port: 6379,
		password: "",				// "ac7DIqxXjOdwWNh2n9By41",			// Leave empty if we're not using one.
	},
	local: false,
	prod: true,
	debug: {
        logging: false,
        verbose: false,		// Provide extra logging details.
	},
	cookies: {
		password: "amFm3KdMdre_ns6teI2x4o4KjEvmsa0on",
	},
	crypto: {
		rounds: 5,			// Don't change; crypto would be invalid.
		gSalt: "by3VE9uALnZtd2U1t6adNC7XsneD5re0",
		hashKey: "1uEgfzXMYqLQ5X1Ji9DvslSVKhdp37oc",
	},
	objectStore: {
		bucket: "druidis-cdn",
	}
}
