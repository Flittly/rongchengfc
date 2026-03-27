import { randomBytes } from "node:crypto";

export function createVerificationToken() {
  return randomBytes(32).toString("hex");
}
