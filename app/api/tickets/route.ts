import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkOrigin, failure, HttpError } from "@/lib/http";
import { imageMime, ticketSchema } from "@/lib/validation";
export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").slice(0, 200);
    const status = url.searchParams.get("status") ?? "";
    const page = Math.max(
      1,
      Math.min(100000, Math.floor(Number(url.searchParams.get("page")) || 1)),
    );
    const values = [user.role === "admin" ? null : user.id, `%${q}%`, status];
    const where =
      "WHERE ($1::uuid IS NULL OR t.user_id=$1) AND (t.subject ILIKE $2 OR u.name ILIKE $2 OR u.email ILIKE $2 OR u.employee_code ILIKE $2 OR t.id::text ILIKE $2 OR t.reference ILIKE $2 OR ('MH-' || lpad(t.id::text, greatest(4,length(t.id::text)), '0')) ILIKE $2) AND ($3='' OR t.status=$3)";
    const [tickets, count, stats] = await Promise.all([
      db.query(
        `SELECT t.*,u.name,u.email,u.employee_code FROM tickets t JOIN users u ON u.id=t.user_id ${where} ORDER BY t.updated_at DESC LIMIT 20 OFFSET $4`,
        [...values, (page - 1) * 20],
      ),
      db.query(
        `SELECT count(*)::int AS count FROM tickets t JOIN users u ON u.id=t.user_id ${where}`,
        values,
      ),
      db.query(
        "SELECT status,count(*)::int AS count FROM tickets WHERE ($1::uuid IS NULL OR user_id=$1) GROUP BY status",
        [values[0]],
      ),
    ]);
    return NextResponse.json({
      tickets: tickets.rows,
      total: count.rows[0].count,
      stats: stats.rows,
      page,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    if (Number(request.headers.get("content-length")) > 17 * 1024 * 1024)
      throw new HttpError(413, "Attachments are too large.");
    const form = await request.formData();
    const data = ticketSchema.parse(Object.fromEntries(form));
    const files = form
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > 3) throw new HttpError(400, "Attach up to 3 images.");
    const images = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024)
        throw new HttpError(400, "Each image must be 5 MB or smaller.");
      const bytes = Buffer.from(await file.arrayBuffer());
      const mime = imageMime(bytes);
      if (!mime) throw new HttpError(400, "Use PNG, JPEG, or WebP images.");
      images.push({ name: file.name.slice(0, 255), bytes, mime });
    }
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "INSERT INTO tickets(user_id,subject,description,category,priority,subcategory,other_note) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [
          user.id,
          data.subject,
          data.description,
          data.category,
          data.priority,
          data.subcategory || null,
          data.other_note || null,
        ],
      );
      const id = result.rows[0].id;
      const referenceResult = await client.query(
        "UPDATE tickets SET reference='IT-' || to_char(created_at AT TIME ZONE 'Asia/Dubai','YYYY') || '-' || lpad(id::text,greatest(5,length(id::text)),'0') WHERE id=$1 RETURNING reference",
        [id],
      );
      for (const image of images)
        await client.query(
          "INSERT INTO attachments(id,ticket_id,name,mime,data) VALUES($1,$2,$3,$4,$5)",
          [randomUUID(), id, image.name, image.mime, image.bytes],
        );
      await client.query(
        "INSERT INTO ticket_events(id,ticket_id,user_id,body) VALUES($1,$2,$3,$4)",
        [randomUUID(), id, user.id, "Ticket created with status New"],
      );
      await client.query("COMMIT");
      return NextResponse.json(
        { id, reference: referenceResult.rows[0].reference },
        { status: 201 },
      );
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    return failure(e);
  }
}
