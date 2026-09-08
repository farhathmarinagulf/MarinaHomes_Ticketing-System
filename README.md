# Marina Homes Staff Helpdesk

Next.js App Router application with a PostgreSQL database. Staff can register using an internal invitation code, sign in, create tickets with up to three images, view their own requests, and add comments. Administrators can search all tickets by subject, ticket number, name, email or employee code, filter by status, assign a person/team, update status, and reply. Dashboards and open ticket details refresh every 15 seconds.

Tickets start New. Admins can set New, Acknowledged, Assigned, In Progress, Pending User, Resolved or Closed. Existing Pending and Completed tickets remain readable. The category form includes PDF subcategories, Other notes, Critical priority and IT-YYYY-00001 references. See deploy/category-update.md for details. Staff name, email and employee code come from their authenticated profile. Images are stored in PostgreSQL and served only to their owner or administrators. Assignment is a person/team name, not an email notification.

## Local development

Requires Node.js 22 and PostgreSQL 17. Copy `.env.example` to `.env`, set a real `DATABASE_URL`, private `REGISTRATION_CODE`, and `APP_URL=http://localhost:3000`. Keep `COOKIE_SECURE=false` only for local HTTP.

```sh
npm ci
npm run db:migrate
npm run dev
```

Create the first administrator by setting `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters), and optionally `ADMIN_NAME` and `ADMIN_EMPLOYEE_CODE` in the shell, then run `npm run admin:create`. The command creates a new admin and refuses duplicate identities. There is no default password or public admin registration.

## Docker server deployment

1. Copy this project onto your server and copy `.env.example` to `.env`.
2. Set a strong `POSTGRES_PASSWORD` using URL-safe letters/numbers, a private `REGISTRATION_CODE`, `APP_URL=https://helpdesk.your-domain.com`, and `COOKIE_SECURE=true`. Do not commit `.env`.
3. Run `docker compose up -d --build`. PostgreSQL health checks and the migration must succeed before the app starts. Application traffic binds to server localhost port 3000; the database is not publicly exposed.
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the server shell, then run `docker compose --profile tools run --rm admin`. Unset the password afterward.
5. Configure your reverse proxy using `deploy/nginx.conf` as a starting point. Replace its domain and enable HTTPS with your server certificate tooling before staff use. Preserve the Origin header and set the upload limit to 17 MB. The APP_URL must match the exact browser origin.
6. Link the support icon on your main website to `https://helpdesk.your-domain.com`. Share the staff invitation code only with internal staff.

For a local Docker preview, use `APP_URL=http://localhost:3000` and `COOKIE_SECURE=false` in `.env`.

```html
<a
  href="https://helpdesk.your-domain.com"
  aria-label="Staff helpdesk"
  title="Staff helpdesk"
>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    aria-hidden="true"
  >
    <path
      d="M3 13v-1a9 9 0 0 1 18 0v1M3 12h3v8H4a1 1 0 0 1-1-1v-7Zm18 0h-3v8h2a1 1 0 0 0 1-1v-7ZM18 20c0 1-2 2-6 2"
    />
  </svg>
</a>
```

## Operations

- Back up the `postgres_data` volume through PostgreSQL backups; it contains users, tickets, conversations and images. Never run `docker compose down -v` unless you intend to erase all data.
- Linux backup example: `docker compose exec -T db pg_dump -U marina marina > marina-backup.sql`. Test restores to a separate database. Store backups securely.
- To deploy updates, back up first, then run `docker compose up -d --build` and inspect `docker compose logs app migrate`.
- No email provider, SSO, or self-service password reset is configured. For password recovery, the server operator can use `npm run password:reset` (see command help). New accounts require the internal invitation code; restrict access to your VPN if your organization needs stronger staff verification.
- Login/registration attempts are limited per email in PostgreSQL. Configure additional request/IP rate limits at your reverse proxy for an internet-facing deployment. Sessions expire after 7 days. Set a scheduled database cleanup for expired sessions and expired auth_limits records as usage grows.
- Status changes and comments are stored transactionally. Image content accepts JPEG, PNG and WebP signatures; SVG and HTML uploads are rejected. Uploaded images are not malware-scanned.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

`npm run test:integration` runs the built app with a temporary PostgreSQL 17 cluster and a headless Microsoft Edge browser. It checks account isolation, attachment permissions, ticket status updates, comments, search, authentication, and browser ticket creation. It uses local ports 55439 and 3107 and saves screenshots and test database files under ignored `test-results/`. Run it after `npm run build`; Edge must be installed. Temporary test services stop when the test finishes.

For an operator password reset, set `RESET_EMAIL` and `RESET_PASSWORD` (12–128 characters), then run `npm run password:reset`. In Docker, use `docker compose --profile tools run --rm -e RESET_EMAIL -e RESET_PASSWORD admin npm run password:reset`. All existing sessions for that account are revoked. Unset the password afterward.

Before production use, validate two separate staff accounts and an admin: submit an image ticket, confirm the other staff account cannot see it or its image, update its status as admin, and verify the owner sees the change and can reply. Check the same flow through your HTTPS reverse proxy.

Architecture references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [PostgreSQL node driver](https://node-postgres.com/).
