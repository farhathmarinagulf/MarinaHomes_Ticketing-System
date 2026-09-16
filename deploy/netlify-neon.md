# Netlify and Neon deployment

Use the Free plans on both services. This deployment requires a new empty Neon
database unless existing data is imported separately. Images are stored in
PostgreSQL and count toward Neon's database storage quota.

1. Create a Neon project. Copy its pooled PostgreSQL connection string, preserving
   its TLS parameters. Never put it in Git or a NEXT_PUBLIC_ variable.
2. Put DATABASE_URL in a local ignored `.env` file. Run `npm ci`, then
   `npm run db:migrate`. Migrations run manually, not during preview builds.
3. Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in the local shell and run
   `npm run admin:create`. Clear those shell variables afterward. No default
   administrator is created. Do not add admin credentials to Netlify.
4. Import `farhathmarinagulf/MarinaHomes_Ticketing-System` into Netlify, branch
   `main`, repository root. The committed netlify.toml selects Node 22,
   `npm run build`, and `.next`. The configuration explicitly enables Netlify's
   Next.js adapter to deploy server routes and APIs as well as static assets.
5. In Netlify's environment settings, set these for the production deployment,
   including Functions scope where scope controls are available:

   | Variable          | Value                                                             |
   | ----------------- | ----------------------------------------------------------------- |
   | DATABASE_URL      | Neon pooled connection string with TLS parameters                 |
   | APP_URL           | Exact HTTPS production origin, e.g. https://your-site.netlify.app |
   | COOKIE_SECURE     | true                                                              |
   | REGISTRATION_CODE | A long private invitation code for staff                          |

   Do not attach the production database to untrusted deploy previews. Set the
   final APP_URL once the site address is assigned and redeploy after changes.

6. Test admin login, staff registration, ticket creation with an image, comments,
   status updates, and isolation between two staff accounts over the public URL.
   Share the production URL and invitation code privately with intended staff.

Netlify's binary request limit is about 4.5 MB. The build configuration sets
NEXT_PUBLIC_ATTACHMENT_LIMIT_MB=4, enforced by both the browser and API. Up to
three images must fit within 4 MB combined, leaving room for multipart form data.
Local/Docker deployments retain their existing 5 MB per-image / 15 MB total limit
unless the same build-time variable is set.

Free plans have usage caps. The dashboard polls every 15 seconds while open,
which consumes hosting requests and database compute. Monitor usage and database
storage, especially when images are attached. Keep database backups separately.

References: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
and https://docs.netlify.com/build/functions/configuration/
