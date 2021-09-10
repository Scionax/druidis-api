export { assert, assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

// Redis
export { connect as connectRedis } from "https://deno.land/x/redis@v0.23.1/mod.ts";
export type { Redis } from "https://deno.land/x/redis@v0.23.1/mod.ts";

// Pipelines must cast to RedisReply[], and extract the value AS STRING from the value() function
// const replies = await pl.flush() as RedisReply[];
// console.log(replies[0].value() as string);
export type { RedisReply } from "https://deno.land/x/redis@v0.23.1/protocol/mod.ts";

// Crypto
export { createHash } from "https://deno.land/std@0.106.0/hash/mod.ts";

// File Systems
export { Buffer } from "https://deno.land/std@0.101.0/io/buffer.ts";
export { join } from "https://deno.land/std@0.103.0/path/posix.ts";
export { ensureDir } from "https://deno.land/std@0.103.0/fs/ensure_dir.ts";
export { exists } from "https://deno.land/std@0.104.0/fs/exists.ts";

// Logger
export * as log from "https://deno.land/std@0.106.0/log/mod.ts";

// Save Path
export * as path from "https://deno.land/std@0.104.0/path/mod.ts";

// HTML Parsing
export { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.13-alpha/deno-dom-wasm.ts";

// AWS
export { S3 } from "https://deno.land/x/aws_sdk@v3.23.0-1/client-s3/S3.ts";

// OS Signals
export { signal, onSignal } from "https://deno.land/std@0.106.0/signal/mod.ts";