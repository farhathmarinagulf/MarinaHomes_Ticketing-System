import { test } from "node:test";
import assert from "node:assert/strict";
import { ticketSchema, updateSchema } from "../lib/validation";
import {
  categories,
  categoryOptions,
  statuses,
  ticketReference,
} from "../lib/ticket-options";
const base = {
  subject: "Workplace support request",
  description: "Please help resolve this workplace issue.",
  priority: "Critical",
};
test("Every PDF category and dependent option can be submitted", () => {
  for (const category of categories) {
    for (const subcategory of categoryOptions[category]?.options ?? [""]) {
      const value = {
        ...base,
        category,
        subcategory,
        other_note:
          category === "Other" || subcategory === "Other"
            ? "A device or issue not listed"
            : "",
      };
      assert.equal(
        ticketSchema.safeParse(value).success,
        true,
        `${category}: ${subcategory}`,
      );
    }
  }
});
test("Reject missing or mismatched subcategory and require Other notes", () => {
  assert.equal(
    ticketSchema.safeParse({ ...base, category: "Hardware" }).success,
    false,
  );
  assert.equal(
    ticketSchema.safeParse({
      ...base,
      category: "Hardware",
      subcategory: "Microsoft Outlook",
    }).success,
    false,
  );
  assert.equal(
    ticketSchema.safeParse({ ...base, category: "Other", other_note: " " })
      .success,
    false,
  );
  assert.equal(
    ticketSchema.safeParse({
      ...base,
      category: "Software",
      subcategory: "Other",
    }).success,
    false,
  );
  assert.equal(
    ticketSchema.safeParse({
      ...base,
      category: "Printing",
      subcategory: "Laptop",
    }).success,
    false,
  );
  assert.equal(
    ticketSchema.parse({
      ...base,
      category: "Printing",
      other_note: "stale note",
    }).other_note,
    "",
  );
});
test("All lifecycle statuses are valid and legacy references remain stable", () => {
  for (const status of statuses)
    assert.equal(
      updateSchema.safeParse({ status, assignee: "IT team" }).success,
      true,
    );
  assert.equal(
    ticketReference({ id: 12, created_at: "2026-01-01" }),
    "MH-0012",
  );
  assert.equal(
    ticketReference({
      id: 12,
      created_at: "2026-01-01",
      reference: "IT-2026-00012",
    }),
    "IT-2026-00012",
  );
});
