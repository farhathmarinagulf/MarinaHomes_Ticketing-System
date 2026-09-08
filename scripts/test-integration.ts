import EmbeddedPostgres from "embedded-postgres";
import { readFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { once } from "node:events";
import { chromium } from "@playwright/test";
import { hashPassword } from "../lib/password";

async function main() {
  const runId = randomUUID();
  await mkdir("test-results", { recursive: true });
  const postgres = new EmbeddedPostgres({
    databaseDir: `test-results/postgres-${runId}`,
    user: "postgres",
    password: "integration-only-password",
    port: 55439,
    persistent: true,
    onLog: () => {},
    onError: () => {},
  });
  let server: ReturnType<typeof spawn> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    await postgres.initialise();
    await postgres.start();
    await postgres.createDatabase("helpdesk_test");
    const client = postgres.getPgClient("helpdesk_test");
    await client.connect();
    try {
      await client.query(await readFile("db/001_initial.sql", "utf8"));
      await client.query(await readFile("db/002_it_categories.sql", "utf8"));
      await client.query(await readFile("db/001_initial.sql", "utf8"));
      await client.query(await readFile("db/002_it_categories.sql", "utf8"));
      await client.query(
        "INSERT INTO users(id,name,email,employee_code,password_hash,role) VALUES($1,'Test Admin','admin@example.test','ADMIN',$2,'admin')",
        [randomUUID(), await hashPassword("integration-admin-password")],
      );
    } finally {
      await client.end();
    }
    const origin = "http://localhost:3107";
    let logs = "";
    server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-p", "3107"],
      {
        env: {
          ...process.env,
          DATABASE_URL:
            "postgresql://postgres:integration-only-password@localhost:55439/helpdesk_test",
          APP_URL: origin,
          REGISTRATION_CODE: "integration-invite",
          COOKIE_SECURE: "false",
        },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", (d) => (logs += d));
    server.stderr?.on("data", (d) => (logs += d));
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(origin + "/login")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(ready, logs);
    const request = async (
      path: string,
      {
        cookie = "",
        body,
        method = "GET",
        expected = 200,
        foreign = false,
      }: {
        cookie?: string;
        body?: unknown;
        method?: string;
        expected?: number;
        foreign?: boolean;
      } = {},
    ) => {
      const form = body instanceof FormData;
      const response = await fetch(origin + path, {
        method,
        headers: {
          Origin: foreign ? "https://foreign.test" : origin,
          ...(cookie ? { Cookie: cookie } : {}),
          ...(!form && body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? (form ? body : JSON.stringify(body)) : undefined,
      });
      assert.equal(
        response.status,
        expected,
        `${method} ${path}: ${await response.clone().text()}`,
      );
      return response;
    };
    const register = async (email: string, code: string) => {
      const response = await request("/api/auth/register", {
        method: "POST",
        body: {
          name: code,
          email,
          employee_code: code,
          password: "integration-staff-password",
          invite: "integration-invite",
        },
      });
      return response.headers.get("set-cookie")!.split(";")[0];
    };
    await request("/api/tickets", { expected: 401 });
    const alice = await register("alice@example.test", "MH-Alice");
    const bob = await register("bob@example.test", "MH-Bob");
    const adminResponse = await request("/api/auth/login", {
      method: "POST",
      body: {
        email: "admin@example.test",
        password: "integration-admin-password",
      },
    });
    const admin = adminResponse.headers.get("set-cookie")!.split(";")[0];
    const form = new FormData();
    form.set("subject", "Office printer needs attention");
    form.set(
      "description",
      "The printer on the first floor is not responding.",
    );
    form.set("category", "Hardware");
    form.set("subcategory", "Printer");
    form.set("priority", "High");
    form.set("status", "Completed");
    form.append(
      "images",
      new Blob(
        [
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=",
            "base64",
          ),
        ],
        { type: "image/png" },
      ),
      "printer.png",
    );
    const created = await (
      await request("/api/tickets", {
        method: "POST",
        cookie: alice,
        body: form,
        expected: 201,
      })
    ).json();
    const id = created.id;
    const byReference = await (
      await request(`/api/tickets?q=MH-${String(id).padStart(4, "0")}`, {
        cookie: alice,
      })
    ).json();
    assert.equal(byReference.total, 1);
    const detail = await (
      await request(`/api/tickets/${id}`, { cookie: alice })
    ).json();
    assert.equal(detail.ticket.status, "New");
    assert.equal(detail.ticket.subcategory, "Printer");
    assert.match(detail.ticket.reference, /^IT-\d{4}-\d{5,}$/);
    assert.equal(detail.attachments.length, 1);
    await request(`/api/tickets/${id}`, { cookie: bob, expected: 404 });
    await request(`/api/attachments/${detail.attachments[0].id}`, {
      cookie: bob,
      expected: 404,
    });
    await request(`/api/attachments/${detail.attachments[0].id}`, {
      cookie: alice,
    });
    assert.equal(
      (await (await request("/api/tickets", { cookie: bob })).json()).total,
      0,
    );
    await request(`/api/tickets/${id}`, {
      cookie: alice,
      method: "PATCH",
      body: { status: "Closed", assignee: "" },
      expected: 403,
    });
    await request(`/api/tickets/${id}`, {
      cookie: admin,
      method: "PATCH",
      body: { status: "Assigned", assignee: "" },
      expected: 400,
    });
    await request(`/api/tickets/${id}`, {
      cookie: admin,
      method: "PATCH",
      body: { status: "Assigned", assignee: "IT team" },
    });
    await request(`/api/tickets/${id}`, {
      cookie: admin,
      method: "POST",
      body: { body: "We are checking the printer." },
      expected: 201,
    });
    await request(`/api/tickets/${id}`, {
      cookie: alice,
      method: "POST",
      body: { body: "Thank you, the printer is by reception." },
      expected: 201,
    });
    await request(`/api/tickets/${id}`, {
      cookie: alice,
      method: "POST",
      body: { body: "Forged comment" },
      foreign: true,
      expected: 403,
    });
    const updated = await (
      await request(`/api/tickets/${id}`, { cookie: alice })
    ).json();
    assert.equal(updated.ticket.status, "Assigned");
    assert.equal(updated.comments.length, 2);
    assert.equal(updated.events.length, 2);
    assert.equal(
      (
        await (
          await request("/api/tickets?q=MH-Alice&status=Assigned", {
            cookie: admin,
          })
        ).json()
      ).total,
      1,
    );
    await request(`/api/tickets/${id}`, {
      cookie: admin,
      method: "PATCH",
      body: { status: "Closed", assignee: "IT team" },
    });
    assert.equal(
      (await (await request(`/api/tickets/${id}`, { cookie: alice })).json())
        .ticket.status,
      "Closed",
    );
    await request("/api/auth/logout", { method: "POST", cookie: bob });
    await request("/api/tickets", { cookie: bob, expected: 401 });
    console.log(
      "PASS: migrations, registration, authentication, ticket creation, image access, staff isolation, admin authorization, assignment validation, search/filter, comments, CSRF, status tracking, and logout.",
    );
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.addCookies([
      { name: "marina_session", value: admin.split("=")[1], url: origin },
    ]);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin + "/dashboard");
    await page
      .getByText("Office printer needs attention", { exact: true })
      .waitFor();
    await page.screenshot({
      path: "test-results/admin-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Create ticket", exact: true })
      .click();
    await page
      .getByLabel("Subject", { exact: true })
      .fill("Browser created maintenance request");
    await page
      .getByLabel("Problem / comments")
      .fill("The meeting room air conditioner needs to be checked.");
    const categoryField = page.getByLabel("IT Category", { exact: true });
    await categoryField.selectOption("Hardware");
    await page.getByLabel("Device Type", { exact: true }).selectOption("Other");
    await page.getByLabel("Other — please specify").fill("Unlisted hardware");
    await categoryField.selectOption("Software");
    assert.equal(await page.getByLabel("Other — please specify").count(), 0);
    assert.equal(
      await page
        .getByLabel("Software/Application", { exact: true })
        .inputValue(),
      "",
    );
    await categoryField.selectOption("Other");
    await page
      .getByLabel("Other — please specify")
      .fill("Office air conditioning controls");
    await page.getByLabel("Priority", { exact: true }).selectOption("Critical");
    const categoryBox = await categoryField.boundingBox();
    const priorityBox = await page
      .getByLabel("Priority", { exact: true })
      .boundingBox();
    const subjectBox = await page
      .getByLabel("Subject", { exact: true })
      .boundingBox();
    assert.ok(
      categoryBox &&
        priorityBox &&
        subjectBox &&
        Math.abs(categoryBox.y - priorityBox.y) < 2 &&
        subjectBox.y > categoryBox.y,
    );
    await page.screenshot({
      path: "test-results/create-ticket-categories.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "test-results/create-ticket-categories-mobile.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Submit ticket", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Browser created maintenance request" })
      .waitFor();
    await page
      .getByText("Office air conditioning controls", { exact: true })
      .waitFor();
    await page.getByText("Critical priority", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "test-results/admin-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
      "Mobile page overflows",
    );
    await context.clearCookies();
    await page.goto(origin + "/login");
    await page.getByLabel("Work email").fill("alice@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("integration-staff-password");
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .last()
      .click();
    await page.waitForURL("**/dashboard");
    await page
      .getByText("Office printer needs attention", { exact: true })
      .waitFor();
    await page.screenshot({
      path: "test-results/staff-mobile.png",
      fullPage: true,
    });
    await request(`/api/tickets/${id}`, {
      cookie: admin,
      method: "PATCH",
      body: { status: "Assigned", assignee: "IT follow-up" },
    });
    await page
      .locator(".table-scroll .badge")
      .filter({ hasText: "Assigned" })
      .waitFor({ timeout: 22000 });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: browser admin ticket creation, staff login, responsive dashboard, automatic status refresh, no page errors. Screenshots: test-results/.",
    );
  } finally {
    await browser?.close();
    if (server) {
      const stopped = once(server, "exit");
      server.kill();
      await Promise.race([stopped, new Promise((r) => setTimeout(r, 5000))]);
    }
    await postgres.stop();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
