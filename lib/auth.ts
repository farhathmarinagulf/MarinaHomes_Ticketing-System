import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export type User = {
  id: string;
  name: string;
  email: string;
  employee_code: string;
  role: "staff" | "admin";
};
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("marina_session")?.value;
  if (!token) return null;
  const result = await db.query(
    "SELECT u.id,u.name,u.email,u.employee_code,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=$1 AND expires_at>now()",
    [digest(token)],
  );
  return result.rows[0] ?? null;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
    [digest(token), userId],
  );
  (await cookies()).set("marina_session", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("marina_session")?.value;
  if (token)
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [digest(token)]);
  jar.delete("marina_session");
}
