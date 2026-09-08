import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkOrigin, failure, HttpError } from "@/lib/http";
import { updateSchema } from "@/lib/validation";
async function authorized(id: string) {
  if (!/^\d+$/.test(id) || Number(id) > 2147483647)
    throw new HttpError(404, "Ticket not found.");
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  const result = await db.query(
    "SELECT t.*,u.name,u.email,u.employee_code FROM tickets t JOIN users u ON u.id=t.user_id WHERE t.id=$1 AND ($2='admin' OR t.user_id=$3)",
    [id, user.role, user.id],
  );
  if (!result.rows[0]) throw new HttpError(404, "Ticket not found.");
  return { user, ticket: result.rows[0] };
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { ticket } = await authorized(id);
    const [comments, events, attachments] = await Promise.all([
      db.query(
        "SELECT c.*,u.name,u.role FROM comments c JOIN users u ON u.id=c.user_id WHERE ticket_id=$1 ORDER BY created_at",
        [id],
      ),
      db.query(
        "SELECT e.*,u.name FROM ticket_events e JOIN users u ON u.id=e.user_id WHERE ticket_id=$1 ORDER BY created_at",
        [id],
      ),
      db.query("SELECT id,name FROM attachments WHERE ticket_id=$1", [id]),
    ]);
    return NextResponse.json({
      ticket,
      comments: comments.rows,
      events: events.rows,
      attachments: attachments.rows,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { id } = await params;
    const { user } = await authorized(id);
    if (user.role !== "admin")
      throw new HttpError(403, "Admin access required.");
    const data = updateSchema.parse(await request.json());
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE tickets SET status=$1,assignee=$2,updated_at=now() WHERE id=$3",
        [data.status, data.assignee || null, id],
      );
      await client.query(
        "INSERT INTO ticket_events(id,ticket_id,user_id,body) VALUES($1,$2,$3,$4)",
        [
          randomUUID(),
          id,
          user.id,
          `Status set to ${data.status}${data.assignee ? `; assigned to ${data.assignee}` : ""}`,
        ],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { id } = await params;
    const { user } = await authorized(id);
    const { body } = z
      .object({ body: z.string().trim().min(1).max(5000) })
      .parse(await request.json());
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO comments(id,ticket_id,user_id,body) VALUES($1,$2,$3,$4)",
        [randomUUID(), id, user.id, body],
      );
      await client.query("UPDATE tickets SET updated_at=now() WHERE id=$1", [
        id,
      ]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
