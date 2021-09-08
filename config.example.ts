
Deno.env.set("AWS_ACCESS_KEY_ID", "WWLE1X0S4AYDF2169E2F");
// Deno.env.set("AWS_SECRET_ACCESS_KEY", "SECRET_HERE");
Deno.env.set("AWS_DEFAULT_REGION", "us-east-1");
Deno.env.set("AWS_REGION", "us-east-1");

export const config = {
	serverLocal: {
		// POSSIBLE: Using hostname: "localhost" rejects access because BINDING or some $#!^. Leaving it empty works.
		port: 8080,		// A different port is used on local so we don't conflict with nginx.
		certFile: "",
		keyFile: "",
	},
	server: {
		// POSSIBLE: Using hostname: "localhost" rejects access because BINDING or some $#!^. Leaving it empty works.
		port: 443,
		certFile: "/etc/letsencrypt/live/api.druidis.org/fullchain.pem",
		keyFile: "/etc/letsencrypt/live/api.druidis.org/privkey.pem",
	},
	redis: {
		hostname: "127.0.0.1", 		// "96.126.120.19", "127.0.0.1",
		port: 6379,
		password: "",				// See "server-setup" document for password.
	},
	local: false,
	prod: true,
	debug: {
        logging: false,
        verbose: false,		// Provide extra logging details.
	},
	objectStore: {
		bucket: "druidis-cdn",
	}
}
