import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { hashPassword } from "../lib/password";
async function main() {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME = "Administrator",
    ADMIN_EMPLOYEE_CODE = "ADMIN",
  } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12)
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters). Optional: ADMIN_NAME, ADMIN_EMPLOYEE_CODE.",
    );
  await db.query(
    "INSERT INTO users(id,name,email,employee_code,password_hash,role) VALUES($1,$2,$3,$4,$5,'admin')",
    [
      randomUUID(),
      ADMIN_NAME,
      ADMIN_EMAIL.toLowerCase().trim(),
      ADMIN_EMPLOYEE_CODE,
      await hashPassword(ADMIN_PASSWORD),
    ],
  );
  console.log("Admin created.");
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
