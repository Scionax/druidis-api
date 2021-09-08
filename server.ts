#!/usr/bin/env deno

// deno run --allow-net --allow-write --allow-read --allow-run --allow-env --unstable server.ts
// deno run --allow-net --allow-write --allow-read --allow-run --allow-env --unstable server.ts -port 8000 -specialOpts needToSetup
// deno test

import { connectRedis, log } from "./deps.ts";
import { config } from "./config.ts";
import { Forum } from "./model/Forum.ts";
import WebController from "./controller/WebController.ts";
import ImageMod from "./core/ImageMod.ts";
import PostController from "./controller/PostController.ts";
import DataController from "./controller/DataController.ts";
import Conn from "./core/Conn.ts";
import ObjectStorage from "./core/ObjectStorage.ts";
import LocalServer from "./core/LocalServer.ts";
import ForumController from "./controller/ForumController.ts";
import Playground from "./playground.ts";
import UserController from "./controller/UserController.ts";
import { Feed } from "./model/Feed.ts";
import FeedController from "./controller/FeedController.ts";
import ServerMechanics from "./core/ServerMechanics.ts";
import RedisDB from "./core/RedisDB.ts";

// Handle Setup Arguments
// for( let i = 0; i < Deno.args.length; i++ ) {
// 	const arg = Deno.args[i];
// }

// Connect To Redis
const opts: { hostname: string, port: number, password?: string, tls?: boolean, name?: string } = {
	hostname: config.redis.hostname,
	port: config.redis.port,
	// tls: boolean, // If using TLS
	// name: string
};

if(config.redis.password) { opts.password = config.redis.password; }

try {
	RedisDB.db = await connectRedis(opts);
} catch (error) {
	console.error(error);
}

// Custom Routing Map
const RouteMap: { [name: string]: WebController } = {
	"post": new PostController(),
	"data": new DataController(),			// API to pull important data, such as Fixed Forum Data.
	"feed": new FeedController(),
	"forum": new ForumController(),
	"user": new UserController(),
};

// Initializations
Forum.initialize();
ImageMod.initialize();
ObjectStorage.connectToS3();		// Connect to AWS

// Run Initialization for Exclusively Local Server
if(config.local) {
	LocalServer.initialize().then(() => {
		Feed.initialize(); // Needs LocalServer.initialize() to have Posts available.
	});
}

// Build Feed Indexes (Asynchronous)
else {
	Feed.initialize();
}

// Server Routing
async function handle(conn: Deno.Conn) {
	const httpConn = Deno.serveHttp(conn);
	
	for await (const requestEvent of httpConn) {
		const conn = new Conn(requestEvent);
		
		// Run the login / processing user step:
		await conn.processActiveUser();
		
		// Launch an associated Route Map, if found (such as 'api')
		if(RouteMap[conn.url1]) {
			try {
				await requestEvent.respondWith(RouteMap[conn.url1].runHandler(conn));
			} catch (error) {
				console.error(error);
				await requestEvent.respondWith( new Response("Internal issue with service.", { status: 400 }) );
			}
		}
		
		// No API Found
		else {
			await requestEvent.respondWith( new Response("404 - Request Not Found", { status: 404 }) );
		}
	}
}

// Handle Termination Signals
// if(Deno.build.os === "linux") {
	
// 	const sig = signal(
// 		Deno.Signal.SIGINT,			// Interrupt: Control + C
// 		Deno.Signal.SIGTERM,		// Standard 'kill' termination
// 		Deno.Signal.SIGQUIT,		// Modified kill, generally designed to dump output.
// 		// Deno.Signal.SIGUSR1,		// Custom User Signal
// 	);
	
// 	// If a termination signal is detected, run our graceful exit:
// 	for await (const _ of sig) {
// 		ServerMechanics.gracefulExit();
// 	}
// }

// Logging Handler - Saves "warnings" or higher in log.txt
//		log.debug("Standard debug message. Won't get logged in a file.");
//		log.warning(true);
//		log.error({ foo: "bar", fizz: "bazz" });
//		log.critical("500 Internal Server Error");
await log.setup({
	handlers: {
		console: new log.handlers.ConsoleHandler("DEBUG"),
		file: new log.handlers.FileHandler("WARNING", {
			filename: "./log.txt",
			formatter: "{levelName} {msg}",
		}),
	},
	
	loggers: {
		default: { level: "DEBUG", handlers: ["console", "file"] },
	},
});

// Launch Periodic Runner
// This will asynchronously run periodic / scheduled updates: rebuilding feeds, purging old data, etc.
ServerMechanics.runScheduledUpdates();

// Run Playground
Playground.runOnServerLoad();

// Run Server
const serv = config.local ? config.serverLocal : config.server;
console.log("Launching Server on Port " + serv.port + ".")

if(serv.certFile && serv.keyFile) {
	const server = Deno.listenTls({
		port: serv.port, certFile: serv.certFile, keyFile: serv.keyFile,
		// alpnProtocols: ["h2", "http/1.1"]
	});
	for await (const conn of server) { handle(conn); }
} else {
	const server = Deno.listen({ port: serv.port });
	for await (const conn of server) { handle(conn); }
}
