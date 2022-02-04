import { log } from "../deps.ts";	// MUST ADD ", S3" to return AWS features
import { config } from "../config.ts";

export default abstract class ObjectStorage {
	
	static awsBucket = "";
	static serverRoot: string;			// http://localhost/
	static imageRoot: string;			// public/images/
	static uploadRoot: string;			// The endpoint to upload with: e.g. 'upload'
	
	static setup() {
		
		// Use AWS S3 CDN
		if(config.objectStore.useAWS) {
			log.critical("Requirements for AWS S3 have not been met.");
			ObjectStorage.awsBucket = config.objectStore.bucket;
			return;
		}
		
		// Use Druidis CDN
		ObjectStorage.serverRoot = (config.local ? "http://localhost/" : "http://cdn.druidis.org");
		ObjectStorage.imageRoot = ObjectStorage.serverRoot + "public/images/";
		ObjectStorage.uploadRoot = ObjectStorage.serverRoot + "upload";
	}
	
	// ObjectStorage.save("forum", "image-1-CDJF.webp", imageData, "image/webp")
	static async save(folder: string, file: string, data: string | Blob | Uint8Array, contentType: string) {	
		const fullPath: string = folder + "/" + file;
		console.log(data, contentType);
		return await fullPath;
	}
}

/*
	AWS S3 Object Storage
	
	For ObjectStorage to work, make sure the appropriate environment variables are set.
	
	C:\> setx AWS_REGION us-east-1					// For Windows
	$ export AWS_REGION=us-east-1					// For Linux
*/

// AWS SDK is currently broken for Deno.
	// It's this bug: https://github.com/christophgysin/aws-sdk-js-v3/issues/30
	// See relevant code: https://deno.land/x/aws_sdk@v3.32.0-1/client-s3/S3Client.ts:695:11
/*
export abstract class ObjectStorage {
	static s3: S3;
	
	// Connect to AWS
	// https://github.com/christophgysin/aws-sdk-js-v3
	// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
	static setup() {
		ObjectStorage.s3 = new S3({
			region: Deno.env.get('AWS_REGION'),
			credentials: {
				accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
				secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
			},
			endpoint: `https://${Deno.env.get("AWS_ACCESS_KEY_ID")}@us-east-1.linodeobjects.com`,
		});
		
		// ObjectStorage.s3.getObject()
	}
	
	// ObjectStorage.putObject("druidis-cdn", "forum/image-1-CDJF.webp", imageData, "image/webp")
	static async putObject(bucket: string, key: string, data: string | Blob | Uint8Array | undefined, contentType: string) {	
		return await ObjectStorage.s3.putObject({Bucket: bucket, Key: key, Body: data, ACL: "public-read", ContentType: contentType});		// ContentEncoding: "", ContentType: ""
	}
	
	// List Bucket Example
	static async listBuckets() {
		const { Buckets = [] } = await ObjectStorage.s3.listBuckets({});
		Buckets.forEach(bucket => log.info(bucket.Name));
	}
}
*/