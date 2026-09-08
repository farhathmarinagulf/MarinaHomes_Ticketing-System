import { z } from "zod";
import {
  categories,
  categoryOptions,
  priorities,
  statuses,
} from "./ticket-options";
export const ticketSchema = z
  .object({
    subject: z.string().trim().min(5).max(160),
    description: z.string().trim().min(10).max(10000),
    category: z.enum(categories),
    subcategory: z.string().trim().max(150).default(""),
    other_note: z.string().trim().max(1000).default(""),
    priority: z.enum(priorities),
  })
  .superRefine((value, ctx) => {
    const config = categoryOptions[value.category];
    if (config && !config.options.includes(value.subcategory))
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: `Select a valid ${config.label.toLowerCase()}.`,
      });
    if (!config && value.subcategory)
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: "This category does not have a subcategory.",
      });
    if (
      (value.category === "Other" || value.subcategory === "Other") &&
      value.other_note.length < 3
    )
      ctx.addIssue({
        code: "custom",
        path: ["other_note"],
        message:
          "Please add a note explaining your Other selection (at least 3 characters).",
      });
  })
  .transform((value) => ({
    ...value,
    other_note:
      value.category === "Other" || value.subcategory === "Other"
        ? value.other_note
        : "",
  }));
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  employee_code: z.string().trim().min(2).max(40),
  password: z.string().min(12).max(128),
  invite: z.string().min(1),
});
export const updateSchema = z
  .object({
    status: z.enum([...statuses, "Pending", "Completed"]),
    assignee: z.string().trim().max(100),
  })
  .refine((v) => v.status !== "Assigned" || v.assignee.length > 0, {
    message: "Enter an assignee for an assigned ticket.",
  });
export function imageMime(bytes: Buffer): string | null {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}
