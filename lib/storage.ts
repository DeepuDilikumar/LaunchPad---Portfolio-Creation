import fs from "node:fs";
import path from "node:path";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Private file storage. Cloudflare R2 (S3 API) in production; a local folder (.data/storage)
 * in development. Master PDFs live under `masters/`, stamped copies under `stamped/<orderId>/`.
 */
export interface Storage {
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** A short-lived URL the buyer's browser can download from. */
  signedUrl(key: string, seconds: number, filename: string): Promise<string>;
}

class R2Storage implements Storage {
  constructor(
    private client: S3Client,
    private bucket: string,
  ) {}
  async get(key: string) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return res.Body ? new Uint8Array(await res.Body.transformToByteArray()) : null;
    } catch (err) {
      if ((err as { name?: string }).name === "NoSuchKey") return null;
      throw err;
    }
  }
  async put(key: string, body: Uint8Array, contentType: string) {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }
  async exists(key: string) {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
  async signedUrl(key: string, seconds: number, filename: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      }),
      { expiresIn: seconds },
    );
  }
}

export class LocalStorage implements Storage {
  constructor(private root: string) {}
  private file(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(path.resolve(this.root))) throw new Error("bad key");
    return p;
  }
  async get(key: string) {
    const f = this.file(key);
    return fs.existsSync(f) ? new Uint8Array(fs.readFileSync(f)) : null;
  }
  async put(key: string, body: Uint8Array, _contentType?: string) {
    void _contentType;
    const f = this.file(key);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, body);
  }
  async exists(key: string) {
    return fs.existsSync(this.file(key));
  }
  async signedUrl(key: string) {
    // Development only: the download route streams local files itself.
    return `local:${key}`;
  }
}

const g = globalThis as unknown as { __sqStorage?: Storage };

export function getStorage(): Storage {
  if (g.__sqStorage) return g.__sqStorage;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });
    g.__sqStorage = new R2Storage(client, R2_BUCKET);
  } else {
    g.__sqStorage = new LocalStorage(path.join(process.cwd(), ".data", "storage"));
  }
  return g.__sqStorage;
}

export function setStorage(s: Storage | undefined): void {
  g.__sqStorage = s;
}

export function masterKey(guide: string, edition: "a4" | "phone"): string {
  return `masters/${guide}/current-${edition}.pdf`;
}

export function stampedKey(orderId: string, guide: string, edition: "a4" | "phone"): string {
  return `stamped/${orderId}/${guide}-${edition}.pdf`;
}
