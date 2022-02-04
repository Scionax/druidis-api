#!/usr/bin/env deno

// deno run --unstable --allow-net --allow-write --allow-read --allow-run --allow-env server.ts
// deno run --unstable --allow-net --allow-write --allow-read --allow-run --allow-env server.ts -port 8000 -specialOpts needToSetup
// deno test --unstable --allow-net --allow-write --allow-read --allow-run --allow-env

import { log } from "./deps.ts";
import { config } from "./config.ts";
import { Forum } from "./model/Forum.ts";
import WebController from "./controller/WebController.ts";
import ImageMod from "./core/ImageMod.ts";
import PostController from "./controller/PostController.ts";
import DataController from "./controller/DataController.ts";
import Conn from "./core/Conn.ts";
import ServerSetup from "./core/ServerSetup.ts";
import ForumController from "./controller/ForumController.ts";
import Playground from "./playground.ts";
import UserController from "./controller/UserController.ts";
import { Feed } from "./model/Feed.ts";
import FeedController from "./controller/FeedController.ts";
import ServerMechanics from "./core/ServerMechanics.ts";
import RedisDB from "./core/RedisDB.ts";
import AdminController from "./controller/AdminController.ts";
import ObjectStorage from "./core/ObjectStorage.ts";

// Handle Setup Arguments
// for( let i = 0; i < Deno.args.length; i++ ) {
// 	const arg = Deno.args[i];
// }

// Prepare Server
await RedisDB.connect(); // Connect To Redis
await ServerMechanics.setupLogger(); // Logging Handler (saves to log.txt)

// Custom Routing Map
const RouteMap: { [name: string]: WebController } = {
	"post": new PostController(),
	"data": new DataController(),			// API to pull important data, such as Fixed Forum Data.
	"feed": new FeedController(),
	"forum": new ForumController(),
	"user": new UserController(),
	"admin": new AdminController(),
};

// Initializations
Forum.initialize();
ImageMod.initialize();
ObjectStorage.setup();		// Connect to CDN

// Run Initialization for Exclusively Local Server
if(config.local) {
	ServerSetup.initialize().then(() => {
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
				log.error(error);
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
// ServerMechanics.handleSignals();

// Launch Periodic Runner
// This will asynchronously run periodic / scheduled updates: rebuilding feeds, purging old data, etc.
ServerMechanics.runScheduledUpdates();

// Run Playground
Playground.runOnServerLoad();

// Run Server
const serv = config.local ? config.serverLocal : config.server;
log.info("Launching Server on Port " + serv.port + ".")

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
