import crypto from "crypto";

export function randomUrlSafe(byteLength = 32): string {
    return crypto.randomBytes(byteLength).toString("base64url");
}

export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = randomUrlSafe(32);
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    return { codeVerifier, codeChallenge };
}
