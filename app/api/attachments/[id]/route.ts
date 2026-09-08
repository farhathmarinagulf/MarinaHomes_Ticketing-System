import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { failure, HttpError } from "@/lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id))
      throw new HttpError(404, "Image not found.");
    const result = await db.query(
      "SELECT a.* FROM attachments a JOIN tickets t ON t.id=a.ticket_id WHERE a.id=$1 AND ($2='admin' OR t.user_id=$3)",
      [id, user.role, user.id],
    );
    const file = result.rows[0];
    if (!file) throw new HttpError(404, "Image not found.");
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
