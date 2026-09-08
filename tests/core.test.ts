import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  ticketSchema,
  registerSchema,
  updateSchema,
  imageMime,
} from "../lib/validation";
test("Passwords are salted and reject incorrect credentials", async () => {
  const one = await hashPassword("correct-horse-123");
  const two = await hashPassword("correct-horse-123");
  assert.notEqual(one, two);
  assert.equal(await verifyPassword("correct-horse-123", one), true);
  assert.equal(await verifyPassword("wrong", one), false);
  assert.equal(await verifyPassword("wrong", "malformed"), false);
});
test("Ticket creation rejects missing details and unknown priority", () => {
  const valid = {
    subject: "Printer is offline",
    description: "The office printer is not responding.",
    category: "Printing",
    priority: "Medium",
  };
  assert.equal(ticketSchema.safeParse(valid).success, true);
  assert.equal(
    ticketSchema.safeParse({ ...valid, description: " " }).success,
    false,
  );
  assert.equal(
    ticketSchema.safeParse({ ...valid, priority: "Urgent" }).success,
    false,
  );
  assert.equal(
    "status" in ticketSchema.parse({ ...valid, status: "Completed" }),
    false,
  );
});
test("Assigned tickets require an assignee; unsupported status is rejected", () => {
  assert.equal(
    updateSchema.safeParse({ status: "Assigned", assignee: "" }).success,
    false,
  );
  assert.equal(
    updateSchema.safeParse({ status: "Assigned", assignee: "IT team" }).success,
    true,
  );
  assert.equal(
    updateSchema.safeParse({ status: "Deleted", assignee: "" }).success,
    false,
  );
});
test("Staff registration enforces identity and a strong minimum password length", () => {
  const valid = {
    name: "Alex Staff",
    email: "Alex@example.com",
    employee_code: "MH-123",
    password: "strong-password-123",
    invite: "staff-secret",
  };
  assert.equal(registerSchema.parse(valid).email, "alex@example.com");
  assert.equal(
    registerSchema.safeParse({ ...valid, password: "123" }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...valid, email: "invalid" }).success,
    false,
  );
});
test("Attachment type is inspected from content and rejects SVG/HTML", () => {
  assert.equal(imageMime(Buffer.from('<svg onload="alert(1)"></svg>')), null);
  assert.equal(
    imageMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.equal(imageMime(Buffer.from([255, 216, 255, 0])), "image/jpeg");
  assert.equal(imageMime(Buffer.from("RIFF1234WEBP")), "image/webp");
  assert.equal(imageMime(Buffer.alloc(0)), null);
});
