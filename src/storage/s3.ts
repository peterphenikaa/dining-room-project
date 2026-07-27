import {
    CreateBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { minioConfig, minioInternalEndpoint, minioPublicBaseUrl } from "../config/env";

const bucket = minioConfig.bucket;

export const s3 = new S3Client({
    region: minioConfig.region,
    endpoint: minioInternalEndpoint(),
    forcePathStyle: true,
    credentials: {
        accessKeyId: minioConfig.accessKey,
        secretAccessKey: minioConfig.secretKey,
    },
});

export function getBucket() {
    return bucket;
}

/** Public URL (bucket policy PublicRead) — không phải presigned. */
export function publicUrlForKey(key: string) {
    return `${minioPublicBaseUrl()}/${bucket}/${key}`;
}

async function streamToBuffer(body: Readable | Uint8Array | Blob | string): Promise<Buffer> {
    if (Buffer.isBuffer(body)) return body;
    if (body instanceof Uint8Array) return Buffer.from(body);
    if (typeof body === "string") return Buffer.from(body);
    if (typeof Blob !== "undefined" && body instanceof Blob) {
        return Buffer.from(await body.arrayBuffer());
    }
    const chunks: Buffer[] = [];
    for await (const chunk of body as Readable) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

export async function ensureBucket(): Promise<void> {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }

    const policy = {
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "PublicRead",
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucket}/*`],
            },
        ],
    };

    await s3.send(
        new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(policy),
        })
    );
}

export async function putObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
}): Promise<string> {
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: params.key,
            Body: params.body,
            ContentType: params.contentType,
        })
    );
    return publicUrlForKey(params.key);
}

export async function getObjectBuffer(key: string): Promise<{ body: Buffer; contentType?: string }> {
    const out = await s3.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
    const body = await streamToBuffer(out.Body as Readable);
    return { body, contentType: out.ContentType };
}

export async function deleteObject(key: string | null | undefined): Promise<void> {
    if (!key) return;
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
    } catch (err) {
        console.warn(`[s3] không xóa được object ${key}:`, err);
    }
}

export async function deleteObjects(keys: Array<string | null | undefined>): Promise<void> {
    await Promise.all(keys.map((k) => deleteObject(k)));
}
