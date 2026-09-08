"use client";
import { useState } from "react";
import { categories, categoryOptions, priorities } from "@/lib/ticket-options";
export default function TicketFields() {
  const [category, setCategory] = useState<string>("");
  const [subcategory, setSubcategory] = useState("");
  const config = categoryOptions[category];
  const needsNote = category === "Other" || subcategory === "Other";
  return (
    <>
      <div className="form-grid">
        <label>
          IT Category
          <select
            name="category"
            aria-label="IT Category"
            required
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
            autoFocus
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select name="priority" aria-label="Priority" defaultValue="Medium">
            {priorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Subject
        <input
          name="subject"
          required
          minLength={5}
          maxLength={160}
          placeholder="A short summary of your request"
        />
      </label>
      {config && (
        <label>
          {config.label}
          <select
            name="subcategory"
            aria-label={config.label}
            required
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          >
            <option value="" disabled>
              Select an option
            </option>
            {config.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      )}
      {needsNote && (
        <div className="other-note" key={`${category}-${subcategory}`}>
          <label>
            Other — please specify
            <textarea
              name="other_note"
              required
              minLength={3}
              maxLength={1000}
              rows={3}
              placeholder="Tell us the category, device, application, or issue that is not listed."
            />
            <small>
              Add a short note so the IT team can direct your request.
            </small>
          </label>
        </div>
      )}
    </>
  );
}
