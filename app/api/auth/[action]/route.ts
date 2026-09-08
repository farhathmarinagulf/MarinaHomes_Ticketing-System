import { NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { createSession, digest, logout } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { checkOrigin, failure, HttpError } from "@/lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    checkOrigin(request);
    const { action } = await params;
    if (action === "logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    if (!["login", "register"].includes(action))
      throw new HttpError(404, "Not found");
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const key = digest(email);
    const limit = await db.query(
      "INSERT INTO auth_limits(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_limits.reset_at<now() THEN 1 ELSE auth_limits.attempts+1 END,reset_at=CASE WHEN auth_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE auth_limits.reset_at END RETURNING attempts",
      [key],
    );
    if (limit.rows[0].attempts > 15)
      throw new HttpError(429, "Too many attempts. Try again in 15 minutes.");
    let userId: string;
    if (action === "register") {
      const data = registerSchema.parse({ ...body, email });
      const expected = process.env.REGISTRATION_CODE;
      if (
        !expected ||
        !timingSafeEqual(
          Buffer.from(digest(data.invite)),
          Buffer.from(digest(expected)),
        )
      )
        throw new HttpError(403, "Invalid staff invitation code.");
      userId = randomUUID();
      try {
        await db.query(
          "INSERT INTO users(id,name,email,employee_code,password_hash) VALUES($1,$2,$3,$4,$5)",
          [
            userId,
            data.name,
            data.email,
            data.employee_code,
            await hashPassword(data.password),
          ],
        );
      } catch (e) {
        if ((e as { code?: string }).code === "23505")
          throw new HttpError(
            409,
            "Email or employee code is already registered.",
          );
        throw e;
      }
    } else {
      if (typeof body.password !== "string" || body.password.length > 128)
        throw new HttpError(400, "Invalid credentials.");
      const result = await db.query(
        "SELECT id,password_hash FROM users WHERE email=$1",
        [email],
      );
      const user = result.rows[0];
      const fallback = "00000000000000000000000000000000:" + "00".repeat(64);
      const valid = await verifyPassword(
        body.password,
        user?.password_hash ?? fallback,
      );
      if (!user || !valid)
        throw new HttpError(401, "Email or password is incorrect.");
      userId = user.id;
    }
    await createSession(userId);
    await db.query("DELETE FROM auth_limits WHERE key=$1", [key]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
