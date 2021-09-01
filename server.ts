#!/usr/bin/env deno

// deno run --allow-net --allow-write --allow-read --allow-run --allow-env --unstable server.ts
// deno run --allow-net --allow-write --allow-read --allow-run --allow-env --unstable server.ts -port 8000 -specialOpts needToSetup
// deno test

import { connectRedis } from "./deps.ts";
import { config } from "./config.ts";
import Mapp from "./core/Mapp.ts";
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
	Mapp.redis = await connectRedis(opts);
} catch (error) {
	console.error(error);
}

// Custom Routing Map
const RouteMap: { [name: string]: WebController } = {
	"post": new PostController(),
	"data": new DataController(),			// API to pull important data, such as Fixed Forum Data.
	"forum": new ForumController(),
	"user": new UserController(),
};

// Initializations
Forum.initialize();
ImageMod.initialize();
ObjectStorage.connectToS3();		// Connect to AWS

// Run Initialization for Exclusively Local Server
if(config.local) { LocalServer.initialize(); }

// Server Routing
async function handle(conn: Deno.Conn) {
	const httpConn = Deno.serveHttp(conn);
	
	for await (const requestEvent of httpConn) {
		const conn = new Conn(requestEvent);
		
		console.log("Made a connection", Math.random());
		
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
