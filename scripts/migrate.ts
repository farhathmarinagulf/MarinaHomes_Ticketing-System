import "dotenv/config";
import { readFile } from "node:fs/promises";
import { db } from "../lib/db";
async function main() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(await readFile("db/001_initial.sql", "utf8"));
    await client.query(await readFile("db/002_it_categories.sql", "utf8"));
    await client.query("COMMIT");
    console.log("Database migration complete.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await db.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
