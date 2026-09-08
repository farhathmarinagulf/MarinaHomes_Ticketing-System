import "dotenv/config";
import { db } from "../lib/db";
import { hashPassword } from "../lib/password";
async function main() {
  const { RESET_EMAIL, RESET_PASSWORD } = process.env;
  if (
    !RESET_EMAIL ||
    !RESET_PASSWORD ||
    RESET_PASSWORD.length < 12 ||
    RESET_PASSWORD.length > 128
  )
    throw new Error(
      "Set RESET_EMAIL and RESET_PASSWORD (12–128 characters). This also revokes existing sessions.",
    );
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "UPDATE users SET password_hash=$1 WHERE email=$2 RETURNING id",
      [await hashPassword(RESET_PASSWORD), RESET_EMAIL.trim().toLowerCase()],
    );
    if (!result.rowCount) throw new Error("Account not found.");
    await client.query("DELETE FROM sessions WHERE user_id=$1", [
      result.rows[0].id,
    ]);
    await client.query("COMMIT");
    console.log("Password reset and sessions revoked.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
