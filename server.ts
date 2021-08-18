#!/usr/bin/env deno

// deno run --allow-net --allow-write --allow-read --allow-run --allow-env server.ts
// deno run --allow-net --allow-write --allow-read --allow-run --allow-env server.ts -port 8000 -specialOpts needToSetup
// deno test

import { connectRedis } from "./deps.ts";
import { config } from "./config.ts";
import Mapp from "./core/Mapp.ts";
import { Forum } from "./model/Forum.ts";
import WebController from "./controller/WebController.ts";
import ImageMod from "./core/ImageMod.ts";
import PostController from "./controller/PostController.ts";
import DataController from "./controller/DataController.ts";
import VerboseLog from "./core/VerboseLog.ts";
import Conn from "./core/Conn.ts";

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
Mapp.redis = await connectRedis(opts);

// Custom Routing Map
const RouteMap: { [name: string]: WebController } = {
	"post": new PostController(),
	"data": new DataController(),			// API to pull important data, such as Fixed Forum Data.
	// Retrieve Post Data for Forum
	// "u": new UserController(),				// "u" stands for "user"
	// "f": new ForumController(),				// "f" stands for "forum"
	// "g": new GroupController(),				// "g" stands for "group"
};

// Initializations
Forum.initialize();
ImageMod.initialize();

// // Load AWS
// import { ApiFactory } from './deps.ts';
// import { S3 } from './deps.ts';
// const factory = new ApiFactory( {credentials: {awsAccessKeyId: "WWLE1X0S4AYDF2169E2F", awsSecretKey: "AcPm37JBJ56euHgo49NFQlneoj9bpttJUGKlpEDY" }, region: "us-east-1"})
// var a = await factory.determineCurrentRegion();
// console.info(a);
// var b = await factory.buildServiceClient({a});
// const s3 = new S3(factory)

// console.log(await s3.listBuckets().catch(err => err));

// $client = new S3Client([
//     'region' => '',
//     'version' => '2006-03-01',
//     'endpoint' => $ENDPOINT,
//     'credentials' => [
//         'key' => AWS_KEY,
//         'secret' => AWS_SECRET_KEY
//     ],
//     // Set the S3 class to use objects.dreamhost.com/bucket
//     // instead of bucket.objects.dreamhost.com
//     'use_path_style_endpoint' => true
// ]);

// const result = await s3.getBucketAcl({ "Bucket": "druidis-api" });

// const identity = await factory.ensureCredentialsAvailable();
// console.log('identity');
// console.log(identity);
// console.log('You are', identity.UserId, 'in account', identity.Account);
// console.log('Identity ARN:', identity.Arn);


// Server Routing
async function handle(conn: Deno.Conn) {
	const httpConn = Deno.serveHttp(conn);
	
	for await (const requestEvent of httpConn) {
		const conn = new Conn(requestEvent);
		
		// Launch an associated Route Map, if found (such as 'api')
		if(RouteMap[conn.url1]) {
			await requestEvent.respondWith(RouteMap[conn.url1].runHandler(conn));
		}
		
		// No API Found
		else {
			await requestEvent.respondWith(
				new Response("404 - Request Not Found", { status: 404 })
			);
		}
	}
}

// Run Server
const serv = config.local ? config.serverLocal : config.server;
console.log("Launching Server on Port " + serv.port + ".")

if(serv.certFile && serv.keyFile) {
	const server = Deno.listenTls({
		port: serv.port,
		certFile: serv.certFile,
		keyFile: serv.keyFile,
		// alpnProtocols: ["h2", "http/1.1"],
	})
	for await (const conn of server) { handle(conn); }
} else {
	const server = Deno.listen({ port: serv.port });
	for await (const conn of server) { handle(conn); }
}
