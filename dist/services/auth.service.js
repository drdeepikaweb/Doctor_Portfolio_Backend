import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const keyLength = 64;
export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, keyLength));
    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}
export async function verifyPassword(password, passwordHash) {
    const [scheme, salt, storedHash] = passwordHash.split(":");
    if (scheme !== "scrypt" || !salt || !storedHash)
        return false;
    const storedBuffer = Buffer.from(storedHash, "hex");
    const derivedKey = (await scrypt(password, salt, storedBuffer.length));
    return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey);
}
export function createSessionToken() {
    return randomBytes(32).toString("hex");
}
export function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
