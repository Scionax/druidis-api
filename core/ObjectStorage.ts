import { S3 } from "../deps.ts";

/*
	For ObjectStorage to work, make sure the appropriate environment variables were set.
	
	C:\> setx AWS_REGION us-east-1					// For Windows
	$ export AWS_REGION=us-east-1					// For Linux
*/

export default abstract class ObjectStorage {
	static s3: S3;
	
	// Connect to AWS
	// https://github.com/christophgysin/aws-sdk-js-v3
	// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
	static connectToS3() {
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
		Buckets.forEach(bucket => console.log(bucket.Name));
	}
}
