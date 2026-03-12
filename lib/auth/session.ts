import { randomBytes } from "node:crypto";
import "server-only";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function getSessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}
